import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {canonical} from '../src/access.ts';
const require=createRequire(import.meta.url),{Miniflare,createFetchMock}=require('miniflare'),esbuild=require('esbuild');
const built=await esbuild.build({entryPoints:['src/worker.ts'],bundle:true,write:false,format:'esm',platform:'browser'});
const pending=[],seen=[];
const mf=new Miniflare({modules:true,script:built.outputFiles[0].text,compatibilityDate:'2026-05-15',d1Databases:['DB'],outboundService:async req=>{assert.equal(req.url,'https://api.openai.com/v1/responses');const b=await req.json();seen.push(b);assert.equal(b.store,false);assert.deepEqual(Object.keys(JSON.parse(b.input)).sort(),['question','submittedAnswer']);assert.ok(!JSON.stringify(b).includes('fixture-not-a-real-key'));const review=pending.shift();assert.ok(review,'Unexpected API call');return new Response(JSON.stringify({status:'completed',usage:{input_tokens:1000,output_tokens:100},output:[{content:[{type:'output_text',text:JSON.stringify(review)}]}]}),{headers:{'Content-Type':'application/json'}});},bindings:{OPENAI_API_KEY:'fixture-not-a-real-key',ETM_SETUP_TOKEN:'fixture-enrollment',ETM_AI_ZDR_CONFIRMED:'false',ETM_ALLOWED_ORIGIN:'https://etm2026.github.io'}});
try {
 const db=await mf.getD1Database('DB');
 for(const file of readdirSync('migrations').sort())for(const sql of readFileSync('migrations/'+file,'utf8').replaceAll('--> statement-breakpoint','').split(';').filter(x=>x.trim()))await db.prepare(sql).run();
 const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']),pub=await crypto.subtle.exportKey('jwk',pair.publicKey);
 const directory={family:'dadtestfixture',root:{pub,epoch:1},children:Object.fromEntries(['Emily','Tommy','Matthew'].map(name=>[name,{pub,epoch:1}]))};
 async function call(path,data={},name='Dad',extra={}){const body={path,data,name,role:name==='Dad'?'dad':'child',epoch:1,family:directory.family,at:Date.now(),nonce:crypto.randomUUID(),...extra};const sig=Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},pair.privateKey,new TextEncoder().encode(canonical(body)))).toString('base64');return mf.dispatchFetch('https://backend.test/'+path,{method:'POST',headers:{Origin:'https://etm2026.github.io','Content-Type':'application/json'},body:JSON.stringify({body,sig})});}
 assert.equal((await call('enroll',directory,'Dad',{setupToken:'fixture-enrollment'})).status,200);
 assert.equal((await call('dad-test-start',{topic:'add',level:0})).status,503);
 assert.equal((await call('dad-test-config',{enabled:true},'Emily')).status,403);
 assert.equal((await call('dad-test-config',{enabled:true})).status,200);
 let status=await (await call('status')).json();assert.equal(status.dadTestEnabled,true);assert.equal(status.config.enabled,false);assert.equal(status.config.privacyReady,false);
 assert.equal((await call('dad-test-start',{topic:'add',level:0},'Emily')).status,403);
 assert.equal((await call('dad-test-start',{topic:'add',level:0,image:'child-photo'})).status,400);
 assert.equal((await call('config',{enabled:true,limit:5})).status,409);
 let current=await (await call('dad-test-start',{topic:'add',level:0})).json();assert.equal(current.question.answer,undefined);
 const id=current.id;
 assert.equal((await call('dad-test-answer',{id,answer:'child name'})).status,400);
 assert.equal((await call('dad-test-answer',{id,answer:'1',image:'photo'})).status,400);
 assert.equal((await call('dad-test-answer',{id,answer:'1'},'Emily')).status,403);
 assert.equal((await call('next',{id},'Emily')).status,403);
 assert.equal((await call('practice-hint',{id},'Emily')).status,403);
 function reply(correct,adjustment=0){pending.push({correct,hint:'check',adjustment});}

 for(let i=0;i<6;i++){
  const p=JSON.parse((await db.prepare('SELECT body FROM tutor_practice WHERE id=?').bind(id).first()).body);
  reply(true,i===0?1:0);
  const marked=await (await call('dad-test-answer',{id,answer:String(p.current.answer)})).json();assert.equal(marked.aiReviewed,true,JSON.stringify(marked));assert.equal(marked.correct,true);assert.equal(marked.nextLevel,1);assert.equal(marked.answer,undefined);
  assert.equal((await call('dad-test-answer',{id,answer:'1'})).status,409);
  current=await (await call('dad-test-next',{id})).json();
 }
 assert.equal(current.done,true);assert.equal(current.score,6);assert.equal(seen.length,6);
 assert.equal((await db.prepare('SELECT count(*) AS n FROM tutor_results').first()).n,0);
 assert.equal((await db.prepare('SELECT count(*) AS n FROM tutor_homework').first()).n,0);
 let usage=await db.prepare('SELECT * FROM tutor_usage').first();assert.equal(usage.spent,18000);assert.equal(usage.reserved,0);
 // Disagreement leaves a question unmarked and no local fallback is used.
 const start=await (await call('dad-test-start',{topic:'add',level:0})).json();
 const q=JSON.parse((await db.prepare('SELECT body FROM tutor_practice WHERE id=?').bind(start.id).first()).body).current;
 reply(false);assert.equal((await call('dad-test-answer',{id:start.id,answer:String(q.answer)})).status,422);
 assert.equal(JSON.parse((await db.prepare('SELECT body FROM tutor_practice WHERE id=?').bind(start.id).first()).body).answered,false);
 // An existing child practice cannot be passed into the adult route.
 const hw=await (await call('manual',{topic:'add'},'Emily')).json();
 const child=await (await call('start',{topic:'add',homework:hw.id},'Emily')).json();
 assert.equal((await call('dad-test-answer',{id:child.id,answer:'1'})).status,403);
 assert.equal((await call('answer',{id:child.id,answer:'1',confidence:'sure'},'Emily')).status,503);
 // Adult tests use the same monthly ceiling even while child AI is paused.
 await db.prepare('UPDATE tutor_usage SET spent=5000000').run();
 assert.equal((await call('dad-test-answer',{id:start.id,answer:String(q.answer)})).status,429);
 assert.equal((await call('dad-test-config',{enabled:false})).status,200);
 assert.equal((await call('dad-test-start',{topic:'add',level:0})).status,503);
 status=await (await call('status')).json();assert.equal(status.config.enabled,false);assert.equal(status.config.privacyReady,false);
 console.log('PASS Signed Dad-only test: child isolation, no uploads/free text, AI marking and disagreement, adaptive six-question flow, no child progress, shared budget and independent pause.');
} finally {await mf.dispose();}
