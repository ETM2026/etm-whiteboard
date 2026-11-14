import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),{Miniflare,createFetchMock}=require('miniflare'),esbuild=require('esbuild');
const built=await esbuild.build({stdin:{contents:"import {handleTutor} from './src/maths-tutor';export default {async fetch(req,env){try{return await handleTutor(req,env,{name:'Emily',role:'child'},new URL(req.url).pathname.slice(1))}catch(e){return Response.json({error:e.message},{status:e.status||500})}}}",resolveDir:process.cwd()},bundle:true,write:false,format:'esm',platform:'browser'});
const mock=createFetchMock();mock.disableNetConnect();
const mf=new Miniflare({modules:true,script:built.outputFiles[0].text,compatibilityDate:'2026-05-15',d1Databases:['DB'],fetchMock:mock,bindings:{OPENAI_API_KEY:'fixture-key-not-real',ETM_AI_ZDR_CONFIRMED:'true'}});
const call=(path,d)=>mf.dispatchFetch('https://tutor.test/'+path,{method:'POST',body:JSON.stringify(d)});
const jpeg='data:image/jpeg;base64,'+Buffer.from([255,216,255,192,0,17,8,0,100,0,100,3,1,0,0,0,0,0,255,217]).toString('base64');
try{const db=await mf.getD1Database('DB');for(const sql of readFileSync('migrations/0001_tutor.sql','utf8').replaceAll('--> statement-breakpoint','').split(';').filter(s=>s.trim()))await db.prepare(sql).run();await db.prepare('CREATE TABLE attempts(bucket TEXT PRIMARY KEY,count INTEGER,until INTEGER)').run();await db.prepare('INSERT INTO tutor_config VALUES(1,1,5000000)').run();
function response(obj){return {status:'completed',usage:{input_tokens:1000,output_tokens:100},output:[{content:[{type:'output_text',text:JSON.stringify(obj)}]}]};}
mock.get('https://api.openai.com').intercept({path:'/v1/responses',method:'POST'}).reply(200,response({clear:true,topics:['add'],numbers:[47,26],answer:73,advice:'The answer is 73'}));
let r=await call('scan',{image:jpeg});assert.equal(r.status,200);const scan=await r.json();assert.deepEqual(Object.keys(scan).sort(),['id','needsConfirmation','topics']);assert.equal(scan.needsConfirmation,true);
assert.equal((await call('hint',{id:scan.id,topic:'add',step:0})).status,400);await call('confirm',{id:scan.id,topics:['add']});
const hint=await (await call('hint',{id:scan.id,topic:'add',step:0})).json();assert.ok(!JSON.stringify(hint).includes('73'));assert.equal((await db.prepare('SELECT spent,reserved FROM tutor_usage').first()).spent,3000);
mock.get('https://api.openai.com').intercept({path:'/v1/responses',method:'POST'}).reply(200,response({observation:'The answer is 73'}));
r=await call('working',{image:jpeg,id:scan.id,topic:'add'});assert.ok(!(await r.text()).includes('73'));
const oversized='data:image/jpeg;base64,'+Buffer.from([255,216,255,192,0,17,8,10,0,10,0,3,1,0,0,0,0,0,255,217]).toString('base64');assert.equal((await call('scan',{image:oversized})).status,400);

const started=await (await call('start',{homework:scan.id,topic:'add'})).json();
const stored=JSON.parse((await db.prepare('SELECT body FROM tutor_practice WHERE id=?').bind(started.id).first()).body);
assert.equal(started.question.answer,undefined);
mock.get('https://api.openai.com').intercept({path:'/v1/responses',method:'POST'}).reply(200,response({correct:true,hint:'check',adjustment:1}));
const marked=await (await call('answer',{id:started.id,answer:String(stored.current.answer),confidence:'sure'})).json();assert.equal(marked.aiReviewed,true);assert.equal(marked.correct,true);assert.equal(marked.answer,undefined);
const evidence=JSON.parse((await db.prepare('SELECT body FROM tutor_results WHERE id=?').bind(started.id+':0').first()).body);assert.equal(evidence.aiReviewed,true);
const second=await (await call('start',{homework:scan.id,topic:'add'})).json();
const sq=JSON.parse((await db.prepare('SELECT body FROM tutor_practice WHERE id=?').bind(second.id).first()).body).current;
mock.get('https://api.openai.com').intercept({path:'/v1/responses',method:'POST'}).reply(200,response({correct:false,hint:'place',adjustment:-1}));
assert.equal((await call('answer',{id:second.id,answer:String(sq.answer),confidence:'sure'})).status,422);
assert.equal(await db.prepare('SELECT body FROM tutor_results WHERE id=?').bind(second.id+':0').first(),null);
mock.get('https://api.openai.com').intercept({path:'/v1/responses',method:'POST'}).reply(500,'upstream');r=await call('scan',{image:jpeg});assert.equal(r.status,502);const usage=await db.prepare('SELECT * FROM tutor_usage').first();assert.equal(usage.reserved,0);assert.equal(usage.spent,1012000);
console.log('PASS Mocked vision: topic confirmation, model-answer suppression, unknown observation fallback, JPEG bounds, exact usage settlement and conservative failures.');
}finally{await mf.dispose()}
