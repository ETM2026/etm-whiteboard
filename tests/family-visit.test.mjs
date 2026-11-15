import vm from 'node:vm';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../family-home.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const originals=['canonical','bytes','url64','unurl64','publicSigningKey','signature','verifySignature','newSigningPair','wrappingKey','makeCredential','unlockCredential','manifestBody','fingerprint'];
const service={},family='testfamily';
function device(){
  const nodes=[],c={crypto,TextEncoder,TextDecoder,Uint8Array,AbortSignal,structuredClone,accessKeys:{},FAMILY:['Emily','Tommy','Matthew'],PEOPLE:[{n:'Emily'}],accessRoom:family,visitProfile:null,accessManifest:null,window:{addEventListener(){}},document:{addEventListener(){}},setInterval(){},home(){},notice(){},copyObject:structuredClone,accessSession:null,dadUnlocked:()=>true,localStorage:{setItem(){},getItem(){return ''}},node:(tag,text)=>{const el={tag,text,isConnected:true,focus(){},setAttribute(){}};nodes.push(el);return el},btn:(text,click)=>{const el={text,click,disabled:false};nodes.push(el);return el},accessDialog:()=>({isConnected:true}),accessExpected:'',learningKey:'',entrySigner:null,publicMembers:{},learningLoad(){},ensureEntrySigner(){},closeAccessDialog(){},join(){},selectPerson(q){c.pl=q},syncNow(){},nodes,b64:x=>Buffer.from(x).toString('base64'),unb64:s=>new Uint8Array(Buffer.from(s,'base64'))};
  c.fetch=async(url,req)=>{const body=JSON.parse(req.body);let data;
    if(url.endsWith('/home-publish')){service.data=body.body.data;data={ready:true}}
    if(url.endsWith('/visit-salt'))data={salt:service.data.visits.find(x=>x.name===body.name).manifest.children[body.name].salt};
    if(url.endsWith('/visit-open'))data={manifest:service.data.visits.find(x=>x.name===body.name).manifest};
    return {ok:true,json:async()=>data};
  };
  vm.createContext(c);
  for(const name of originals){const line=html.split('\n').find(l=>l.trimStart().startsWith('function '+name+'(')||l.trimStart().startsWith('async function '+name+'('));vm.runInContext(line,c)}
  vm.runInContext(source,c);return c;
}
const laptop=device(),school=device();
const root=await laptop.makeCredential('Dad','52341',1);
laptop.accessManifest={v:9,revision:1,family,root:root.credential,children:{}};
for(const name of laptop.FAMILY)laptop.accessManifest.children[name]=(await laptop.makeCredential(name,'1357',1)).credential;
laptop.accessManifest.sig=await laptop.signature(root.key,laptop.manifestBody(laptop.accessManifest));
laptop.accessSession={role:'dad',name:'Dad',epoch:1,key:root.key};
await laptop.window.ETMHome.remember('52341',laptop.accessSession);
assert.equal(service.data.visits.length,3);
const e=service.data.visits[0].manifest;
assert.ok(e.children.Emily.cipher);assert.ok(!e.root.cipher&&!e.children.Tommy.cipher&&!e.children.Matthew.cipher);
school.visitProfile='Emily';school.accessRoom='unpaired';school.window.ETMHome.child('Emily');
school.nodes.find(n=>n.tag==='input').value='1357';await school.nodes.find(n=>n.text==='Open my room').click();
assert.equal(school.pl?.n,'Emily');assert.equal(school.accessSession.role,'child');assert.equal(school.accessRoom,family);
assert.ok(await laptop.verifySignature(e.children.Emily.pub,{test:1},await school.signature(school.accessSession.key,{test:1})));
console.log('PASS Actual laptop publication and school PIN sign-in with separate browser state and no other profile credentials.');
