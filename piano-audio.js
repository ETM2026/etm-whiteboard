// Salamander Grand Piano V3 samples, Alexander Holm, CC BY 3.0.
// MP3 distribution: https://tonejs.github.io/audio/salamander/ . See assets/piano/README.txt.
(function(){
 var fallback=synthNote,cache=new Map(),pending=new Map(),output=null,context=null;
 var notes=[{name:'A0',midi:21}];for(var octave=1;octave<=7;octave++)[['C',0],['Ds',3],['Fs',6],['A',9]].forEach(function(n){notes.push({name:n[0]+octave,midi:(octave+1)*12+n[1]})});notes.push({name:'C8',midi:108});
 function nearest(pitch){return notes.reduce(function(a,b){return Math.abs(b.midi-pitch)<Math.abs(a.midi-pitch)?b:a})}
 let replaceOnTap=false, filePlayer=null, clockOwner=null, clockAt=0, clockValue=0;
 function audio(){var A=window.AudioContext||window.webkitAudioContext;if(!A)return null;if(!synthContext||synthContext.state==='closed')synthContext=new A();if(context!==synthContext){context=synthContext;
 context.addEventListener?.('statechange',function(event){
   if(event.target!==context||context.state==='running'||!coach?.running||!coach.listening)return;
   toggleCoachPause();soundHelp();
 });cache.clear();pending.clear();var compressor=context.createDynamicsCompressor();compressor.threshold.value=-10;compressor.knee.value=12;compressor.ratio.value=4;compressor.attack.value=.003;compressor.release.value=.2;var master=context.createGain();master.gain.value=.75;compressor.connect(master);master.connect(context.destination);output=compressor}return context}
 async function load(pitch){var a=audio();if(!a)return false;var sample=nearest(pitch),name=sample.name;if(cache.has(name))return true;if(pending.has(name))return pending.get(name);var request=fetch('assets/piano/'+name+'.mp3').then(function(r){if(!r.ok)throw Error('Piano sample unavailable');return r.arrayBuffer()}).then(function(data){return a.decodeAudioData(data)}).then(function(buffer){if(context===a)cache.set(name,buffer);return true}).catch(function(){return false}).finally(function(){if(pending.get(name)===request)pending.delete(name)});pending.set(name,request);return request}
 async function prepare(pitches){audio();pitches=pitches||[48,51,54,57,60,63,66,69,72];return (await Promise.all(Array.from(new Set(pitches.map(function(p){return nearest(p).midi}))).map(load))).every(Boolean)}
 function play(pitch,duration,volume){if(!Number.isFinite(pitch)||pitch<21||pitch>108)return;var a=audio(),sample=nearest(pitch),buffer=cache.get(sample.name);if(a&&a.state!=='running')a.resume().catch(()=>{});if(!a||!buffer){load(pitch);fallback(pitch,duration,volume);return}try{var start=a.currentTime,source=a.createBufferSource(),gain=a.createGain(),hold=Math.max(.06,Math.min(20,Number(duration)||.5)),level=Math.max(0,Math.min(.7,(volume===undefined?.13:volume)*3)),end=Math.min(buffer.duration/Math.pow(2,(pitch-sample.midi)/12),hold+.32);source.buffer=buffer;source.playbackRate.value=Math.pow(2,(pitch-sample.midi)/12);gain.gain.setValueAtTime(0,start);gain.gain.linearRampToValueAtTime(level,start+.004);gain.gain.setValueAtTime(level,start+Math.min(hold,end-.005));gain.gain.linearRampToValueAtTime(0,start+end);source.connect(gain);gain.connect(output);source.start(start);source.stop(start+end+.01);source.onended=function(){source.disconnect();gain.disconnect()}}catch(e){fallback(pitch,duration,volume)}}
 let previousType=null;
 function mediaSession(on){
   const session=window.navigator?.audioSession;
   if(!session)return;
   try{
     if(on&&previousType===null&&(!session.type||session.type==='auto'||session.type==='ambient')&&!window.ETMPrivate?.inCall?.()){
       previousType=session.type||'auto';session.type='playback';
     }else if(!on&&previousType!==null){
       if(session.type==='playback')session.type=previousType;
       previousType=null;
     }
   }catch{previousType=null}
 }
 const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
 function prime(ctx){
   const source=ctx.createBufferSource();
   source.buffer=ctx.createBuffer(1,1,ctx.sampleRate);
   source.connect(ctx.destination);source.onended=()=>source.disconnect();source.start();
 }
 async function wake(){
   let ctx;
   try{
     if(replaceOnTap&&synthContext){
       replaceOnTap=false;
       const old=synthContext;synthContext=null;
       old.close?.().catch(()=>{});
     }
     ctx=audio();if(!ctx)return false;
     const before=ctx.currentTime;
     // Both calls happen in the original tap, before any network work.
     const resume=ctx.state==='running'?Promise.resolve():ctx.resume();
     prime(ctx);
     const resumed=await Promise.race([resume.then(()=>true),delay(1400).then(()=>false)]);
     if(resumed){
       for(let i=0;i<8&&ctx.state==='running';i++){
         if(ctx.currentTime>before)return true;
         await delay(40);
       }
     }
   }catch{/* A new tap can create a fresh audio context. */}
   if(ctx&&ctx===context)replaceOnTap=true;
   return false;
 }
 function closePlayer(){
   const p=filePlayer;if(!p)return;
   filePlayer=null;p.abort.abort();
   if(p.element){p.element.pause();p.element.removeAttribute('src');p.element.load();p.element.remove()}
   if(p.url)URL.revokeObjectURL(p.url);
   p.button.disabled=false;p.info.textContent='';mediaSession(false);
 }
 function wave(buffer){
   const pcm=buffer.getChannelData(0),data=new ArrayBuffer(44+pcm.length*2),v=new DataView(data);
   function word(i,s){for(let j=0;j<s.length;j++)v.setUint8(i+j,s.charCodeAt(j))}
   word(0,'RIFF');v.setUint32(4,data.byteLength-8,true);word(8,'WAVE');word(12,'fmt ');
   v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
   v.setUint32(24,buffer.sampleRate,true);v.setUint32(28,buffer.sampleRate*2,true);
   v.setUint16(32,2,true);v.setUint16(34,16,true);word(36,'data');v.setUint32(40,pcm.length*2,true);
   for(let i=0;i<pcm.length;i++)v.setInt16(44+2*i,Math.round(Math.max(-1,Math.min(1,pcm[i]))*32767),true);
   return new Blob([data],{type:'audio/wav'});
 }
 async function listenFile(c,p){
   const {piece,options:o}=c,bars=piece.bars.filter(b=>b.number>=o.first&&b.number<=o.last);
   if(!bars.length)throw Error('Choose some bars first.');
   const start=bars[0].start,end=bars[bars.length-1].start+bars[bars.length-1].length;
   const notes=piece.events.filter(e=>e.start>=start&&e.start<end&&(o.hand==='both'||o.hand===e.hand));
   if(!notes.length)throw Error('Choose a hand and bars that contain notes.');
   const seconds=beat=>window.ETMStudy.seconds(piece,start,Math.min(end,beat),o.speed,o.followTempo!==false);
   const length=seconds(end)+.3,rate=22050;
   if(!Number.isFinite(length)||length<=0||length>480)throw Error('For the audio player, choose up to eight minutes using First bar and Last bar.');
   const Offline=window.OfflineAudioContext||window.webkitOfflineAudioContext;
   const mix=new Offline(1,Math.ceil(length*rate),rate);
   const samples=new Map(),needed=new Set(notes.map(e=>nearest(e.pitch).name));
   const timeout=setTimeout(()=>p.abort.abort(),8000);
   try{
     await Promise.all([...needed].map(async name=>{
       try{
         const existing=cache.get(name);
         if(existing){samples.set(name,existing);return}
         const r=await fetch('assets/piano/'+name+'.mp3',{signal:p.abort.signal});
         if(r.ok)samples.set(name,await mix.decodeAudioData(await r.arrayBuffer()));
       }catch{/* Missing samples use a soft tone for the same note. */}
     }));
   }finally{clearTimeout(timeout)}
   if(filePlayer!==p)return;
   for(const e of notes){
     const at=seconds(e.start),hold=Math.max(.05,(seconds(e.start+e.duration)-at)*.85);
     const sample=nearest(e.pitch),buffer=samples.get(sample.name);
     const source=buffer?mix.createBufferSource():mix.createOscillator(),gain=mix.createGain();
     if(buffer){source.buffer=buffer;source.playbackRate.value=Math.pow(2,(e.pitch-sample.midi)/12)}
     else{source.type='triangle';source.frequency.value=440*Math.pow(2,(e.pitch-69)/12)}
     gain.gain.setValueAtTime(0,at);gain.gain.linearRampToValueAtTime(buffer ? .36 : .12,at+.005);
     gain.gain.setValueAtTime(buffer ? .36 : .12,at+hold);gain.gain.linearRampToValueAtTime(0,at+hold+.18);
     source.connect(gain);gain.connect(mix.destination);source.start(at);source.stop(at+hold+.19);
   }
   const rendered=await mix.startRendering();if(filePlayer!==p)return;
   p.url=URL.createObjectURL(wave(rendered));
   const player=p.element=node('audio',undefined,p.parent);
   player.controls=true;player.preload='auto';player.style.maxWidth='100%';player.src=p.url;
   player.setAttribute('aria-label','Listen to '+piece.title);
   player.onplay=()=>mediaSession(true);player.onpause=player.onended=()=>mediaSession(false);
   p.info.textContent='Tap Play below to hear the selected bars.';player.focus();
 }
 function soundOptions(parent){
   if(!(window.OfflineAudioContext||window.webkitOfflineAudioContext))return;
   const c=coach,panel=node('details',undefined,parent,'lDisclosure');node('summary','Sound help',panel);
   const button=btn('Use audio player',async()=>{
     if(coach!==c)return;
     if(c.running)toggleCoachPause();
     c.audioRequest=(c.audioRequest||0)+1;closePlayer();
     const p=filePlayer={parent:panel,button,info,abort:new AbortController()};
     button.disabled=true;info.textContent='Preparing your piece…';
     try{await listenFile(c,p)}catch(e){
       if(filePlayer===p){closePlayer();info.textContent=e.message||'Could not prepare the audio. Please try again.'}
     }
   },panel,'quietButton');
   const info=node('p','If Listen is silent, try your piece here.',panel);info.setAttribute('role','status');
   panel.ontoggle=()=>{if(!panel.open&&filePlayer?.parent===panel)closePlayer()};
 }
 function soundHelp(){
   const label=document.getElementById('coachStatus');
   if(label)label.textContent='Sound paused. Tap Listen again, or open Sound help to play this piece in the audio player.';
 }
 function canTick(time){
   if(!coach?.listening||!coach.running||!context)return true;
   if(clockOwner!==coach||context.currentTime!==clockValue){
     clockOwner=coach;clockAt=time;clockValue=context.currentTime;return true;
   }
   if(time-clockAt<1400)return true;
   replaceOnTap=true;toggleCoachPause();soundHelp();return false;
 }
 window.ETMPiano={prepare,play,nearest,soundOptions,closePlayer,canTick,releasePlayback:()=>{
   filePlayer?.element?.pause();mediaSession(false);
 }};synthNote=play;
 const baseStop=stopCoach;
 stopCoach=function(){
   closePlayer();
   if(coach)coach.audioRequest=(coach.audioRequest||0)+1;
   mediaSession(false);return baseStop.apply(this,arguments);
 };
 const base=startCoach;
 startCoach=async function(listen){
   const c=coach;if(!c)return;
   closePlayer();
   const token=c.audioRequest=(c.audioRequest||0)+1;
   mediaSession(listen);
   const ready=wake(); // Start synchronously inside the Listen/Practise tap.
   const samples=prepare(c.piece.events.map(e=>e.pitch)).catch(()=>false);
   const awake=await ready;
   if(coach!==c||c.audioRequest!==token)return;
   if(listen&&!awake){mediaSession(false);soundHelp();return}
   await Promise.race([samples,delay(1200)]);
   if(coach!==c||c.audioRequest!==token||document.body.dataset.view!=='coach')return;
   if(listen&&context?.state!=='running'){mediaSession(false);soundHelp();return}
   clockOwner=null;base(listen);
   if(!c.running)mediaSession(false);
 };
 const basePause=toggleCoachPause;
 toggleCoachPause=async function(){
   const c=coach;
   if(c?.listening&&!c.running&&c.pauseAt!=null){
     const token=c.audioRequest;
     mediaSession(true);
     const awake=await wake();
     if(coach!==c||token!==c.audioRequest||c.running)return;
     if(!awake){mediaSession(false);soundHelp();return}
   }
   clockOwner=null;basePause();
   if(!c?.running)mediaSession(false);
 };
 document.addEventListener?.('visibilitychange',()=>{
   if(!document.hidden)return;
   const c=coach;
   if(c){c.audioRequest=(c.audioRequest||0)+1;if(c.running&&c.listening){toggleCoachPause();soundHelp()}}
   if(filePlayer?.element)filePlayer.element.pause();
 });
 const baseFinish=finishCoach;
 finishCoach=function(){mediaSession(false);return baseFinish.apply(this,arguments)};
})();
