import assert from 'node:assert/strict';import {readFileSync,readdirSync} from 'node:fs';import {createRequire} from 'node:module';import {canonical} from '../src/access.ts';
const require=createRequire(import.meta.url),{Miniflare}=require('miniflare'),esbuild=require('esbuild');const built=await esbuild.build({entryPoints:['src/worker.ts'],bundle:true,write:false,format:'esm',platform:'browser'});const mf=new Miniflare({modules:true,script:built.outputFiles[0].text,compatibilityDate:'2026-05-15',d1Databases:['DB'],bindings:{ETM_SETUP_TOKEN:'fixture-setup-code-not-an-openai-key',ETM_ALLOWED_ORIGIN:'https://etm2026.github.io'}});
try{const db=await mf.getD1Database('DB');for(const f of readdirSync('migrations').filter(f=>f.endsWith('.sql')).sort())for(const sql of readFileSync('migrations/'+f,'utf8').replaceAll('--> statement-breakpoint','').split(';').filter(s=>s.trim()))await db.prepare(sql).run();
const pair=await crypto.subtle.generateKey({name:'ECDSA',namedCurve:'P-256'},true,['sign','verify']),pub=await crypto.subtle.exportKey('jwk',pair.publicKey);const d={family:'etmfamilytest',root:{pub,epoch:1},children:Object.fromEntries(['Emily','Tommy','Matthew'].map(n=>[n,{pub,epoch:1}]))};async function p(path,name,role,data={},extra={}){const body={path,name,role,epoch:1,family:d.family,at:Date.now(),nonce:crypto.randomUUID(),data,...extra};return {body,sig:Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},pair.privateKey,new TextEncoder().encode(canonical(body)))).toString('base64')}}
const call=(path,packet,origin='https://etm2026.github.io')=>mf.dispatchFetch('https://backend.test/'+path,{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify(packet)});
assert.equal((await call('enroll',await p('enroll','Dad','dad',d,{setupToken:'fixture-setup-code-not-an-openai-key'}))).status,200);
const device=crypto.randomUUID(),sync=(writes=[],extra={})=>({device,member:'dad123',writes,messages:[],cursor:0,...extra}),item={owner:'Emily',collection:'pieces',id:'piece',version:0,value:{id:'piece',title:'Original',bars:[],events:[]}};
let r=await call('family-sync',await p('family-sync','Dad','dad',sync([item])));assert.equal(r.status,200);assert.equal((await r.json()).accepted.length,1);
r=await call('family-sync',await p('family-sync','Emily','child',sync()));assert.equal((await r.json()).records[0].version,1);
assert.equal((await call('family-sync',await p('family-sync','Tommy','child',sync([{...item,id:'bad'}])))).status,403);
assert.equal((await call('family-sync',await p('family-sync','Tommy','child',sync()))).status,200);
assert.equal((await call('status',await p('status','Tommy','child'))).status,403);
r=await call('family-sync',await p('family-sync','Emily','child',sync([{...item,version:1,value:{...item.value,title:'New edit'}}])));assert.equal((await r.json()).accepted.length,1);
r=await call('family-sync',await p('family-sync','Emily','child',sync([{...item,version:1,value:{title:'Stale edit'}}])));const stale=await r.json();assert.equal(stale.accepted.length,0);assert.equal(stale.records[0].value.title,'New edit');
await call('family-sync',await p('family-sync','Dad','dad',sync([{owner:'Dad',collection:'private',id:'goals',version:0,value:{cipher:'encrypted fixture'}}])));
r=await call('family-sync',await p('family-sync','Emily','child',sync()));assert.ok((await r.json()).records.every(x=>x.owner==='Emily'||x.owner==='Shared'));
const body={v:9,family:d.family,from:'dad123',name:'Dad',role:'dad',epoch:1,at:Date.now(),nonce:'message-'+crypto.randomUUID(),topic:'etm-member',data:{id:'dad123',name:'Dad'}},msg={body,sig:Buffer.from(await crypto.subtle.sign({name:'ECDSA',hash:'SHA-256'},pair.privateKey,new TextEncoder().encode(canonical(body)))).toString('base64')};
assert.equal((await call('family-sync',await p('family-sync','Dad','dad',sync([],{messages:[msg]})))).status,200);
r=await call('family-sync',await p('family-sync','Emily','child',sync([],{device:crypto.randomUUID()})));assert.equal((await r.json()).messages.length,1);
assert.equal((await call('family-sync',await p('family-sync','Emily','child',sync([],{messages:[msg]})))).status,403);
await call('family-sync',await p('family-sync','Tommy','child',sync([{owner:'Tommy',collection:'creations',id:'quiz:q',version:0,value:{kind:'quiz',item:{id:'q',author:'Dad',q:'A question'}}}])));
r=await call('family-sync',await p('family-sync','Emily','child',sync()));const shared=(await r.json()).records.find(x=>x.collection==='creations');assert.equal(shared.value.item.author,'Tommy');
console.log('PASS D1 sync: child isolation, Dad access, all-child sync without AI access, stale-write rejection and verified fallback relay.');}finally{await mf.dispose()}

