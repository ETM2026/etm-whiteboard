import {chunkAction} from './sync-chunks';
import {reject,verify} from './access';
const names=['Dad','Emily','Tommy','Matthew'];
const collections=['pieces','settings','progress','learning','study','tables','preferences','shared','private','santa','corrections','creations'];
export async function handleFamilySync(db:any,s:any,data:any){
 const writes=data?.writes||[],messages=data?.messages||[];
 if(!Array.isArray(writes)||writes.length>80||!Array.isArray(messages)||messages.length>40||typeof data?.device!=='string'||! /^[a-zA-Z0-9-]{16,80}$/.test(data.device))reject('Invalid sync request.',400);
 await db.prepare('CREATE TABLE IF NOT EXISTS family_records (owner TEXT NOT NULL, collection TEXT NOT NULL, id TEXT NOT NULL, version INTEGER NOT NULL, value TEXT, PRIMARY KEY(owner,collection,id))').run();
 await db.prepare('CREATE TABLE IF NOT EXISTS family_relay (seq INTEGER PRIMARY KEY AUTOINCREMENT, sender TEXT NOT NULL, nonce TEXT UNIQUE NOT NULL, expires INTEGER NOT NULL, packet TEXT NOT NULL)').run();
 // Validate the entire batch before mutating anything. The AI route keeps its separate Emily-only gate.
 const checkWrite=(w:any)=>{if(!w||!names.concat('Shared').includes(w.owner)||!collections.includes(w.collection)||typeof w.id!=='string'||w.id.length>180||!w.id||!('value' in w)||!Number.isSafeInteger(w.version)||w.version<0||(w.value!==null&&typeof w.value!=='object')||JSON.stringify(w.value).length>1500000||w.value?.__etmTransfer)reject('Invalid saved item.',400);if(s.role!=='dad'&&(w.owner!==s.name||['shared','private','corrections'].includes(w.collection)))reject('Only Dad can change another profile.');if(w.owner==='Shared'&&w.collection!=='shared')reject('Invalid shared collection.');if(w.collection==='private'&&w.owner!=='Dad')reject('Private data belongs to Dad.');};
 for(const w of writes)checkWrite(w);
 if(data.chunk){if(data.protocol!==2)reject('Refresh ETM to receive larger saved items.',409);if(writes.length||messages.length)reject('Send transfer parts separately.',400);return chunkAction(db,s,data.chunk,checkWrite);}
 const family:any=await db.prepare('SELECT * FROM ai_family WHERE id=1').first(),directory=JSON.parse(family.children),credential=s.role==='dad'?JSON.parse(family.root):directory[s.name];
 for(const packet of messages){const b=packet?.body;if(!b||b.name!==s.name||b.role!==s.role||b.family!==family.family||b.epoch!==credential.epoch||b.from!==data.member||!Number.isFinite(b.at)||Math.abs(Date.now()-b.at)>60000||typeof b.nonce!=='string'||b.nonce.length>200||JSON.stringify(packet).length>150000||!await verify(credential.pub,b,packet.sig))reject('Invalid Together message.');}
 const accepted:any[]=[];
 for(const w of writes){if(w.collection==='creations'&&w.value?.item)w.value.item.author=w.owner;const value=w.value===null?null:JSON.stringify(w.value);const r=w.version===0?await db.prepare('INSERT OR IGNORE INTO family_records (owner,collection,id,version,value) VALUES (?,?,?,1,?)').bind(w.owner,w.collection,w.id,value).run():await db.prepare('UPDATE family_records SET value=?,version=version+1 WHERE owner=? AND collection=? AND id=? AND version=?').bind(value,w.owner,w.collection,w.id,w.version).run();if(r.meta.changes)accepted.push({owner:w.owner,collection:w.collection,id:w.id,version:w.version+1});}
 await db.prepare('DELETE FROM family_relay WHERE expires<?').bind(Date.now()).run();
 for(const packet of messages)await db.prepare('INSERT OR IGNORE INTO family_relay (sender,nonce,expires,packet) VALUES (?,?,?,?)').bind(data.device,packet.body.nonce,Date.now()+120000,JSON.stringify(packet)).run();
 const offset=Number.isSafeInteger(data.offset)&&data.offset>=0?data.offset:0;
 const records= data.relayOnly?{results:[]}:s.role==='dad'?await db.prepare('SELECT * FROM family_records ORDER BY owner,collection,id LIMIT 401 OFFSET ?').bind(offset).all():await db.prepare("SELECT * FROM family_records WHERE owner=? OR owner='Shared' OR collection='creations' ORDER BY owner,collection,id LIMIT 401 OFFSET ?").bind(s.name,offset).all();
 const relay=await db.prepare('SELECT seq,packet FROM family_relay WHERE seq>? AND sender<>? ORDER BY seq LIMIT 100').bind(Number.isSafeInteger(data.cursor)?data.cursor:0,data.device).all();
 const page:any[]=[];let bytes=0;for(const r of records.results.slice(0,400)){const size=(r.value?.length||4)+300;if(page.length&&bytes+size>1200000)break;bytes+=size;page.push({...r,value:r.value===null?null:JSON.parse(r.value)});}
 if(data.protocol!==2&&page.some(r=>r.value?.__etmTransfer))reject('Refresh ETM on this device to receive larger saved items.',409);
 return {accepted,records:page,next:records.results.length>page.length?offset+page.length:null,messages:relay.results.map((r:any)=>({seq:r.seq,packet:JSON.parse(r.packet)}))};
}
