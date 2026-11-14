import {handleTutor} from './maths-tutor';
import {authenticate,publicDirectory,verify,reject,canonical} from './access';
import type {EtmEnv} from './etm-service';
export default {async fetch(req:Request,env:EtmEnv):Promise<Response>{
 const origin=env.ETM_ALLOWED_ORIGIN||'https://etm2026.github.io';
 const headers={'Content-Type':'application/json','Access-Control-Allow-Origin':origin,'Access-Control-Allow-Methods':'POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Vary':'Origin','Cache-Control':'no-store'};
 try{
 if(req.headers.get('origin')!==origin)reject('Open the coach from the family app.');
 if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
 if(req.method!=='POST')reject('Use a signed request.',405);
 if(!env.DB)reject('The learning database is not connected.',503);
 const raw=await req.text();if(raw.length>700000)reject('Choose a smaller photo.',413);let packet:any;try{packet=JSON.parse(raw);}catch{reject('Invalid request.',400);}
 const path=new URL(req.url).pathname.slice(1);
 if(path==='enroll'){
 const b=packet?.body;if(!b||b.path!==path||!Number.isFinite(b.at)||Math.abs(Date.now()-b.at)>60000)reject('Setup request expired.');
 const d=publicDirectory(b.data),old:any=await env.DB.prepare('SELECT * FROM ai_family WHERE id=1').first();
 if(old){const s=await authenticate(env.DB,packet,path);if(s.role!=='dad'||canonical(d.root)!==canonical(JSON.parse(old.root))||d.family!==old.family)reject('Keep the existing family root.');}
 else{if(!env.ETM_SETUP_TOKEN||typeof b.setupToken!=='string'||b.setupToken!==env.ETM_SETUP_TOKEN)reject('The one-time setup code did not match.');if(b.name!=='Dad'||b.role!=='dad'||!await verify(d.root.pub,b,packet.sig))reject('Unlock Dad’s tools first.');}
 const sql=old?'UPDATE ai_family SET children=? WHERE id=1':'INSERT OR IGNORE INTO ai_family (id,family,root,children) VALUES (1,?,?,?)';
 const q=env.DB.prepare(sql).bind(...(old?[JSON.stringify(d.children)]:[d.family,JSON.stringify(d.root),JSON.stringify(d.children)]));const r=await q.run();if(!r.meta.changes)reject('A family was already connected. Refresh and try again.',409);
 return Response.json({saved:true},{headers});
 }
 const s=await authenticate(env.DB,packet,path);
 const get=path==='status';const inner=new Request('https://etm.internal/'+path,{method:get?'GET':'POST',headers:{'Content-Type':'application/json'},body:get?undefined:JSON.stringify(packet.body.data||{})});
 const r=await handleTutor(inner,env as any,s,path);return new Response(r.body,{status:r.status,headers});
 }catch(e:any){return Response.json({error:e.status?e.message:'The tutor could not finish. Please try again.'},{status:e.status||500,headers});}
}};
