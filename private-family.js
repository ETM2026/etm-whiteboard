// Signed signalling chooses one profile and device. WebRTC establishes its media keys
// from the fingerprints in those signed offers and answers.
let activeCall=null, chosenRecipient='',recipientActor=null, chatTone=null;
function familyActor(){return accessSession&&sessionValid(accessSession)&&['dad','child'].includes(accessSession.role)&&pl?.n===accessSession.name}
function allowedDevices(){return familyActor()?connectedMembers().filter(m=>m.id!==me&&m.privateVersion===12&&['dad','child'].includes(m.authRole)&&m.key):[]}
function recipient(){
  if(recipientActor!==accessSession){chosenRecipient='';recipientActor=accessSession}
  const names=allowedDevices().map(m=>m.name);
  return chosenRecipient||(names.length&&names.every(n=>n===names[0])?names[0]:'');
}
function selectRecipient(name){recipientActor=accessSession;chosenRecipient=name}
async function letterKey(pub){
  const remote=await crypto.subtle.importKey('jwk',pub,{name:'ECDH',namedCurve:'P-256'},false,[]);
  return crypto.subtle.deriveKey({name:'ECDH',public:remote},memberKeys.privateKey,{name:'AES-GCM',length:256},false,['encrypt','decrypt']);
}
async function transmit(m){
  const session=accessSession;
  for(const dest of m.to){
    const device=allowedDevices().find(x=>x.id===dest.id&&x.chatKey===dest.key&&x.name===dest.name);
    if(!device||m.receipts.has(dest.id))continue;
    const iv=crypto.getRandomValues(new Uint8Array(12));
    const payload={id:m.id,from:me,who:m.who,owner:m.owner,family:accessRoom,text:m.text,at:m.at,to:[{id:dest.id,key:dest.key}]};
    const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await letterKey(device.key),new TextEncoder().encode(JSON.stringify(payload)));
    if(session===accessSession)await send('etm-letter-12',{to:dest.id,name:dest.name,key:memberKeys.public,iv:b64(iv),box:b64(cipher)});
  }
}
function signal(call,kind,extra={}){
  if(call.session===accessSession&&familyActor())send('etm-call-12',{to:call.other.id,name:call.other.name,id:call.id,kind,video:call.video,...extra});
}
function current(call){return activeCall===call&&familyActor()&&accessSession===call.session}
function endCall(text='',tell=true){
  const call=activeCall;if(!call)return;
  activeCall=null;
  if(tell)signal(call,'end');
  clearTimeout(call.timer);
  call.stream?.getTracks().forEach(track=>track.stop());call.pc?.close();call.panel.remove();
  if(text)notice(text);
}
function newCall(other,id,video,outgoing){
  if(!familyActor()||activeCall)return;
  const panel=node('section',undefined,document.body,'privateCall');
  const call=activeCall={id,other,video,outgoing,session:accessSession,phase:outgoing?'ringing':'invited',ice:[],panel};
  const title=node('strong',(video?'Video call':'Voice call')+' with '+other.name,panel);
  call.status=node('p',outgoing?'Ringing…':other.name+' is calling you.',panel);call.status.setAttribute('role','status');
  if(!outgoing)call.accept=btn('Answer',()=>capture(call),panel,'primaryButton');
  btn(outgoing?'End call':'Close call',()=>endCall(),panel,'quietButton');
  call.timer=setTimeout(()=>{if(current(call))endCall('The call timed out.')},60000);
  if(outgoing)signal(call,'invite');
  return call;
}
async function capture(call){
  if(!current(call)||!['ringing','invited'].includes(call.phase))return;
  call.phase='connecting';call.accept?.remove();call.status.textContent='Connecting…';
  try{
    window.ETMPiano?.releasePlayback?.();
    const stream=await navigator.mediaDevices.getUserMedia({audio:true,video:call.video});
    if(!current(call)){stream.getTracks().forEach(t=>t.stop());return}
    call.stream=stream;
    const pc=call.pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
    stream.getTracks().forEach(t=>pc.addTrack(t,stream));
    pc.onicecandidate=e=>{if(e.candidate&&current(call))signal(call,'ice',{candidate:e.candidate.toJSON()})};
    pc.onconnectionstatechange=()=>{
      if(!current(call))return;
      if(pc.connectionState==='connected'){clearTimeout(call.timer);call.phase='live';call.status.textContent='Private call with '+call.other.name}
      if(['closed','failed','disconnected'].includes(pc.connectionState))endCall('Call ended.');
    };
    pc.ontrack=e=>{
      if(!current(call))return;
      if(!call.player){
        const player=call.player=node('video',undefined,call.panel);player.autoplay=true;player.playsInline=true;player.controls=true;
      }
      call.player.srcObject=e.streams[0];call.player.play()?.catch(()=>{call.status.textContent='Tap Play to hear the call.'});
    };
    for(const track of stream.getTracks()){
      const label=track.kind==='video'?'Camera':'Mic';
      const button=btn(label+' on',()=>{track.enabled=!track.enabled;button.textContent=label+(track.enabled?' on':' off')},call.panel,'quietButton');
    }
    if(!call.outgoing){signal(call,'accepted');return}
    await pc.setLocalDescription(await pc.createOffer());
    if(current(call))signal(call,'offer',{description:pc.localDescription.toJSON()});
  }catch{if(current(call))endCall('Could not start the call. Check camera and microphone access.')}
}
async function receive(b,pub){
  const d=b.data,session=accessSession;
  if(!familyActor()||b.family!==accessRoom||!['dad','child'].includes(b.role)||d.to!==me||d.name!==session.name)return;
  if(b.topic==='etm-letter-12'){
    try{
      if(!memberKeys||typeof d.box!=='string'||d.box.length>12000)return;
      const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(d.iv)},await letterKey(d.key),unb64(d.box));
      const letter={...b,topic:'etm-chat-11',data:JSON.parse(new TextDecoder().decode(plain))};
      if(session===accessSession&&chatMessageAllowed(letter))await receiveTextChat(letter,pub);
    }catch{/* An unreadable message receives no receipt. */}
    return;
  }
  if(b.topic!=='etm-call-12'||typeof d.id!=='string'||d.id.length!==36)return;
  if(d.kind==='invite'){
    if(Date.now()-b.at>30000||typeof d.video!=='boolean')return;
    const other=allowedDevices().find(m=>m.id===b.from&&m.name===b.name&&m.authEpoch===b.epoch);
    if(other&&!activeCall)newCall(other,d.id,d.video,false);
    else if(other)send('etm-call-12',{to:b.from,name:b.name,id:d.id,kind:'busy'});
    return;
  }
  const call=activeCall;
  if(!call||!current(call)||call.id!==d.id||call.other.id!==b.from||call.other.name!==b.name||call.other.authEpoch!==b.epoch)return;
  if(d.kind==='end'||d.kind==='busy'){endCall(d.kind==='busy'?b.name+' is busy.':'Call ended.',false);return}
  if(d.kind==='accepted'&&call.outgoing){void capture(call);return}
  try{
    if(d.kind==='ice'&&d.candidate){if(call.pc?.remoteDescription)await call.pc.addIceCandidate(d.candidate);else if(call.ice.length<100)call.ice.push(d.candidate);return}
    if(call.phase!=='connecting'||!call.pc||call.pc.remoteDescription)return;
    const expected=call.outgoing?'answer':'offer';
    if(d.kind!==expected||d.description?.type!==expected)return;
    await call.pc.setRemoteDescription(d.description);
    for(const candidate of call.ice.splice(0))await call.pc.addIceCandidate(candidate);
    if(!call.outgoing&&current(call)){await call.pc.setLocalDescription(await call.pc.createAnswer());if(current(call))signal(call,'answer',{description:call.pc.localDescription.toJSON()})}
  }catch{if(current(call))endCall('The call could not connect.')}
}
function renderContacts(a){
  if(!familyActor()){node('p','Private calls are available to signed-in family members.',a);return}
  if(activeCall)return;
  const devices=allowedDevices();
  if(!devices.length){node('p','Waiting for a family member to open ETM.',a);return}
  devices.forEach(m=>{
    const row=node('div',undefined,a,'callControls');
    btn('Call '+m.name,()=>newCall(m,crypto.randomUUID(),false,true),row,'primaryButton');
    btn('Video call '+m.name,()=>newCall(m,crypto.randomUUID(),true,true),row,'quietButton');
  });
}
function controls(parent){
  const section=node('div',undefined,parent);
  let previous='';
  const refresh=()=>{
    if(!section.isConnected)return false;
    const snapshot=JSON.stringify([accessSession?.name,activeCall?.id,allowedDevices().map(d=>[d.id,d.name])]);
    if(snapshot!==previous){previous=snapshot;section.replaceChildren();renderContacts(section)}
    return true;
  };
  refresh();const timer=setInterval(()=>{if(!refresh())clearInterval(timer)},1000);
}
function chatControls(panel){
  const label=node('label','Send to ',panel,'privateRecipients'),select=node('select',undefined,label);
  const options=['',...new Set(FAMILY.concat('Dad').filter(n=>n!==accessSession.name))];
  options.forEach(n=>{const opt=node('option',n||'Choose someone',select);opt.value=n});
  select.value=recipient();if(select.value)selectRecipient(select.value);
  select.onchange=()=>{selectRecipient(select.value);chatUpdateConnection()};
  const toggle=btn('',()=>{localStorage.setItem('etmChatMuted:'+accessSession.name,String(!muted()));paint()},label,'quietButton');
  function paint(){toggle.textContent=muted()?'Sound off':'Sound on';toggle.setAttribute('aria-pressed',String(!muted()))}paint();
}
function muted(){return localStorage.getItem('etmChatMuted:'+accessSession?.name)==='true'}
function chime(){
  if(muted()||chatTone?.state!=='running')return;
  const tone=chatTone.createOscillator(),gain=chatTone.createGain(),now=chatTone.currentTime;
  tone.frequency.value=660;gain.gain.setValueAtTime(.04,now);gain.gain.exponentialRampToValueAtTime(.001,now+.18);
  tone.connect(gain);gain.connect(chatTone.destination);tone.start();tone.stop(now+.18);
}
document.addEventListener('pointerdown',()=>{try{chatTone||=new (window.AudioContext||window.webkitAudioContext)();if(chatTone.state==='suspended')chatTone.resume().catch(()=>{})}catch{}});
window.addEventListener('pagehide',()=>endCall());
setInterval(()=>{if(activeCall&&!current(activeCall))endCall('',false)},500);
window.ETMPrivate={inCall:()=>!!activeCall,receive,controls,chatControls,transmit,recipient,select:selectRecipient,chime,stop:endCall};
