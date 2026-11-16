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
  clearTimeout(call.timer);clearTimeout(call.reconnectTimer);clearTimeout(call.restartTimer);clearTimeout(call.requestTimer);clearTimeout(call.incomingTimer);call.cameraTrack?.stop();call.pendingCamera?.stop();
  call.stream?.getTracks().forEach(track=>track.stop());call.pc?.close();call.panel.remove();call.badge?.remove();
  if(text)notice(text);
}
function showCallControls(call,open,focus=false){
  if(!current(call))return;
  if(!call.badge){
    call.badge=btn(call.video?'📹 Video':'☎ Call',()=>showCallControls(call,call.panel.inert,true),appHeader,'liveCallBadge');
    call.badge.setAttribute('aria-controls',call.panel.id);
    call.hide=btn('Back to activity',()=>showCallControls(call,false,true),call.panel,'primaryButton');
  }
  call.panel.inert=!open;
  call.panel.classList.toggle('callInHeader',!open);
  call.badge.setAttribute('aria-expanded',String(open));
  call.badge.setAttribute('aria-label','Call controls · '+call.other.name);
  if(focus)(open?call.hide:call.badge).focus();
}
function newCall(other,id,video,outgoing){
  if(!familyActor()||activeCall)return;
  const panel=node('section',undefined,document.body,'privateCall');
  const call=activeCall={id,other,video,outgoing,session:accessSession,phase:outgoing?'ringing':'invited',ice:[],panel};
  panel.id='etmPrivateCall';
  call.title=node('strong',(video?'Video call':'Voice call')+' with '+other.name,panel);
  call.status=node('p',outgoing?'Ringing…':other.name+' is calling you.',panel);call.status.setAttribute('role','status');
  if(!outgoing)call.accept=btn('Answer',()=>capture(call),panel,'primaryButton');
  call.end=btn(outgoing?'End call':'Decline call',()=>endCall(),panel,'quietButton');
  call.timer=setTimeout(()=>{if(current(call))endCall('The call timed out.')},60000);
  if(outgoing)signal(call,'invite',{cameraSwitch:1});
  return call;
}
// Voice uses the original microphone throughout. Reserve a video sender without
// opening a camera, so either participant can request video later in the call.
function paintCamera(call){
  if(!current(call)||!call.camButton)return;
  const b=call.camButton;
  b.hidden=!!call.incomingRequest;
  b.disabled=!!call.cameraBusy||!!call.videoRequest;
  b.textContent=call.cameraBusy?'Opening camera…':call.videoRequest?'Waiting for '+call.other.name+'…':
    call.cameraTrack?'Turn my camera off':call.videoAgreed?'Turn my camera on':'Switch to video';
  call.badge.textContent=call.incomingRequest?'📹 Video request':'☎ Call';
  call.badge.setAttribute('aria-label',call.incomingRequest?'Video request from '+call.other.name:'Call controls · '+call.other.name);
  if(call.videoAgreed)call.title.textContent='Video call with '+call.other.name;
}
function remotePicture(call){
  if(!call.remoteVideo||(!call.video&&!call.videoAgreed))return;
  if(!call.picture){call.picture=node('video',undefined,call.panel);call.picture.autoplay=true;call.picture.playsInline=true;call.picture.muted=true}
  if(call.picture.srcObject!==call.remoteVideo)call.picture.srcObject=call.remoteVideo;
  const play=()=>call.picture.play()?.then(()=>{call.showPicture?.remove();call.showPicture=null}).catch(()=>{
    if(current(call)&&!call.showPicture)call.showPicture=btn('Show call video',play,call.panel,'primaryButton');
  });
  play();
  call.picture.hidden=!call.video&&!call.remoteCameraOn;
}
async function startOwnCamera(call){
  if(!current(call)||!call.videoAgreed||call.cameraBusy||call.cameraTrack)return;
  call.cameraBusy=true;paintCamera(call);let stream,keep;
  try{
    stream=await navigator.mediaDevices.getUserMedia({audio:false,video:true});
    const track=stream.getVideoTracks()[0];if(!current(call)||!track)return;
    call.pendingCamera=track;await call.cameraSender.replaceTrack(track);if(!current(call))return;
    keep=call.cameraTrack=track;
    const off=()=>{if(!current(call)||call.cameraTrack!==track)return;call.cameraTrack=null;signal(call,'camera-state',{on:false,seq:++call.camSeq});paintCamera(call)};
    track.onended=off;signal(call,'camera-state',{on:true,seq:++call.camSeq});
    call.status.textContent='Your camera is on.';
  }catch{if(current(call))call.status.textContent='Your camera couldn’t start. You can keep talking or try again.'}
  finally{call.pendingCamera=null;stream?.getTracks().forEach(t=>{if(t!==keep)t.stop()});call.cameraBusy=false;paintCamera(call)}
}
function clearIncoming(call){
  clearTimeout(call.incomingTimer);call.incomingRequest=null;call.question?.remove();call.question=null;paintCamera(call);
}
function askCamera(call){
  if(!current(call)||call.videoRequest||call.incomingRequest||call.cameraBusy)return;
  if(call.cameraTrack){
    const track=call.cameraTrack;call.cameraTrack=null;track.stop();
    call.cameraSender.replaceTrack(null).catch(()=>{});signal(call,'camera-state',{on:false,seq:++call.camSeq});
    call.status.textContent='Your camera is off. You can keep talking.';paintCamera(call);return;
  }
  if(call.videoAgreed){void startOwnCamera(call);return}
  const request=call.videoRequest=crypto.randomUUID();paintCamera(call);
  signal(call,'video-request',{request});
  call.requestTimer=setTimeout(()=>{if(current(call)&&call.videoRequest===request){
    call.videoRequest=null;signal(call,'video-cancel',{request});call.status.textContent='No reply. Your voice call is still on.';paintCamera(call)
  }},30000);
}
function handleCamera(call,d,at){
  if(!current(call)||call.phase!=='live'||!call.camButton)return;
  if(d.kind==='camera-state'){
    if(typeof d.on==='boolean'&&Number.isSafeInteger(d.seq)&&d.seq>(call.remoteSeq||0)){
      call.remoteSeq=d.seq;call.remoteCameraOn=d.on;remotePicture(call);
    }return;
  }
  if(typeof d.request!=='string'||d.request.length!==36)return;
  if(d.kind==='video-cancel'){if(call.incomingRequest===d.request)clearIncoming(call);return}
  if(d.kind==='video-yes'||d.kind==='video-no'){
    if(d.request!==call.videoRequest)return;
    clearTimeout(call.requestTimer);call.videoRequest=null;
    if(d.kind==='video-yes'){call.videoAgreed=true;remotePicture(call);void startOwnCamera(call)}
    else call.status.textContent=call.other.name+' chose to stay on voice.';
    paintCamera(call);return;
  }
  if(d.kind!=='video-request'||Date.now()-at>30000||call.incomingRequest||call.videoAgreed)return;
  // If both tapped at once, keep one prompt, on the original caller's partner.
  if(call.videoRequest){if(call.outgoing)return;clearTimeout(call.requestTimer);call.videoRequest=null}
  call.incomingRequest=d.request;paintCamera(call);
  const box=call.question=node('div',undefined,call.panel,'videoRequest');
  node('strong',call.other.name+' wants to switch to video.',box);
  node('p','You can watch with your camera off.',box);
  function answer(yes){
    if(!current(call)||call.incomingRequest!==d.request)return;
    clearIncoming(call);signal(call,yes?'video-yes':'video-no',{request:d.request});
    if(yes){call.videoAgreed=true;remotePicture(call);call.status.textContent='Your camera is off.'}
    else call.status.textContent='You’re still on voice.';
    paintCamera(call);
  }
  btn('See video',()=>answer(true),box,'primaryButton');btn('Stay on voice',()=>answer(false),box,'quietButton');
  call.incomingTimer=setTimeout(()=>answer(false),30000);
}
async function restartCall(call){
  if(!current(call)||!call.outgoing||!call.pc?.remoteDescription||call.restartId||call.pc.signalingState!=='stable')return;
  const pc=call.pc,id=call.restartId=crypto.randomUUID();
  try{await pc.setLocalDescription(await pc.createOffer({iceRestart:true}));
    if(current(call))signal(call,'reoffer',{restart:id,description:pc.localDescription.toJSON()});
  }catch{if(current(call))call.restartId=null}
}
function callInterrupted(call){
  if(call.interrupted)return;
  call.interrupted=true;call.status.textContent='Connection interrupted. Reconnecting…';
  if(call.badge)call.badge.textContent='Reconnecting…';
  call.restartTimer=setTimeout(()=>{
    if(!current(call)||!call.interrupted)return;
    if(call.outgoing)void restartCall(call);else signal(call,'retry-route');
  },3500);
  call.reconnectTimer=setTimeout(()=>{if(current(call)&&call.interrupted)endCall('Couldn’t reconnect the call. Try calling again on another network.')},30000);
}
async function capture(call){
  if(!current(call)||!['ringing','invited'].includes(call.phase))return;
  call.phase='connecting';call.end.textContent='End call';call.accept?.remove();call.status.textContent='Connecting…';
  try{
    window.ETMPiano?.releasePlayback?.();
    let stream;
    try{stream=await navigator.mediaDevices.getUserMedia({audio:true,video:call.video})}
    catch(error){
      if(!current(call))return;
      if(!call.video)throw error;
      call.phase='camera-unavailable';call.status.textContent='Couldn’t open the camera and microphone. Check their permissions or try a voice call.';
      btn('Try a voice call',()=>{if(!current(call))return;const partner=call.other;endCall();newCall(partner,crypto.randomUUID(),false,true)},call.panel,'primaryButton');
      return;
    }
    if(!current(call)){stream.getTracks().forEach(t=>t.stop());return}
    call.stream=stream;
    const pc=call.pc=new RTCPeerConnection({iceServers:[{urls:'stun:stun.l.google.com:19302'}]});
    stream.getTracks().forEach(t=>pc.addTrack(t,stream));
    if(!call.video&&call.peerSwitch&&call.outgoing&&pc.addTransceiver){
      try{call.cameraSender=pc.addTransceiver('video',{direction:'sendrecv',streams:[stream]}).sender}catch{/* Voice remains available. */}
    }
    pc.onicecandidate=e=>{if(e.candidate&&current(call))signal(call,'ice',{candidate:e.candidate.toJSON()})};
    pc.onconnectionstatechange=()=>{
      if(!current(call))return;
      const state=pc.connectionState||pc.iceConnectionState;
      if(state==='connected'||state==='completed'){clearTimeout(call.timer);
        if(call.interrupted){call.interrupted=false;clearTimeout(call.restartTimer);clearTimeout(call.reconnectTimer);
          call.status.textContent='Reconnected to '+call.other.name;if(call.badge)call.badge.textContent=call.video?'📹 Video':'☎ Call'}
        if(call.phase!=='live'){call.phase='live';call.status.textContent='Private call with '+call.other.name;showCallControls(call,!!call.needsPlay);
        if(!call.video&&call.cameraSender){call.camSeq=0;call.camButton=btn('Switch to video',()=>askCamera(call),call.panel,'quietButton');paintCamera(call)}
      }}
      if(state==='closed')endCall('Call ended.');
      if(state==='failed'||state==='disconnected')callInterrupted(call);
    };
    pc.oniceconnectionstatechange=pc.onconnectionstatechange;
    pc.ontrack=e=>{
      if(!current(call))return;
      const stream=e.streams[0]||new MediaStream([e.track]);
      if(e.track.kind==='video'){
        call.remoteVideo=stream;remotePicture(call);
      }else if(!call.player){
        call.player=node('audio',undefined,call.panel);call.player.autoplay=true;call.player.srcObject=stream;
        call.player.play()?.catch(()=>{
          if(!current(call))return;call.needsPlay=true;showCallControls(call,true);
          call.status.textContent='Tap to hear '+call.other.name+'.';
          const play=btn('Play call audio',async()=>{try{await call.player.play();call.needsPlay=false;play.remove();showCallControls(call,false,true)}catch{notice('Check audio output and try again.')}},call.panel,'primaryButton');
        });
      }
    };
    for(const track of stream.getTracks()){
      const label=track.kind==='video'?'Camera':'Mic';
      const button=btn(label+' on',()=>{track.enabled=!track.enabled;button.textContent=label+(track.enabled?' on':' off')},call.panel,'quietButton');
    }
    if(!call.outgoing){signal(call,'accepted',{cameraSwitch:1});return}
    await pc.setLocalDescription(await pc.createOffer());
    if(current(call))signal(call,'offer',{description:pc.localDescription.toJSON()});
  }catch{if(current(call))endCall('Could not start the call. Check camera and microphone access.')}
}
async function drainCallIce(call){
  const pc=call.pc;if(!pc?.remoteDescription)return;
  const sdp=pc.remoteDescription.sdp||'';
  for(const candidate of call.ice.splice(0)){
    if(!current(call))return;
    if(candidate.usernameFragment&&sdp&&!sdp.includes('a=ice-ufrag:'+candidate.usernameFragment)){
      if(call.ice.length<100)call.ice.push(candidate);continue;
    }
    try{await pc.addIceCandidate(candidate)}catch{/* A stale route does not end the call. Other candidates may still work. */}
  }
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
    if(other&&!activeCall){const c=newCall(other,d.id,d.video,false);c.peerSwitch=d.cameraSwitch===1}
    else if(other)send('etm-call-12',{to:b.from,name:b.name,id:d.id,kind:'busy'});
    return;
  }
  const call=activeCall;
  if(!call||!current(call)||call.id!==d.id||call.other.id!==b.from||call.other.name!==b.name||call.other.authEpoch!==b.epoch)return;
  if(d.kind==='end'||d.kind==='busy'){endCall(d.kind==='busy'?b.name+' is busy.':'Call ended.',false);return}
  if(d.kind==='accepted'&&call.outgoing){call.peerSwitch=d.cameraSwitch===1;void capture(call);return}
  if(['video-request','video-cancel','video-yes','video-no','camera-state'].includes(d.kind)){handleCamera(call,d,b.at);return}
  try{
    if(d.kind==='retry-route'){if(call.outgoing&&call.phase==='live')void restartCall(call);return}
    if(d.kind==='reoffer'||d.kind==='reanswer'){
      if(!call.pc?.remoteDescription||typeof d.restart!=='string'||d.restart.length!==36||
        d.description?.type!==(d.kind==='reoffer'?'offer':'answer')||typeof d.description.sdp!=='string'||d.description.sdp.length>100000)return;
      if(d.kind==='reoffer'){
        if(call.outgoing||call.lastRestart===d.restart||call.pc.signalingState!=='stable')return;
        call.lastRestart=d.restart;await call.pc.setRemoteDescription(d.description);
        if(!current(call))return;await call.pc.setLocalDescription(await call.pc.createAnswer());
        if(current(call))signal(call,'reanswer',{restart:d.restart,description:call.pc.localDescription.toJSON()});
      }else if(call.outgoing&&call.restartId===d.restart&&call.pc.signalingState==='have-local-offer'){
        await call.pc.setRemoteDescription(d.description);call.restartId=null;
      }
      await drainCallIce(call);return;
    }
    if(d.kind==='ice'&&d.candidate){if(call.ice.length<100)call.ice.push(d.candidate);await drainCallIce(call);return}
    if(call.phase!=='connecting'||!call.pc||call.pc.remoteDescription)return;
    const expected=call.outgoing?'answer':'offer';
    if(d.kind!==expected||d.description?.type!==expected)return;
    await call.pc.setRemoteDescription(d.description);
    await drainCallIce(call);
    if(!call.outgoing&&current(call)){
      if(!call.video&&call.peerSwitch){
        const camera=call.pc.getTransceivers?.().find(t=>t.receiver.track.kind==='video');
        if(camera){try{camera.direction='sendrecv';call.cameraSender=camera.sender}catch{/* Audio still works. */}}
      }
      await call.pc.setLocalDescription(await call.pc.createAnswer());if(current(call))signal(call,'answer',{description:call.pc.localDescription.toJSON()})}
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
