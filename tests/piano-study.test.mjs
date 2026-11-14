import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const ctx={window:{},console,Math,Date,TextDecoder,Uint8Array,Set,Map,innerWidth:1000,gid:()=> 'fixture'};
vm.createContext(ctx);
for(const f of ['piano-study-core.js','piano-guides.js','learning-data.js','learning-extra.js','learning-core.js'])vm.runInContext(readFileSync(new URL('../'+f,import.meta.url),'utf8'),ctx);
const C=ctx.ETM_STUDY,G=ctx.ETM_GUIDES;
const plain=x=>JSON.parse(JSON.stringify(x));
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const piece={tempo:76,time:[4,4],tempos:[{beat:8,bpm:126,pulse:1.5}],bars:[{number:1,label:'1',start:0,length:4,beats:4,beatType:4},{number:2,label:'2',start:4,length:4,beats:4,beatType:4},{number:3,label:'3',start:8,length:3,beats:6,beatType:8}]};
C.cleanTempo(piece);assert.equal(piece.tempos.length,2);near(C.beatUnit('quarter',1),1.5);near(C.beatUnit('half',2),3.5);near(C.tempoAt(piece,7),76);near(C.tempoAt(piece,8),126);near(C.tempoAt(piece,9,false),76);
near(C.seconds(piece,0,11,100,true),8*60/76+3*60/126);
for(const speed of [25,50,75,100])for(const follow of [true,false])for(const start of [0,4,8,9])for(const end of [start+.01,start+1,start+12])near(C.beatAt(piece,start,C.seconds(piece,start,end,speed,follow),speed,follow),end);
assert.deepEqual(plain(C.countIn(piece,8)),{beats:3,pulse:1.5});assert.equal(C.metronomeKey(piece,8.1),C.metronomeKey(piece,9.4));assert.notEqual(C.metronomeKey(piece,9.4),C.metronomeKey(piece,9.5));
assert.equal(C.percent(2,3),67);assert.equal(C.percent(0,0),null);assert.equal(C.percent(22,20),100);
const profile=C.profile();for(const r of [{id:'a',key:'same',label:'Piece',at:1,good:2,total:4},{id:'b',key:'different-settings',label:'Piece',at:2,good:10,total:10},{id:'c',key:'same',label:'Piece',at:3,good:3,total:4}])assert.equal(C.add(profile,r),true);assert.equal(C.add(profile,profile.results[0]),false);assert.equal(C.comparison(profile,'same').delta,25);assert.equal(C.comparison(profile,'different-settings').previous,null);
assert.equal(C.profile({results:[{id:'bad',key:'x',label:'X',at:1,good:2,total:1}]}).results.length,0);
const state=ctx.ETM_CORE.fresh(),other=ctx.ETM_CORE.fresh();state.piano={Dad:{...plain(profile),updated:1,completed:['one']}};other.piano={Dad:{...plain(profile),stage:'primary',updated:2,completed:['two']}};
const merged=ctx.ETM_CORE.merge(state,other);assert.equal(merged.piano.Dad.results.length,3);assert.equal(merged.piano.Dad.stage,'primary');assert.deepEqual(plain(merged.piano.Dad.completed),['one','two']);assert.equal(state.piano.Dad.stage,'beginner');
const songs=[{id:'1',title:'A song — Easy (Single Bass Notes)',composer:'Doyle',favourite:true,practiceStatus:'practising',lastPlayed:5},{id:'2',title:'A song — Full chords',arrangement:'Full chords',practiceStatus:'completed',lastPlayed:8},{id:'3',title:'B song',composer:'Other',lastPlayed:3}];
assert.equal(C.library(songs,'','all','az').length,2);assert.equal(C.library(songs,'','all','az')[0].pieces.length,2);assert.equal(C.library(songs,'doyle','all','recent')[0].pieces[0].id,'1');assert.equal(C.library(songs,'','completed','recent')[0].pieces[0].id,'2');assert.equal(C.library(songs,'','favourites','recent')[0].pieces[0].id,'1');assert.equal(C.library(songs,'missing','all','recent').length,0);assert.equal(songs.length,3);
for(const stage of C.stages)for(const l of G.lessons(stage)){assert.ok(l.id&&l.text&&l.kind);if(['play','piece','reading','chord'].includes(l.kind)){const p=G.piece(l,stage,l.kind==='chord');assert.equal(p.bars.length,4);assert.ok(p.events.every(e=>e.pitch>=21&&e.pitch<=108&&e.duration>0&&e.start+e.duration<=16));assert.ok(p.guideLesson===l.id);if(l.hand==='left')assert.ok(p.events.every(e=>e.hand==='left'));}}
assert.ok(G.lessons('grade8')[0].text.includes('not a complete taught course'));
// Exercise the actual import/render functions, using a minimal DOM fixture with the
// same selectors the browser's XML DOM supplies (no production parser substitute).
const source=readFileSync(new URL('../index.html',import.meta.url),'utf8');
function fn(name){const a=source.indexOf('  function '+name+'(');assert.ok(a>=0,name);return source.slice(a,source.indexOf('\n  function ',a+4)).split('\n  async function ')[0].split('\n  var coachOptions=')[0]}
for(const name of ['xmlText','cleanPiece','parseMusicXML','parseMIDI','escapeHTML','diatonic','clefSVG','scoreSVG'])vm.runInContext(fn(name),ctx);
class X{constructor(name,text='',children=[],attrs={}){this.localName=name;this.text=text;this.children=children;this.attrs=attrs}get textContent(){return this.text+this.children.map(c=>c.textContent).join('')}getAttribute(k){return this.attrs[k]??null}hasAttribute(k){return k in this.attrs}all(){return this.children.flatMap(c=>[c,...c.all()])}querySelector(s){return this.querySelectorAll(s)[0]||null}querySelectorAll(s){const parts=s.split('>').map(x=>x.trim());let matches=this.all().filter(c=>c.localName===parts[0]);for(const part of parts.slice(1))matches=matches.flatMap(c=>c.children.filter(n=>n.localName===part));return matches}}
const x=(name,text='',children=[],attrs={})=>new X(name,text,children,attrs),note=(pitch,octave,duration)=>x('note','',[x('pitch','',[x('step',pitch),x('octave',String(octave))]),x('duration',String(duration))]);
const direction=(tempo,unit,dots=0,sound)=>x('direction','',[x('direction-type','',[x('metronome','',[x('beat-unit',unit),...Array.from({length:dots},()=>x('beat-unit-dot')),x('per-minute',String(tempo))])]),...(sound?[x('sound','',[],{tempo:String(sound)})]:[])]);
const doc=x('#document','',[x('score-partwise','',[x('identification','',[x('creator','Composer')]),x('part','',[
 x('measure','',[x('attributes','',[x('divisions','1'),x('time','',[x('beats','4'),x('beat-type','4')])]),direction(76,'quarter'),note('C',4,4)],{number:'1'}),
 x('measure','',[x('attributes','',[x('time','',[x('beats','6'),x('beat-type','8')])]),direction(84,'quarter',1,126),note('D',4,3)],{number:'2'})
])])]);
ctx.DOMParser=class{parseFromString(){return doc}};
const imported=ctx.parseMusicXML('fixture','Song');assert.equal(imported.composer,'Composer');assert.deepEqual(plain(imported.tempos),[{beat:0,bpm:76,pulse:1},{beat:4,bpm:126,pulse:1.5}]);assert.equal(imported.bars[1].length,3);assert.equal(C.pulse(imported,4),1.5);
// With no sound attribute, dotted metronome markings still become quarter BPM.
doc.querySelectorAll('sound').forEach(s=>delete s.attrs.tempo);assert.equal(ctx.parseMusicXML('fixture','Song').tempos[1].bpm,126);
const u32=n=>[n>>>24&255,n>>>16&255,n>>>8&255,n&255];
function midi(events){const a=[...Buffer.from('MThd'),0,0,0,6,0,0,0,1,0,96,...Buffer.from('MTrk'),...u32(events.length),...events];return new Uint8Array(a).buffer}
let p=ctx.parseMIDI(midi([0,0x90,60,90,96,0x80,60,0,0,0xff,0x2f,0]),'MIDI');assert.equal(p.tempo,120);assert.equal(p.events[0].duration,1);
p=ctx.parseMIDI(midi([0,0xff,0x51,3,0x0f,0x42,0x40,0,0x90,60,90,96,0xff,0x51,3,0x07,0xa1,0x20,96,0x80,60,0,0,0xff,0x2f,0]),'MIDI');assert.deepEqual(plain(p.tempos).map(t=>[t.beat,t.bpm]),[[0,60],[1,120]]);near(C.seconds(p,0,2,100,true),1.5);
ctx.musicEventLabel=e=>String(e.pitch);
const svg=ctx.scoreSVG(imported,1,2,true,new Set(),{beat:4,expected:new Set(['4:62'])});assert.equal((svg.match(/data-score-cursor/g)||[]).length,1);assert.match(svg,/#cc932c/);assert.match(svg,/v165/);assert.ok(!ctx.scoreSVG(imported,1,2,true,new Set()).includes('data-score-cursor'));
console.log('PASS Tempo-map integrals/inversion, dotted 6/8 pulse/count-in, MusicXML/MIDI imports, score cursor/expected notes, honest percentages, matching comparisons, backup union, library groups/search/filters and all guided stages.');
p=ctx.parseMIDI(midi([0,0x90,60,90,0x83,0,0xff,0x58,4,6,3,24,8,0,0x80,60,0,0,0x90,62,90,0x82,0x20,0x80,62,0,0,0xff,0x2f,0]),'Changing metre');assert.equal(p.bars[0].length,4);assert.equal(p.bars[1].start,4);assert.equal(p.bars[1].length,3);assert.equal(p.bars[1].beats,6);assert.equal(p.events[1].bar,2);assert.equal(C.pulse(p,4),1.5);
console.log('PASS MIDI metre changes retain correct bar lengths, hand-note placement and compound pulse.');
