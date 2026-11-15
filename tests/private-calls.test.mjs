import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../private-family.js',import.meta.url),'utf8');
const queue=[],members=[],nodes=[];
function client(name,role){
  const c={accessSession:{name,role},pl:{n:name},accessRoom:'family',me:name+'-device',sessionValid:()=>true,crypto,Date,
    connectedMembers:()=>members,window:{addEventListener(){}},document:{body:{},addEventListener(){}},
    node:(tag,text)=>{const el={text,isConnected:true,replaceChildren(){},remove(){},setAttribute(){}};nodes.push(el);return el},
    btn:(text,click)=>{const el={text,click,remove(){}};nodes.push(el);return el},
    setInterval(){},setTimeout(){},clearTimeout(){},notice(){},tracks:[],sent:[],
    send(topic,data){queue.push({topic,data,family:c.accessRoom,name,role,from:c.me,epoch:1,at:Date.now()})},
    navigator:{mediaDevices:{async getUserMedia(){const track={kind:'audio',stop(){this.stopped=true}};c.tracks.push(track);return {getTracks:()=>[track]}}}},
    RTCPeerConnection:class{addTrack(){} async createOffer(){return {type:'offer'}}async createAnswer(){return {type:'answer'}} async setLocalDescription(d){this.localDescription={toJSON:()=>d}}async setRemoteDescription(d){this.remoteDescription=d}close(){}}};
  vm.createContext(c);vm.runInContext(source,c);
  members.push({id:c.me,name,key:{},authRole:role,authEpoch:1,privateVersion:12});
  return c;
}
const dad=client('Dad','dad'),emily=client('Emily','child'),guest=client('Guest · Sam','guest'),tommy=client('Tommy','child');
const actors=[dad,emily,guest,tommy];
async function deliver(){
  for(let n=0;n<20;n++){
    const p=queue.shift();if(p)for(const c of actors)await c.window.ETMPrivate.receive(p,{});
    await new Promise(r=>setImmediate(r));
  }
}
dad.window.ETMPrivate.controls({});
assert.ok(!nodes.some(n=>n.text?.includes('Call Guest')));
nodes.find(n=>n.text==='Video call Emily').click();await deliver();
assert.ok(actors.every(c=>c.tracks.length===0));
const id=vm.runInContext('activeCall.id',dad);
await dad.window.ETMPrivate.receive({topic:'etm-call-12',data:{to:dad.me,name:'Dad',id,kind:'accepted'},family:'family',name:'Guest · Sam',from:guest.me,role:'guest',epoch:1});
assert.equal(dad.tracks.length,0);
nodes.find(n=>n.text==='Answer').click();await deliver();
assert.deepEqual(actors.map(c=>c.tracks.length),[1,1,0,0]);
assert.equal(vm.runInContext('activeCall.pc.remoteDescription.type',dad),'answer');
assert.equal(vm.runInContext('activeCall.pc.remoteDescription.type',emily),'offer');
emily.window.ETMPrivate.stop();await deliver();
assert.ok(dad.tracks[0].stopped&&emily.tracks[0].stopped);
console.log('PASS Explicit acceptance, signed device targeting, no capture for guests or bystanders, and track cleanup.');
