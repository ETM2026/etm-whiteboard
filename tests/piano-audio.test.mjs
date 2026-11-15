import assert from 'node:assert/strict';import vm from 'node:vm';import {readFileSync,readdirSync} from 'node:fs';
const fetched=[],voices=[],fallback=[],starts=[];class Audio{constructor(){this.state='running';this.currentTime=1;this.destination={}}createDynamicsCompressor(){return {threshold:{},knee:{},ratio:{},attack:{},release:{},connect(){}}}createGain(){return {gain:{value:0,setValueAtTime(){},linearRampToValueAtTime(){}},connect(){},disconnect(){}}}createBufferSource(){const n={playbackRate:{},connect(){},disconnect(){},start(){},stop(){}};voices.push(n);return n}async decodeAudioData(){return {duration:4}}}
const ctx={window:{AudioContext:Audio},synthContext:null,synthNote:(...a)=>fallback.push(a),startCoach:x=>starts.push(x),stopCoach(){},toggleCoachPause(){},finishCoach(){},coach:{piece:{events:[{pitch:60},{pitch:64}]},audioRequest:0},document:{body:{dataset:{view:'coach'}}},fetch:async url=>{fetched.push(url);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(10)}}};vm.createContext(ctx);vm.runInContext(readFileSync(new URL('../piano-audio.js',import.meta.url),'utf8'),ctx);assert.equal(await ctx.window.ETMPiano.prepare([60,61,62]),true);assert.equal(fetched.length,2,'nearest samples deduplicated');ctx.synthNote(61,.4,.13);assert.equal(voices.length,1);assert.ok(Math.abs(voices[0].playbackRate.value-Math.pow(2,1/12))<1e-9);assert.equal(fallback.length,0);await ctx.startCoach(true);assert.deepEqual(starts,[true]);assert.ok(fetched.every(x=>x.startsWith('assets/piano/')));const assets=readdirSync(new URL('../assets/piano/',import.meta.url)).filter(x=>x.endsWith('.mp3'));assert.equal(assets.length,30);for(const file of assets){const b=readFileSync(new URL('../assets/piano/'+file,import.meta.url));assert.ok(b.length>10000,file)}
ctx.fetch=async()=>({ok:false});ctx.synthNote(21,.5);assert.equal(fallback.length,1);assert.equal(await ctx.window.ETMPiano.prepare([21]),false);console.log('PASS Local sampled piano loading, deduplication, correct semitone pitch, coach preloading, fallback and 30 packaged sample assets.');
const status={};ctx.document.getElementById=()=>status;
ctx.window.navigator={audioSession:{type:'auto'}};
ctx.clearTimeout=clearTimeout;ctx.setTimeout=setTimeout;
ctx.synthContext.createBuffer=()=>({});
ctx.synthContext.state='interrupted';
let resumed=0;
ctx.synthContext.resume=async()=>{resumed++;throw Error('interrupted')};
await ctx.startCoach(true);
assert.equal(starts.length,1,'Blocked sound must not advance Listen');
assert.match(status.textContent,/tap Listen again/);
assert.equal(ctx.window.navigator.audioSession.type,'auto');
ctx.synthContext.resume=async()=>{resumed++;assert.equal(ctx.window.navigator.audioSession.type,'playback');ctx.synthContext.state='running'};
await ctx.startCoach(true);
assert.equal(resumed,2);assert.equal(starts.length,2);
console.log('PASS Interrupted iPhone audio, retry from Listen and playback category restoration.');
