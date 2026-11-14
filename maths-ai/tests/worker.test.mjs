import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';import {createRequire} from 'node:module';import {canonical} from '../src/access.ts';
const require=createRequire(import.meta.url),{Miniflare}=require('miniflare'),esbuild=require('esbuild');const built=await esbuild.build({entryPoints:['src/worker.ts'],bundle:true,write:false,format:'esm',platform:'browser'});const mf=new Miniflare({modules:true,script:built.outputFiles[0].text,compatibilityDate:'2026-05-15',d1Databases:['DB'],bindings:{ETM_SETUP_TOKEN:'fixture-setup-code-not-an-openai-key',ETM_ALLOWED_ORIGIN:'https://etm2026.github.io'}});
try{const db=await mf.getD1Database('DB');for(const f of readdirSync('migrations').filter(f=>f.endsWith('.sql')).sort())for(const sql of readFileSync('migrations/'+f,'utf8').replaceAll('--> statement-breakpoint','').split(';').filter(s=>s.trim()))await db.prepare(sql).run();
const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']),pub=await crypto.subtle.exportKey('jwk',pair.publicKey);const d={family:'etmfamilytest',root:{pub,epoch:1},children:Object.fromEntries(['Emily','Tommy','Matthew'].map(n=>[n,{pub,epoch:1}]))};async function p(path,name,role,data={},extra={}){const body={path,name,role,epoch:1,family:d.family,at:Date.now(),nonce:crypto.randomUUID(),data,...extra};return {body,sig:Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},pair.privateKey,new TextEncoder().encode(canonical(body)))).toString('base64')}}
const call=(path,packet,origin='https://etm2026.github.io')=>mf.dispatchFetch('https://backend.test/'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(packet)});
assert.equal((await call('enroll',await p('enroll','Dad','dad',d,{setupToken:'wrong'}))).status,403);
assert.equal((await call('enroll',await p('enroll','Dad','dad',d,{setupToken:'fixture-setup-code-not-an-openai-key'}))).status,200);
assert.equal((await call('status',await p('status','Emily','child'))).status,200);
assert.equal((await call('status',await p('status','Tommy','child'))).status,403);
assert.equal((await call('status',await p('status','Emily','child'),'https://attacker.test')).status,403);
const replay=await p('status','Emily','child');assert.equal((await call('status',replay)).status,200);assert.equal((await call('status',replay)).status,409);
assert.equal((await call('config',await p('config','Emily','child',{enabled:true,limit:100}))).status,403);
assert.equal((await call('config',await p('config','Dad','dad',{enabled:true,limit:5}))).status,409);
const manual=await (await call('manual',await p('manual','Emily','child',{topic:'add'}))).json();const start=await (await call('start',await p('start','Emily','child',{topic:'add',homework:manual.id}))).json();assert.equal(start.question.answer,undefined);
const marked=await call('answer',await p('answer','Emily','child',{id:start.id,answer:'1',confidence:'sure'}));assert.equal(marked.status,503);assert.equal((await db.prepare('SELECT count(*) AS n FROM tutor_results').first()).n,0);
console.log('PASS Worker end-to-end: enrollment, CORS, signed roles, replay protection, parent-only configuration, answer privacy and no silent local grading when AI is unavailable.');}finally{await mf.dispose()}

