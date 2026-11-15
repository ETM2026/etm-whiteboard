import {reject} from './access';
export const CHUNK_SIZE=200000,MAX_ITEM=12000000;
export function canRead(s:any,r:any){return s.role==='dad'||r.owner===s.name||r.owner==='Shared'||r.collection==='creations'}
export async function digest(text:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text)))).map(b=>b.toString(16).padStart(2,'0')).join('')}
export async function chunkAction(db:any,s:any,c:any,checkWrite:(w:any)=>void){
 await db.prepare('CREATE TABLE IF NOT EXISTS family_chunks (upload TEXT NOT NULL, owner TEXT NOT NULL, collection TEXT NOT NULL, id TEXT NOT NULL, base INTEGER NOT NULL, author TEXT NOT NULL, part INTEGER NOT NULL, total INTEGER NOT NULL, digest TEXT NOT NULL, payload TEXT NOT NULL, created INTEGER NOT NULL, PRIMARY KEY(upload,part))').run();
 if(!c||typeof c.upload!=='string'||! /^[a-f0-9-]{36}$/.test(c.upload))reject('Invalid transfer.',400);
 if(c.kind==='get'){
  if(!Number.isInteger(c.part)||c.part<0||c.part>=64)reject('Invalid transfer part.',400);
  const row:any=await db.prepare('SELECT * FROM family_chunks WHERE upload=? AND part=?').bind(c.upload,c.part).first();if(!row||!canRead(s,row))reject('This transfer is not available.',404);
  // Only committed transfers can be downloaded; uncommitted data belongs to its author.
  const doc:any=await db.prepare('SELECT value FROM family_records WHERE owner=? AND collection=? AND id=?').bind(row.owner,row.collection,row.id).first();let ref:any;try{ref=JSON.parse(doc?.value||'null')}catch{}
  if(ref?.__etmTransfer!==c.upload&&row.author!==s.name)reject('This transfer changed. Retry sync.',409);
  return {chunk:{part:row.part,payload:row.payload,digest:row.digest,total:row.total},accepted:[],records:[],messages:[],next:null};
 }
 checkWrite({...c,value:null});
 if(c.kind!=='put'||typeof c.payload!=='string'||c.payload.length>CHUNK_SIZE||!Number.isInteger(c.part)||!Number.isInteger(c.total)||c.total<1||c.total>64||c.part<0||c.part>=c.total||typeof c.digest!=='string'||! /^[a-f0-9]{64}$/.test(c.digest))reject('Invalid transfer part.',400);
 if(c.part===0)await db.prepare("DELETE FROM family_chunks WHERE created<? AND upload NOT IN (SELECT json_extract(value,'$.__etmTransfer') FROM family_records WHERE value IS NOT NULL AND json_valid(value) AND json_extract(value,'$.__etmTransfer') IS NOT NULL)").bind(Date.now()-172800000).run();
 const prior:any=await db.prepare('SELECT * FROM family_chunks WHERE upload=? LIMIT 1').bind(c.upload).first();if(prior&&(prior.owner!==c.owner||prior.collection!==c.collection||prior.id!==c.id||prior.base!==c.version||prior.author!==s.name||prior.total!==c.total||prior.digest!==c.digest))reject('Transfer metadata changed.',409);
 const oldPart:any=await db.prepare('SELECT payload FROM family_chunks WHERE upload=? AND part=?').bind(c.upload,c.part).first();if(oldPart&&oldPart.payload!==c.payload)reject('Transfer part changed.',409);
 await db.prepare('INSERT OR IGNORE INTO family_chunks (upload,owner,collection,id,base,author,part,total,digest,payload,created) VALUES (?,?,?,?,?,?,?,?,?,?,?)').bind(c.upload,c.owner,c.collection,c.id,c.version,s.name,c.part,c.total,c.digest,c.payload,Date.now()).run();
 const accepted:any[]=[];
 if(c.part===c.total-1){const all=await db.prepare('SELECT part,payload FROM family_chunks WHERE upload=? ORDER BY part').bind(c.upload).all();if(all.results.length===c.total){const text=all.results.map((r:any)=>r.payload).join('');if(text.length>MAX_ITEM||await digest(text)!==c.digest)reject('Transfer integrity check failed.',400);let value:any;try{value=JSON.parse(text)}catch{reject('Invalid saved item.',400)}if(value!==null&&typeof value!=='object')reject('Invalid saved item.',400);if(value?.__etmTransfer)reject('Reserved transfer field.',400);if(c.collection==='creations'&&value?.item?.author!==c.owner)reject('Creation author does not match its profile.',400);
 const marker=JSON.stringify({__etmTransfer:c.upload,total:c.total,digest:c.digest,length:text.length});
 const changed=c.version===0?await db.prepare('INSERT OR IGNORE INTO family_records (owner,collection,id,version,value) VALUES (?,?,?,1,?)').bind(c.owner,c.collection,c.id,marker).run():await db.prepare('UPDATE family_records SET value=?,version=version+1 WHERE owner=? AND collection=? AND id=? AND version=?').bind(marker,c.owner,c.collection,c.id,c.version).run();
 if(changed.meta.changes)accepted.push({owner:c.owner,collection:c.collection,id:c.id,version:c.version+1});else{const current:any=await db.prepare('SELECT version,value FROM family_records WHERE owner=? AND collection=? AND id=?').bind(c.owner,c.collection,c.id).first();if(current?.value===marker)accepted.push({owner:c.owner,collection:c.collection,id:c.id,version:current.version})}
 }}
 return {accepted,records:[],messages:[],next:null,stored:c.part};
}
