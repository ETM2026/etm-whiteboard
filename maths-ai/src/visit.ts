import {canonical,reject} from './access';

const profiles=['Emily','Tommy','Matthew'];
export async function saveVisits(db:D1Database,bundles:any[],family:string,revision:number){
  if(!Array.isArray(bundles)||bundles.length>3)reject('Invalid profiles.',400);
  await db.prepare('CREATE TABLE IF NOT EXISTS home_visits (name TEXT PRIMARY KEY, document TEXT, revision INTEGER, attempts INTEGER DEFAULT 0, since INTEGER DEFAULT 0)').run();
  for(const row of bundles){
    if(!profiles.includes(row.name)||row.manifest?.family!==family||row.manifest?.revision!==revision)reject('Invalid profile.',400);
    await db.prepare('INSERT INTO home_visits (name,document,revision) VALUES (?,?,?) ON CONFLICT(name) DO UPDATE SET document=excluded.document,revision=excluded.revision WHERE excluded.revision>=home_visits.revision')
      .bind(row.name,JSON.stringify(row.manifest),revision).run();
  }
}
const bytes=(s:string)=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export async function visit(db:D1Database,path:string,p:any){
  if(!profiles.includes(p.name))reject('Choose a child profile.',400);
  const ready=await db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='home_visits'").first();
  const row=ready&&await db.prepare('SELECT document FROM home_visits WHERE name=?').bind(p.name).first<{document:string}>();
  if(!row)throw Object.assign(Error('Family sign-in is getting ready. Open the updated app as Dad on the original laptop once.'),{status:409});
  const manifest=JSON.parse(row.document),credential=manifest.children[p.name];
  const directory=await db.prepare('SELECT family,children FROM ai_family WHERE id=1').first<{family:string,children:string}>();
  const enrolled=directory&&JSON.parse(directory.children)[p.name];
  if(directory?.family!==manifest.family||enrolled?.epoch!==credential.epoch||canonical(enrolled.pub)!==canonical(credential.pub))reject('The profile is updating. Try again shortly.',409);
  if(path==='visit-salt')return {salt:credential.salt};
  if(typeof p.key!=='string'||p.key.length!==44)reject('Enter your PIN.');
  const now=Date.now(),cut=now-900000;
  const r=await db.prepare('UPDATE home_visits SET attempts=CASE WHEN since<=? THEN 1 ELSE attempts+1 END,since=CASE WHEN since<=? THEN ? ELSE since END WHERE name=? AND (since<=? OR attempts<5)').bind(cut,cut,now,p.name,cut).run();
  if(!r.meta.changes)reject('Too many tries. Try again in 15 minutes.',429);
  try{
    const key=await crypto.subtle.importKey('raw',bytes(p.key),'AES-GCM',false,['decrypt']);
    await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes(credential.iv),additionalData:new TextEncoder().encode(credential.aad)},key,bytes(credential.cipher));
  }catch{reject('That PIN didn’t match.',401)}
  await db.prepare('UPDATE home_visits SET attempts=0,since=0 WHERE name=?').bind(p.name).run();
  return {manifest};
}
