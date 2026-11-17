// Original interactive teaching tasks. Core marking and planning require no AI.
var ETM_DISCOVERY=(function(){
 var skills={count:{title:'Count and match',min:0},bonds:{title:'Build a number',min:0},exchange:{title:'Tens, units and exchanging',min:1},groups:{title:'Equal groups',min:1},fractions:{title:'Parts of a whole',min:1},balance:{title:'Keep it balanced',min:1}};
 function create(kind,rng){rng=rng||Math.random;function n(a,b){return a+Math.floor(rng()*(b-a+1))}var q={kind:kind};if(kind==='exchange'){q.a=n(3,7)*10+n(1,3);q.b=n(1,2)*10+n(5,8);q.answer=q.a-q.b;q.tens=Math.floor(q.a/10);q.units=q.a%10;q.takeTens=Math.floor(q.b/10);q.takeUnits=q.b%10;q.label=q.a+' − '+q.b+' = ?'}else if(kind==='count'){q.answer=n(3,9);q.label='How many boats are there?'}else if(kind==='bonds'){q.whole=n(6,10);q.part=n(1,q.whole-1);q.answer=q.whole-q.part;q.label=q.part+' + ? = '+q.whole}else if(kind==='groups'){q.groups=n(2,4);q.size=n(2,4);q.answer=q.groups*q.size;q.label=q.groups+' groups of '+q.size+' = ?'}else if(kind==='fractions'){q.parts=[2,3,4][n(0,2)];q.select=1;q.answer=q.parts;q.label='Shade one of '+q.parts+' equal parts. What is the denominator?'}else{q.part=n(2,6);q.whole=q.part+n(2,7);q.answer=q.whole-q.part;q.label='? + '+q.part+' = '+q.whole}return q}
 function exchange(s){if(s.tens<1)return false;s.tens--;s.units+=10;return true}
 function remove(s,place){var key=place==='tens'?'tens':'units',taken=place==='tens'?'removedTens':'removedUnits',want=place==='tens'?s.takeTens:s.takeUnits;if((s[taken]||0)>=want||s[key]<1)return false;s[key]--;s[taken]=(s[taken]||0)+1;return true}
 function done(s){return s.removedTens===s.takeTens&&s.removedUnits===s.takeUnits}
 function choose(profile,name){var order=name==='Matthew'?['count','bonds']:name==='Tommy'?['bonds','groups','exchange','fractions','balance']:['exchange','groups','fractions','balance','bonds'];var due=order.find(function(k){return ETM_CORE.summary(profile,'discovery:'+k,skills[k].min).due});return due||order.find(function(k){return !ETM_CORE.summary(profile,'discovery:'+k,skills[k].min).secure})||order[Math.floor(Math.random()*order.length)]}
 return {skills:skills,create:create,exchange:exchange,remove:remove,done:done,choose:choose};
})();
var discoverySession=null;
function discoverySetup(){var a=learningPage('Learn & practise','maths',learningMath),settings=profileSettings(learningName()),choice=learningSelect(a,'Explore',Object.entries(ETM_DISCOVERY.skills).map(function(x){return [x[0],x[1].title]}),ETM_DISCOVERY.choose(learningProfile(),learningName())),mode=learningSelect(a,'Support',[['teach','Teach me'],['try','Let me try'],['challenge','Challenge · no hints']],settings.mathSupport||'try');node('p','Build it, connect it to the written maths, then try a fresh question. Tap or drag; take your time.',a,'lIntro');btn('Start a little discovery',function(){setProfileSettings(learningName(),{mathSupport:mode.value});discoveryStart(choice.value,mode.value)},a,'primaryButton');btn('All standard practice skills',learningPracticeSetup,a,'quietButton')}
function discoveryStart(kind,mode){discoverySession={id:crypto.randomUUID(),actor:accessSession,name:learningName(),kind:kind,mode:mode||profileSettings(learningName()).mathSupport||'try',index:0,independent:0,questions:Array.from({length:3},function(){return ETM_DISCOVERY.create(kind)})};discoveryQuestion()}
function discoveryQuestion(){var s=discoverySession;if(!s||s.actor!==accessSession||s.name!==learningName())return;var q=s.questions[s.index],a=learningPage(ETM_DISCOVERY.skills[s.kind].title,'maths',discoverySetup);if(!q){discoveryFinish(a);return}if(!q.state)q.state={...q,removedTens:0,removedUnits:0,shaded:[],built:0,helped:s.mode==='teach'&&s.index<2,misses:0,step:0};var state=q.state;node('span','STEP '+(s.index+1)+' OF 3 · '+(s.index===2?'TRY A FRESH QUESTION':s.mode==='teach'?'LEARN & BUILD':s.mode==='challenge'?'INDEPENDENT CHALLENGE':'YOUR TURN'),a,'lEyebrow');var card=node('div',undefined,a,'discoveryCard');node('h2',q.label,card,'discoveryEquation');var area=node('div',undefined,card,'discoveryModel'),message=node('p','',card,'discoveryFeedback');message.setAttribute('role','status');
 function tell(t){message.textContent=t}function rerender(){discoveryQuestion()}function guard(){return s===discoverySession&&s.actor===accessSession&&!state.done}
 var transfer=s.index===2;
 if(!transfer&&q.kind==='exchange'){
   const instruction=node('p','',area,'exchangeInstruction');
   instruction.setAttribute('role','status');
   const visual=node('div',undefined,area,'discoveryPlace');
   const columns=node('div',undefined,area,'discoveryColumns');
   const target=node('div','Or drag a block here to take it away.',area,'discoveryDrop');
   const guided=s.mode!=='challenge';
   function paintExchange(){
     const units=q.takeUnits-state.removedUnits,tens=q.takeTens-state.removedTens;
     const trade=state.units<units;
     const place=trade?'exchange':units?'units':tens?'tens':'answer';
     const count=units||tens;
     instruction.textContent=place==='answer'?'Count the blocks left. What number do they make?':
       !guided?'Work it out your way. The blocks can help.':
       trade?'Only '+state.units+' units. Tap a blue 10 to split it into ten 1s.':
       'Tap '+count+(units?' yellow '+(count===1?'unit':'units'):' blue '+(count===1?'ten':'tens'))+' to take '+(count===1?'it':'them')+' away.';
     visual.replaceChildren();
     function split(){if(guard()&&ETM_DISCOVERY.exchange(state)){tell('');paintExchange();const fresh=visual.querySelectorAll('.discoveryBlock.units');Array.from(fresh).slice(-10).forEach(b=>b.classList.add('newUnit'))}}
     if(!guided&&trade)btn('Swap 1 ten for 10 units',split,visual,'quietButton');
     function remove(block){
       if(!guard()||!['tens','units'].includes(block)||guided&&block!==place)return;
       if(ETM_DISCOVERY.remove(state,block)){tell('');paintExchange()}
     }
     for(const block of ['tens','units']){
       const tray=node('div',undefined,visual,'discoveryTray');
       node('h3',block==='tens'?'Tens':'Units',tray);
       for(let i=0;i<state[block];i++){
         const canSplit=guided&&trade&&block==='tens';
         const tile=btn(block==='tens'?'10':'1',canSplit?split:()=>remove(block),tray,'discoveryBlock '+block);
         tile.setAttribute('aria-label',canSplit?'Split one ten into ten units':block==='tens'?'Take away one ten':'Take away one unit');
         tile.disabled=guided?!canSplit&&place!==block:!(block==='units'?units:tens);
         tile.draggable=!tile.disabled;
         tile.ondragstart=e=>e.dataTransfer.setData('text/plain',block);
       }
     }
     target.hidden=guided||place==='answer';
     if(guided&&typeof label!=='undefined'&&label){label.hidden=place!=='answer';if(check)check.hidden=label.hidden}
     target.ondragover=e=>e.preventDefault();
     target.ondrop=e=>{e.preventDefault();remove(e.dataTransfer.getData('text/plain'))};
     columns.replaceChildren();
     const written=node('table',undefined,columns,'exchangeSum');
     written.setAttribute('aria-label','Written subtraction');
     for(const [i,row] of [['','Tens','Units'],['',q.tens,q.units],['−',q.takeTens,q.takeUnits]].entries()){
       const tr=node('tr',undefined,written);
       for(const cell of row)node(i===0?'th':'td',String(cell),tr);
     }
   }
   paintExchange();
 }
 else if(!transfer&&q.kind==='count'){var boats=node('div',undefined,area,'discoveryObjects');for(var i=0;i<q.answer;i++)node('span','⛵',boats);node('p','Count each boat once.',area)}
 else if(!transfer&&['bonds','groups','balance'].includes(q.kind)){var target=q.kind==='groups'?q.groups:q.kind==='bonds'?2:2,rows=node('div',undefined,area,'discoveryObjects');if(q.kind==='groups'){for(var g=0;g<target;g++){var group=node('div',undefined,rows,'discoveryGroup');for(var i=0;i<q.size;i++)node('span','●',group)}}else{node('div',(q.kind==='bonds'?q.part:q.part)+' known counters',rows,'discoveryGroup');node('div',Array(state.built).fill('●').join(' ')||'Your missing group',rows,'discoveryGroup');btn('Add a counter',function(){if(guard()&&state.built<20){state.built++;rerender()}},area,'quietButton');btn('Remove a counter',function(){if(guard()){state.built=Math.max(0,state.built-1);rerender()}},area,'quietButton');node('p','Whole amount: '+q.whole+'. Build the missing group, then enter its size.',area)}}
 else if(!transfer&&q.kind==='fractions'){var strip=node('div',undefined,area,'discoveryFraction');strip.style.gridTemplateColumns='repeat('+q.parts+',1fr)';for(var i=0;i<q.parts;i++)(function(i){var b=btn(state.shaded.includes(i)?'✓':'',function(){if(!guard())return;state.shaded=state.shaded.includes(i)?[]:[i];rerender()},strip,'discoveryPart '+(state.shaded.includes(i)?'shaded':''));b.setAttribute('aria-label','Equal part '+(i+1));b.setAttribute('aria-pressed',state.shaded.includes(i))})(i);node('p','All pieces belong to the same whole. Shade one piece, then enter how many equal pieces make the whole.',area)}
 if(transfer)node('p','Use the idea without the objects. A new question checks what you can do independently.',area,'lIntro');
 var label=node('label','Your answer',card,'lField'),input=node('input',undefined,label);input.type='text';input.inputMode='numeric';input.autocomplete='off';input.maxLength=4;input.setAttribute('aria-label','Your numerical answer');
 function hint(){if(!guard())return;state.helped=true;state.step++;var hints={exchange:['Look at the units: can you take away '+q.takeUnits+' from '+q.units+'?','A ten has the same value as ten units. Exchange one, then try the units again.','For a separate example, 31 − 15: exchange to 2 tens and 11 units, then remove 1 ten and 5 units.'],count:['Touch each boat once as you count.','Try counting from the left to the right.'],bonds:['Start at the known part and count on to the whole.','For a separate example, 3 + ? = 5 needs two more.'],groups:['Count one group. Are all groups the same size?','Count the groups without counting any counter twice.'],fractions:['The bottom number tells how many equal parts make the whole.','Count all the equal pieces, not just the shaded piece.'],balance:['Both sides must have the same total.','Start with the whole and remove the known part.']};tell(hints[q.kind][Math.min(state.step-1,hints[q.kind].length-1)])}
 btn(s.mode==='challenge'?'Show me one step':'Help me think',hint,card,'quietButton');
 var check=btn('Check my thinking',function(){if(!guard())return;var raw=input.value.trim();if(!/^\d+$/.test(raw)){tell('Enter a whole number first.');return}var answer=+raw;if(answer!==q.answer){state.misses++;if(s.mode==='challenge')tell('Not quite. Check your working and try again.');else if(q.kind==='exchange')tell('Let’s check a step: have you removed the required units? Exchanging changes the grouping, not the total value.');else tell('Check the model and how the parts relate to the whole. You can ask for a hint.');return}
 if(s.mode!=='challenge'&&!transfer&&q.kind==='exchange'&&!ETM_DISCOVERY.done(state)){tell('Your total is right. Now show the exchange and taking away with the blocks.');return}if(!transfer&&q.kind==='fractions'&&state.shaded.length!==1){tell('Shade one equal part to show your fraction.');return}if(!transfer&&['bonds','balance'].includes(q.kind)&&state.built!==q.answer){tell('Build the missing group to show how it matches your answer.');return}
 state.done=true;check.disabled=true;check.hidden=true;input.disabled=true;var independent=!state.helped&&state.misses===0;if(independent)s.independent++;if(!(pl&&pl.guest)){ETM_CORE.record(learningProfile(),{eventId:s.id+':'+s.index,id:s.id+':'+s.index,unit:'discovery:'+q.kind,level:ETM_DISCOVERY.skills[q.kind].min,correct:state.misses===0,helped:state.helped,at:Date.now()});learningStore()}tell('Yes. '+(q.kind==='exchange'?(s.mode==='challenge'?'You found the difference.':'The written subtraction and the blocks describe the same change.'):'The parts match the whole.'));btn(s.index===2?'Finish':'Next discovery →',function(){if(s.actor!==accessSession)return;s.index++;discoveryQuestion()},card,'primaryButton')},card,'primaryButton');input.onkeydown=function(e){if(e.key==='Enter')check.click()};if(!transfer&&q.kind==='exchange'&&s.mode!=='challenge'){label.hidden=check.hidden=!ETM_DISCOVERY.done(state)}
 if(s.mode==='teach'&&!transfer&&q.kind!=='exchange')hint();
}
function discoveryFinish(a){var s=discoverySession,total=s.mode==='teach'?1:3,comparison=studyRecord(learningName(),{id:s.id,key:'discovery:'+s.kind+':'+s.mode,label:ETM_DISCOVERY.skills[s.kind].title,good:s.independent,total:total,detail:'Independent first attempts · '+s.mode});studyResult(a,'Independent first-try accuracy',s.independent,total,comparison,s.mode==='teach'?'Two guided questions; one independent check.':'Three opportunities for an independent first answer; hints and retries remain separate.');node('p','Three short discoveries are complete. You can stop here or choose another idea.',a,'lIntro');btn('Back home',home,a,'primaryButton');btn('Choose another discovery',discoverySetup,a,'quietButton');discoverySession=null}
var discoveryBaseSetup=learningPracticeSetup;learningPracticeSetup=function(){discoveryBaseSetup();var a=club.querySelector('.activityArea');if(a)btn('Build it · interactive discoveries',discoverySetup,a,'quietButton')};
var discoveryBaseAdventure=learningMathAdventure;learningMathAdventure=function(today){discoveryStart(ETM_DISCOVERY.choose(learningProfile(),learningName()),profileSettings(learningName()).mathSupport||'try')};
var discoveryBaseProgress=learningProgress;learningProgress=function(name){discoveryBaseProgress(name);var target=dadUnlocked()&&typeof name==='string'?name:learningName(),p=ETM_CORE.profile(learningState,target),a=club.querySelector('.activityArea');if(!a)return;var d=node('details',undefined,a,'lDisclosure');node('summary','What to practise next',d);Object.entries(ETM_DISCOVERY.skills).forEach(function(entry){var key=entry[0],skill=entry[1],stats=ETM_CORE.summary(p,'discovery:'+key,skill.min);if(stats.tries)node('p',skill.title+': '+stats.independent+' independent first attempts from '+stats.tries+' recent questions; '+stats.helped+' used guidance. '+(stats.secure?'Ready for a varied challenge.':'Keep practising with support available.'),d)});node('p','Suggested next: '+ETM_DISCOVERY.skills[ETM_DISCOVERY.choose(p,target)].title+'. These observations describe app practice, not a diagnosis or school grade.',d,'lSmall')};
