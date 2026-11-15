// Salamander Grand Piano V3 samples, Alexander Holm, CC BY 3.0.
// MP3 distribution: https://tonejs.github.io/audio/salamander/ . See assets/piano/README.txt.
(function(){
 var fallback=synthNote,cache=new Map(),pending=new Map(),output=null,context=null;
 var notes=[{name:'A0',midi:21}];for(var octave=1;octave<=7;octave++)[['C',0],['Ds',3],['Fs',6],['A',9]].forEach(function(n){notes.push({name:n[0]+octave,midi:(octave+1)*12+n[1]})});notes.push({name:'C8',midi:108});
 function nearest(pitch){return notes.reduce(function(a,b){return Math.abs(b.midi-pitch)<Math.abs(a.midi-pitch)?b:a})}
 function audio(){var A=window.AudioContext||window.webkitAudioContext;if(!A)return null;if(!synthContext||synthContext.state==='closed')synthContext=new A();if(context!==synthContext){context=synthContext;
 context.addEventListener?.('statechange',function(event){
   if(event.target!==context||context.state==='running'||!coach?.running||!coach.listening)return;
   toggleCoachPause();soundHelp();
 });cache.clear();pending.clear();var compressor=context.createDynamicsCompressor();compressor.threshold.value=-10;compressor.knee.value=12;compressor.ratio.value=4;compressor.attack.value=.003;compressor.release.value=.2;var master=context.createGain();master.gain.value=.75;compressor.connect(master);master.connect(context.destination);output=compressor}return context}
 async function load(pitch){var a=audio();if(!a)return false;var sample=nearest(pitch),name=sample.name;if(cache.has(name))return true;if(pending.has(name))return pending.get(name);var request=fetch('assets/piano/'+name+'.mp3').then(function(r){if(!r.ok)throw Error('Piano sample unavailable');return r.arrayBuffer()}).then(function(data){return a.decodeAudioData(data)}).then(function(buffer){if(context===a)cache.set(name,buffer);return true}).catch(function(){return false}).finally(function(){pending.delete(name)});pending.set(name,request);return request}
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
 async function wake(){
   const ctx=audio();
   if(!ctx)return false;
   if(ctx.state==='running')return true;
   let timer;
   try{
     const resume=ctx.resume();
     // Start a silent buffer during the tap, before waiting for samples.
     const source=ctx.createBufferSource();
     source.buffer=ctx.createBuffer(1,1,ctx.sampleRate);
     source.connect(ctx.destination);source.onended=()=>source.disconnect();source.start();
     await Promise.race([resume,new Promise(resolve=>{timer=setTimeout(resolve,2000)})]);
     return ctx.state==='running';
   }catch{return false}finally{if(timer)clearTimeout(timer)}
 }
 function soundHelp(){
   const label=document.getElementById('coachStatus');
   if(label)label.textContent='Sound is paused. Check media volume and tap Listen again.';
 }
 window.ETMPiano={prepare,play,nearest,releasePlayback:()=>mediaSession(false)};synthNote=play;
 const baseStop=stopCoach;
 stopCoach=function(){
   if(coach)coach.audioRequest=(coach.audioRequest||0)+1;
   mediaSession(false);return baseStop.apply(this,arguments);
 };
 const base=startCoach;
 startCoach=async function(listen){
   const c=coach;if(!c)return;
   const token=c.audioRequest=(c.audioRequest||0)+1;
   mediaSession(listen);
   const ready=wake(); // Start synchronously inside the Listen/Practise tap.
   const samples=prepare(c.piece.events.map(e=>e.pitch));
   const awake=await ready;
   if(coach!==c||c.audioRequest!==token)return;
   if(listen&&!awake){mediaSession(false);soundHelp();return}
   await samples;
   if(coach!==c||c.audioRequest!==token||document.body.dataset.view!=='coach')return;
   if(listen&&context?.state!=='running'){mediaSession(false);soundHelp();return}
   base(listen);
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
   basePause();
   if(!c?.running)mediaSession(false);
 };
 const baseFinish=finishCoach;
 finishCoach=function(){mediaSession(false);return baseFinish.apply(this,arguments)};
})();
