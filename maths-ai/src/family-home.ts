import {visit,saveVisits} from './visit';
import {authenticate,reject} from './access';

export async function familyHome(db:D1Database,path:string,packet:any) {
  if(path==='visit-salt'||path==='visit-open')return visit(db,path,packet);
  await db.prepare('CREATE TABLE IF NOT EXISTS family_home (id INTEGER PRIMARY KEY, salt TEXT, verifier TEXT, box TEXT, revision INTEGER, tries INTEGER DEFAULT 0, since INTEGER DEFAULT 0)').run();
  if(path==='home-publish'){
    const actor=await authenticate(db,packet,path);
    if(actor.role!=='dad')reject('Dad needs to sign in.');
    const {salt,verifier,box,revision}=packet.body.data;
    if(!/^[A-Za-z0-9_-]{43}$/.test(salt)||!/^[A-Za-z0-9_-]{43}$/.test(verifier)||typeof box!=='string'||box.length>140000||!Number.isSafeInteger(revision)||revision<1)reject('Invalid family settings.',400);
    await db.prepare('INSERT INTO family_home (id,salt,verifier,box,revision) VALUES (1,?,?,?,?) ON CONFLICT(id) DO UPDATE SET box=excluded.box, revision=excluded.revision, verifier=excluded.verifier, salt=excluded.salt WHERE excluded.revision>=family_home.revision').bind(salt,verifier,box,revision).run();
    await saveVisits(db,packet.body.data.visits,packet.body.family,revision);
    return {ready:true};
  }
  const row=await db.prepare('SELECT salt,revision FROM family_home WHERE id=1').first<{salt:string,revision:number}>();
  if(path==='home-status')return row||{ready:false};
  if(!row)throw Object.assign(Error('Open ETM as Dad on the laptop with your music first.'),{status:409});
  if(typeof packet.proof!=='string'||!/^[A-Za-z0-9_-]{43}$/.test(packet.proof))reject('Enter Dad’s PIN.');
  const now=Date.now(),cutoff=now-900000;
  const attempt=await db.prepare('UPDATE family_home SET tries=CASE WHEN since<=? THEN 1 ELSE tries+1 END, since=CASE WHEN since<=? THEN ? ELSE since END WHERE id=1 AND (since<=? OR tries<5)').bind(cutoff,cutoff,now,cutoff).run();
  if(!attempt.meta.changes)reject('Too many attempts. Try again in 15 minutes.',429);
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(packet.proof));
  const verifier=btoa(String.fromCharCode(...new Uint8Array(digest))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
  const match=await db.prepare('SELECT box FROM family_home WHERE id=1 AND verifier=? AND salt=?').bind(verifier,row.salt).first();
  if(!match)reject('That PIN didn’t match.',401);
  await db.prepare('UPDATE family_home SET tries=0,since=0 WHERE id=1 AND verifier=?').bind(verifier).run();
  return match;
}
