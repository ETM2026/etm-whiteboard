import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {EventEmitter} from 'node:events';
import {webcrypto as crypto} from 'node:crypto';

const code=readFileSync(new URL('../friend-room.js',import.meta.url),'utf8');
const peers=new Map(), packets=[];
class Wire extends EventEmitter{
  send(m){assert.ok(this.open);packets.push(structuredClone(m));queueMicrotask(()=>{if(this.other.open)this.other.emit('data',structuredClone(m))})}
  close(){if(!this.open)return;this.open=this.other.open=false;this.emit('close');this.other.emit('close')}
}
class Peer extends EventEmitter{
  constructor(id=crypto.randomUUID()){super();this.id=id;this.links=[];peers.set(id,this);queueMicrotask(()=>this.emit('open',id))}
  connect(id){
    const host=peers.get(id),local=new Wire(),remote=new Wire();
    local.other=remote;remote.other=local;this.links.push(local);host.links.push(remote);
    queueMicrotask(()=>{local.open=remote.open=true;host.emit('connection',remote);local.emit('open');remote.emit('open')});
    return local;
  }
  destroy(){peers.delete(this.id);this.links.forEach(c=>c.close())}
}
class El{
  constructor(tag,text='',parent){this.tag=tag;this.text=text;this.children=[];this.attrs={};this.dataset={};this.value='';this.attached=true;if(parent){this.parent=parent;parent.children.push(this)}}
  set textContent(v){this.text=v;this.replaceChildren()}get textContent(){return [this.text,...this.children.map(n=>n.textContent)].join(' ').trim()}
  get isConnected(){return this.attached&&(!this.parent||this.parent.isConnected)}
  setAttribute(k,v){this.attrs[k]=v}remove(){this.attached=false;if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this)}
  replaceChildren(){for(const c of [...this.children])c.remove()}
  all(){return [this,...this.children.flatMap(c=>c.all())]}
  click(){if(!this.disabled)return this.onclick?.()}focus(){}
}
function device(name,invitation){
  let root,invite;const notices=[],storage=new Map(invitation?[['ETM.friendVisit',invitation]]:[]);
  const ctx={pl:{n:name},accessSession:{name,role:name.startsWith('Guest')?'guest':'child'},document:{addEventListener(){}},window:{addEventListener(){}},appHeader:new El('header'),crypto,TextEncoder,Uint8Array,URL,Peer,sessionValid:()=>true,
    location:{origin:'https://example.org',pathname:'/etm/'},navigator:{clipboard:{writeText:async s=>{invite=s}}},sessionStorage:{getItem:k=>storage.get(k),removeItem:k=>storage.delete(k)},queueMicrotask,
    setTimeout:(fn,t)=>setTimeout(fn,t).unref(),clearTimeout,setInterval:(fn,t)=>setInterval(fn,t).unref(),clearInterval,
    learningPage(){root?.remove();root=new El('main');return root},learningPlayTogether(){},notice:s=>notices.push(s),
    node:(tag,text,parent,cls)=>Object.assign(new El(tag,text||'',parent),{className:cls}),
    btn:(text,fn,parent,cls)=>Object.assign(new El('button',text,parent),{onclick:fn,className:cls})};
  vm.runInNewContext(code,ctx);
  function byLabel(label){return root?.all().find(n=>n.textContent===label&&n.tag==='button')}
  return {ctx,notices,byLabel,button(label){const b=byLabel(label);assert.ok(b,label);return b.click()},get root(){return root},get token(){return invite?.split('#play=')[1]},send(text){root.all().find(n=>n.tag==='input').value=text;root.all().find(n=>n.tag==='form').onsubmit({preventDefault(){}})}};
}
async function until(check){for(let i=0;i<100;i++){if(check())return;await new Promise(r=>setTimeout(r,3))}assert.ok(check(),'waiting for peer or UI')}
for(const four of [false,true]){
  const host=device('Emily');host.ctx.window.ETMFriends.open();if(four)host.button('Connect four');host.button('Invite a friend');
  await until(()=>host.byLabel('Copy invitation'));await host.button('Copy invitation');assert.match(host.token,/^[a-f0-9]{48}$/);
  const guest=device('Guest · Scout',host.token);await until(()=>guest.byLabel('Join my friend'));
  guest.button('Join my friend');await until(()=>host.byLabel('Let them in'));
  assert.ok(!guest.root.all().some(e=>e.tag==='form'));assert.ok(!host.root.all().some(e=>e.tag==='form'));
  host.button('Let them in');await until(()=>guest.root.all().some(e=>e.tag==='form'));
  const outsider=device('Guest · Third',host.token);await until(()=>outsider.byLabel('Join my friend'));outsider.button('Join my friend');await until(()=>outsider.root?.textContent.includes('room is closed'));assert.ok(!outsider.root.all().some(e=>e.tag==='form'));
  const peer=[...peers.values()].find(p=>p.id.startsWith('etm-friend-'));
  peer.links[0].other.send({type:'move',cell:2,step:0,round:1});await new Promise(r=>setImmediate(r));
  const cells=d=>d.root.all().filter(e=>e.className===(four?'friendColumn':'friendCell'));
  assert.ok(!cells(host)[0].disabled);
  guest.send('Hello Emily!');await until(()=>host.root.textContent.includes('Hello Emily!'));
  host.button('Mute chat');guest.send('muted text');await new Promise(r=>setImmediate(r));assert.ok(!host.root.textContent.includes('muted text'));host.button('Turn chat on');
  host.ctx.learningPage();guest.send('Your turn');await until(()=>host.notices.some(n=>n.includes('sent a friend message')));
  host.ctx.appHeader.all().find(e=>e.tag==='button').click();assert.ok(host.root.textContent.includes('Your turn'));
  const moves=four?[0,1,0,1,0,1,0]:[0,3,1,4,2];
  for(let i=0;i<moves.length;i++){
    const d=i%2?guest:host;assert.ok(!cells(d)[moves[i]].disabled);cells(d)[moves[i]].click();await new Promise(r=>setImmediate(r));
  }
  assert.ok(host.root.textContent.includes('You won!'));assert.ok(guest.root.textContent.includes('Emily won!'));
  host.button('Play again');await until(()=>guest.root.textContent.includes('Your turn'));assert.ok(cells(guest).every(b=>!b.disabled));
  guest.button('Leave game');await until(()=>host.root.textContent.includes('room is closed'));assert.equal(peers.size,0);
}
assert.ok(packets.every(p=>!['audio','video','manifest','family','pin'].some(k=>k in p)));
console.log('PASS Two separate clients: approved guest, third seat rejected, turn enforcement, both games, rematch, mute, unread notice and disconnect.');
