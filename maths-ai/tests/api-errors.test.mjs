import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Miniflare}=require('miniflare'),esbuild=require('esbuild');
const built=await esbuild.build({stdin:{contents:"import {handleTutor} from './src/maths-tutor';export default {async fetch(req,env){try{return await handleTutor(req,env,{name:'Dad',role:'dad'},new URL(req.url).pathname.slice(1))}catch(e){return Response.json({error:e.status?e.message:'Request failed'},{status:e.status||500})}}}",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser'});
let upstream={status:401,error:{code:'invalid_api_key'}};
const privateText='sk-proj-fixture-secret-never-forward';
const mf=new Miniflare({modules:true,script:built.outputFiles[0].text,compatibilityDate:'2026-05-15',d1Databases:['DB'],bindings:{OPENAI_API_KEY:'not-real',ETM_AI_ZDR_CONFIRMED:'false'},outboundService:async()=>new Response(JSON.stringify({error:{message:privateText,param:privateText,...upstream.error}}),{status:upstream.status,headers:{'Content-Type':'application/json'}})});
const call=(path,d)=>mf.dispatchFetch('https://test/'+path,{method:'POST',body:JSON.stringify(d)});
try{
 const db=await mf.getD1Database('DB');for(const f of readdirSync('migrations').sort())for(const sql of readFileSync('migrations/'+f,'utf8').replaceAll('--> statement-breakpoint','').split(';').filter(x=>x.trim()))await db.prepare(sql).run();
 await db.prepare('INSERT INTO tutor_config VALUES (1,0,5000000)').run();await db.prepare('INSERT INTO tutor_config VALUES (2,1,0)').run();
 const started=await (await call('dad-test-start',{topic:'add',level:0})).json();
 for(const [status,code,match,param] of [[401,'invalid_api_key','credentials'],[403,'insufficient_permissions','permit Responses'],[404,'model_not_found','model is unavailable'],[429,'insufficient_quota','credit or quota'],[429,'project_spend_limit_exceeded','spending or usage'],[429,'rate_limit_exceeded','limiting requests'],[400,'unsupported_parameter','field max_output_tokens','max_output_tokens'],[400,privateText,'HTTP 400']]){
  upstream={status,error:{code,...(param?{param}:{})}};
  const r=await call('dad-test-answer',{id:started.id,answer:'1'});assert.equal(r.status,502);const d=await r.json();assert.ok(d.error.includes(match),d.error);assert.ok(d.error.includes('has not been marked'));assert.ok(!d.error.includes(privateText));
  const usage=await db.prepare('SELECT * FROM tutor_usage').first();assert.equal(usage.reserved,0);assert.equal(usage.spent,0);
  assert.equal(JSON.parse((await db.prepare('SELECT body FROM tutor_practice WHERE id=?').bind(started.id).first()).body).answered,false);
 }
 // A billing error can use a more specific unknown code with the quota type.
 upstream={status:429,error:{code:'billing_not_active',type:'insufficient_quota'}};
 assert.ok((await (await call('dad-test-answer',{id:started.id,answer:'1'})).json()).error.includes('credit or quota'));
 upstream={status:503,error:{code:'server_is_overloaded'}};
 assert.ok((await (await call('dad-test-answer',{id:started.id,answer:'1'})).json()).error.includes('temporary service error'));
 const usage=await db.prepare('SELECT * FROM tutor_usage').first();assert.equal(usage.reserved,0);assert.equal(usage.spent,1000000);
 assert.equal((await db.prepare('SELECT enabled FROM tutor_config WHERE id=1').first()).enabled,0);
 console.log('PASS API diagnostics distinguish credentials, permissions, model access, quota, spending caps, throttling and invalid settings; suppress raw secrets; release rejected reservations and retain uncertain service failures.');
}finally{await mf.dispose();}
