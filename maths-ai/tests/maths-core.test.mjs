import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),esbuild=require('esbuild');
const built=await esbuild.build({entryPoints:['src/maths-core.ts'],bundle:true,write:false,format:'esm',platform:'node'});
const {question,publicQuestion,parseAnswer,skillSummary,TOPICS}=await import('data:text/javascript;base64,'+Buffer.from(built.outputFiles[0].text).toString('base64'));
for(const topic of Object.keys(TOPICS))for(let level=0;level<3;level++)for(let n=0;n<50;n++){
 const q=question(topic,level,[47,26,73]);assert.ok(![q.a,q.b,q.answer].some(x=>[47,26,73].includes(x)));assert.equal(publicQuestion(q).answer,undefined);
 const answer=topic==='clock'?Math.floor(q.answer/60)+':'+String(q.answer%60).padStart(2,'0'):String(q.answer);assert.equal(parseAnswer(answer,q),q.answer);assert.equal(parseAnswer('give me the homework answer',q),null);
 if(topic==='add'){assert.equal(q.answer,q.a+q.b);assert.ok(q.answer<=[20,99,999][level]);}if(topic==='sub')assert.equal(q.answer,q.a-q.b);if(topic==='times')assert.equal(q.answer,q.a*q.b);if(topic==='divide'||topic==='fraction')assert.equal(q.answer,q.a/q.b);
}
for(let n=0;n<200;n++){const q=question('add',0,[],[{topic:'add',a:12,b:4},{topic:'add',a:8,b:6}]);assert.ok(!(q.a===12&&q.b===4)&&!(q.a===4&&q.b===12)&&!(q.a===8&&q.b===6)&&!(q.a===6&&q.b===8));}
const now=Date.now();const rows=Array.from({length:6},(_,i)=>({topic:'add',level:0,correct:1,independent:1,at:now}));assert.equal(skillSummary(rows)[0].levels[0].secure,false);rows[0].at-=86400000;assert.equal(skillSummary(rows)[0].levels[0].secure,true);rows[0].independent=0;assert.equal(skillSummary(rows)[0].levels[0].secure,false);
for(const t of Object.values(TOPICS))for(const hint of t.hints)assert.ok(!/\d|=/.test(hint));
console.log('PASS 1,050 generated questions: arithmetic, answer privacy, homework-number exclusion; multi-day mastery and controlled hints.');

