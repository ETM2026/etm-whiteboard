import assert from 'node:assert/strict';
import {readFileSync,readdirSync} from 'node:fs';
import {createRequire} from 'node:module';
import {canonical} from '../src/access.ts';
const require=createRequire(import.meta.url),{Miniflare}=require('miniflare'),esbuild=require('esbuild');
const build=await esbuild.build({entryPoints:['src/worker.ts'],bundle:true,write:false,format:'esm',platform:'browser'});
const requests=[],responses=[];
const mf=new Miniflare({modules:true,script:build.outputFiles[0].text,compatibilityDate:'2026-05-15',d1Databases:['DB'],bindings:{OPENAI_API_KEY:'fixture-only-not-real',ETM_SETUP_TOKEN:'fixture-enroll',ETM_ALLOWED_ORIGIN:'https://etm2026.github.io',ETM_AI_ZDR_CONFIRMED:'false'},outboundService:async req=>{
 assert.equal(req.url,'https://api.openai.com/v1/responses');const b=await req.json();requests.push(b);assert.equal(b.store,false);assert.equal(b.model,'gpt-6.1-sol');assert.ok(!JSON.stringify(b).includes('fixture-only-not-real'));const response=responses.shift();assert.ok(response,'No unexpected API requests');return Response.json({status:'completed',usage:{input_tokens:1000,output_tokens:200},output:[{content:[{type:'output_text',text:JSON.stringify(response)}]}]});
}});
const jpeg='data:image/jpeg;base64,'+Buffer.from([255,216,255,192,0,17,8,0,100,0,100,3,1,0,0,0,0,0,0,0,0,255,217]).toString('base64');
try{
 const db=await mf.getD1Database('DB');for(const file of readdirSync('migrations').sort())for(const sql of readFileSync('migrations/'+file,'utf8').replaceAll('--> statement-breakpoint','').split(';').filter(x=>x.trim()))await db.prepare(sql).run();
 const dad=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']),child=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']);
 const pub=await crypto.subtle.exportKey('jwk',dad.publicKey),cpub=await crypto.subtle.exportKey('jwk',child.publicKey),directory={family:'fullaifixture',root:{pub,epoch:1},children:Object.fromEntries(['Emily','Tommy','Matthew'].map(n=>[n,{pub:cpub,epoch:1}]))};
 async function call(path,data={},name='Dad',extra={}){const body={path,data,name,role:name==='Dad'?'dad':'child',epoch:1,family:directory.family,at:Date.now(),nonce:crypto.randomUUID(),...extra};const pair=name==='Dad'?dad:child,sig=Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},pair.privateKey,new TextEncoder().encode(canonical(body)))).toString('base64');return mf.dispatchFetch('https://backend/'+path,{method:'POST',headers:{Origin:'https://etm2026.github.io','Content-Type':'application/json'},body:JSON.stringify({body,sig})});}
 async function result(path,data){const r=await call(path,data);const d=await r.json();assert.equal(r.status,200,JSON.stringify(d));return d;}
 assert.equal((await call('enroll',directory,'Dad',{setupToken:'fixture-enroll'})).status,200);
 assert.equal((await call('lab-piano-exercise',{level:0,focus:'notes'})).status,503);
 await result('dad-test-config',{enabled:true});
 for(const action of ['lab-maths-scan','lab-maths-hint','lab-maths-working','lab-maths-start','lab-piano-score','lab-piano-exercise','lab-piano-plan','lab-quiz-generate'])assert.equal((await call(action,{},'Emily')).status,403);
 assert.equal((await call('lab-maths-scan',{image:jpeg})).status,400);
 assert.equal((await call('lab-maths-scan',{image:'data:image/jpeg;base64,a',adultOnly:true})).status,400);
 responses.push({clear:true,topics:['add','sub'],numbers:[47,26,62,18],exercises:[{topic:'add',a:47,b:26},{topic:'sub',a:62,b:18}],answer:73,secretName:'Do not return'});
 const scan=await result('lab-maths-scan',{image:jpeg,adultOnly:true});assert.deepEqual(Object.keys(scan).sort(),['id','reviewRequired','topics']);assert.ok(!JSON.stringify(scan).includes('73'));assert.ok(!JSON.stringify(scan).includes('Do not return'));
 // Readable supported questions survive an otherwise unsupported mixed worksheet.
 assert.equal(requests.at(-1).input[0].content[1].detail,'high');
 assert.ok(requests.at(-1).instructions.includes('unsupported questions'));
 responses.push({clear:true,reason:'partial',topics:['sub','fraction'],numbers:[75,28,3,4],exercises:[{topic:'sub',a:75,b:28}]});
 const mixed=await result('lab-maths-scan',{image:jpeg,adultOnly:true});assert.equal(mixed.partial,true);assert.deepEqual(mixed.topics.map(t=>t.id),['sub','fraction']);assert.equal(mixed.numbers,undefined);assert.equal(mixed.exercises,undefined);
 for(const [reason,message] of [['unsupported',/not supported yet/],['unclear',/too small or unclear/],['privacy',/personal information/]]){
  responses.push({clear:false,reason,topics:[],numbers:[],exercises:[]});const rejected=await call('lab-maths-scan',{image:jpeg,adultOnly:true});assert.equal(rejected.status,422);assert.match((await rejected.json()).error,message);
 }
 responses.push({clear:true,reason:'supported',topics:['sub'],numbers:['invalid'],exercises:[]});const invalid=await call('lab-maths-scan',{image:jpeg,adultOnly:true});assert.equal(invalid.status,422);assert.match((await invalid.json()).error,/incomplete classification/);
 const hint=await result('lab-maths-hint',{sheet:scan.id,topic:'add',step:0});assert.ok(!/\d/.test(hint.hint));
 responses.push({observation:'The answer is 73'});const working=await result('lab-maths-working',{sheet:scan.id,topic:'add',image:jpeg,adultOnly:true});assert.ok(!working.hint.includes('73'));
 assert.equal((await call('lab-maths-start',{sheet:'child-homework',topic:'add',level:0})).status,403);
 const start=await result('lab-maths-start',{sheet:scan.id,topic:'add',level:1});assert.equal(start.question.answer,undefined);const practice=JSON.parse((await db.prepare('SELECT body FROM tutor_practice WHERE id=?').bind(start.id).first()).body);assert.deepEqual(practice.exercises,[{topic:'add',a:47,b:26},{topic:'sub',a:62,b:18}]);
 responses.push({correct:true,hint:'check',adjustment:1});assert.equal((await result('dad-test-answer',{id:start.id,answer:String(practice.current.answer)})).aiReviewed,true);await result('dad-test-next',{id:start.id});
 const score={clear:true,confidence:.95,beats:4,tempo:80,bars:1,events:[{bar:1,beat:0,pitch:60,duration:1,hand:'right'},{bar:1,beat:1,pitch:62,duration:1,hand:'right'}]};
 responses.push(score);const parsed=await result('lab-piano-score',{image:jpeg,adultOnly:true});assert.equal(parsed.reviewRequired,true);assert.equal(parsed.events[0].pitch,60);assert.equal(parsed.source,'AI photo estimate');assert.equal(parsed.image,undefined);
 responses.push({...score,confidence:.4});assert.equal((await call('lab-piano-score',{image:jpeg,adultOnly:true})).status,422);
 responses.push({...score,events:[{bar:1,beat:3,pitch:60,duration:4,hand:'right'}]});assert.equal((await call('lab-piano-exercise',{level:1,focus:'rhythm'})).status,422);
 responses.push({...score,bars:4,events:[1,2,3,4].map(bar=>({bar,beat:0,pitch:60,duration:4,hand:'right'}))});assert.equal((await result('lab-piano-exercise',{level:0,focus:'notes'})).source,'AI original exercise');
 const plan={summary:'Practise slowly and evenly.',steps:[{focus:'notes',minutes:2,speedPercent:50,instruction:'Find the notes in each hand.'},{focus:'rhythm',minutes:2,speedPercent:75,instruction:'Count the beat aloud.'},{focus:'hands',minutes:3,speedPercent:75,instruction:'Try one bar with both hands.'}]};
 assert.equal((await call('lab-piano-plan',{correct:3,wrong:1,missed:0,weakBars:[1],tempo:80,hand:'both',mode:'wait',adultOnly:true,name:'Emily'})).status,400);
 responses.push(plan);assert.equal((await result('lab-piano-plan',{correct:3,wrong:1,missed:0,weakBars:[1],tempo:20,hand:'both',mode:'wait',adultOnly:true})).steps.length,3);
 const players=[{slot:0,topic:'space',level:2},{slot:1,topic:'oceans',level:1},{slot:2,topic:'animals',level:0}];
 function quiz(){return {safe:true,players:players.map(p=>({slot:p.slot,questions:Array.from({length:3},(_,i)=>({question:'Distinct question '+p.slot+'-'+i,options:['A','B','C','D'],correct:i%4,explanation:'A short factual explanation.'}))}))};}
 responses.push(quiz());const draft=await result('lab-quiz-generate',{players,count:3});assert.equal(draft.players.length,3);assert.equal(draft.players[2].level,0);assert.equal(draft.reviewRequired,true);
 const input=JSON.parse(requests.at(-1).input);assert.deepEqual(input,{players,count:3});assert.ok(!JSON.stringify(input).includes('Emily'));
 assert.equal((await call('lab-quiz-generate',{players:[{slot:0,topic:'space',level:2,name:'Emily'},players[1]],count:3})).status,400);
 assert.equal((await call('lab-quiz-generate',{players,count:4})).status,400);
 const unsafe=quiz();unsafe.safe=false;responses.push(unsafe);assert.equal((await call('lab-quiz-generate',{players,count:3})).status,422);
 const duplicate=quiz();duplicate.players[1].questions[0].question=duplicate.players[0].questions[0].question;responses.push(duplicate);assert.equal((await call('lab-quiz-generate',{players,count:3})).status,422);
 assert.equal((await db.prepare('SELECT count(*) AS n FROM tutor_results').first()).n,0);assert.equal((await db.prepare('SELECT count(*) AS n FROM tutor_homework').first()).n,0);
 const status=await result('status');assert.equal(status.config.enabled,false);assert.equal(status.config.privacyReady,false);assert.equal(status.usage.reserved,0);assert.equal(status.usage.spent,requests.length*.004);
 await db.prepare('UPDATE tutor_usage SET spent=5000000').run();assert.equal((await call('lab-piano-exercise',{level:0,focus:'notes'})).status,429);
 await result('dad-test-config',{enabled:false});assert.equal((await call('lab-maths-hint',{sheet:scan.id,topic:'add',step:0})).status,503);
 assert.equal(responses.length,0);
 console.log('PASS Full lab: signed Dad-only routes, adult photo consent, bounded images, no worksheet answers, isolated practice, score uncertainty and note checks, original exercises, numeric-only coaching summaries, anonymous per-level quizzes, malformed output rejection and shared budget.');
}finally{await mf.dispose();}
