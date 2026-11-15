// A table is a fixed step. Subtraction reverses the matching addition fact.
window.ETMTables = (function () {
  const labels = {add:'Addition', sub:'Subtraction', times:'Multiplication'};
  const signs = {add:'+', sub:'−', times:'×'};
  function fact(op, step, n) {
    const start = op === 'sub' ? n + step : n;
    const answer = op === 'sub' ? n : op === 'add' ? n + step : n * step;
    return {op, step, start, answer, label:start+' '+signs[op]+' '+step};
  }
  function options(q) {
    const values = new Set([q.answer]);
    for (const n of [q.start, q.answer+1, q.answer-1, q.answer+2, q.answer+3])
      if (n >= 0 && values.size < 3) values.add(n);
    return ETM_CORE.shuffle([...values]);
  }
  function tabs(parent, selected) {
    const row=node('div',undefined,parent,'numberTabs');
    row.setAttribute('aria-label','Choose a number table');
    for (const [id,title] of Object.entries(labels)) {
      const b=btn(signs[id]+' '+title,()=>id==='times'?ttHome():homeTable(id),row,'lPill');
      b.setAttribute('aria-pressed',String(id===selected));
    }
  }
  function dots(q,parent){
    const strip=node('div',undefined,parent,'factCounters');
    strip.setAttribute('role','img');
    strip.setAttribute('aria-label',q.op==='sub'?q.start+' counters, '+q.step+' crossed out':q.start+' teal counters and '+q.step+' gold counters');
    const count=q.op==='sub'?q.start:q.answer;
    for(let i=0;i<count;i++)node('i','',strip,i>=(q.op==='sub'?q.answer:q.start)?(q.op==='sub'?'taken':'added'):'');
    if(!count)node('span','0 counters',strip);
  }
  function homeTable(op, chosen) {
    if (!ttActor()) return;
    const title=labels[op]+' tables',a=learningPage(title,'tables',learningMath);
    tabs(a,op);
    const settings=profileSettings(learningName());
    const saved=chosen ?? settings['step_'+op];
    const step=Number.isInteger(saved)&&saved>=0&&saved<=12?saved:(learningName()==='Matthew'?1:2);
    const selector=learningSelect(a,'My table',Array.from({length:13},(_,n)=>[n,signs[op]+' '+n]),step);
    selector.onchange=()=>{const n=Number(selector.value);if(!pl.guest)setProfileSettings(learningName(),{['step_'+op]:n});homeTable(op,n)};
    const card=node('section',undefined,a,'numberStudio'),top=node('div',undefined,card,'numberExample');
    let position=3;
    const show=()=>{
      top.replaceChildren();const q=fact(op,step,position);
      node('h2',q.label+' = '+q.answer,top);dots(q,top);
      node('p',op==='add'?'Start with '+q.start+'. Add '+step+'.':'Start with '+q.start+'. Take away '+step+'.',top);
    };
    top.setAttribute('aria-live','polite');show();
    const nav=node('div',undefined,card,'numberNav');
    const back=btn('← Previous fact',()=>change(-1),nav,'quietButton');
    const next=btn('Next fact →',()=>change(1),nav,'quietButton');
    function change(delta){position+=delta;show();back.disabled=position===0;next.disabled=position===12}
    const all=node('details',undefined,card,'lDisclosure');node('summary','See my whole table',all);
    const list=node('div',undefined,all,'factGrid');
    for(let i=0;i<=12;i++){const q=fact(op,step,i);btn(q.label+' = '+q.answer,()=>{position=i;change(0);all.open=false;top.scrollIntoView({block:'nearest'})},list,'lPill')}
    const history=tableHistory(op),tried=Array.from({length:13},(_,i)=>history.get(fact(op,step,i).label)).filter(Boolean);
    if(tried.length)node('p',tried.length+' of 13 facts explored in this table.',a,'lSmall');
    const actions=node('div',undefined,a,'numberNav');
    btn('Practise five facts',()=>practice(op,step),actions,'primaryButton');
    btn('Race on this screen',()=>localRace(op,step),actions,'quietButton');
    btn('Race a friend online',()=>window.ETMFriends.rally(op,step),actions,'quietButton');
  }
  function queue(op,step){
    return ETM_CORE.shuffle(Array.from({length:13},(_,n)=>fact(op,step,n))).slice(0,5);
  }
  function tableHistory(op){
    const history=new Map(),unit='tables-'+op;
    for(const e of learningProfile().events)if(e.unit===unit&&e.id.startsWith(unit+':'))history.set(e.id.slice(unit.length+1),e);
    return history;
  }
  function practice(op,step){
    const actor=accessSession,unit='tables-'+op,history=tableHistory(op);
    const pool=ETM_CORE.shuffle(Array.from({length:13},(_,i)=>fact(op,step,i)));
    const tricky=pool.filter(q=>{const e=history.get(q.label);return e&&(!e.correct||e.helped)});
    const unseen=pool.filter(q=>!history.has(q.label));
    const qs=[...new Set([...tricky.slice(0,2),...unseen,...pool])].slice(0,5);
    let index=0,good=0;
    function question(){
      if(actor!==accessSession)return;
      const a=learningPage(labels[op]+' practice','tables',()=>homeTable(op,step));
      if(index===qs.length){
        const comparison=studyRecord(learningName(),{key:unit+':'+step,label:labels[op]+' · '+signs[op]+step,good,total:qs.length,detail:'Independent first answers'});
        studyResult(a,'First-try accuracy',good,qs.length,comparison,'Five facts from your '+signs[op]+step+' table.');
        btn('Try five more',()=>practice(op,step),a,'primaryButton');btn('Choose a table',()=>homeTable(op,step),a,'quietButton');return;
      }
      const q=qs[index],card=node('section',undefined,a,'numberStudio');
      node('small','Fact '+(index+1)+' of '+qs.length,card);
      node('h2',q.label+' = ?',card,'lQuestionTitle');
      const hint=node('div',undefined,card);
      const row=node('div',undefined,card,'numberAnswers'),status=node('p','',card,'discoveryFeedback');
      status.setAttribute('role','status');let attempts=0,helped=false,finished=false;
      function picture(){helped=true;if(!hint.children.length)dots(q,hint)}
      const help=btn('Show counters',picture,card,'quietButton');
      options(q).forEach(n=>{
        const b=btn(String(n),()=>{
          if(finished||actor!==accessSession)return;
          const right=n===q.answer;
          if(!attempts){
            if(right&&!helped)good++;
            ETM_CORE.record(learningProfile(),{eventId:crypto.randomUUID(),id:unit+':'+q.label,unit,level:0,correct:right,helped,at:Date.now()});
            if(!pl.guest)learningStore();
          }
          attempts++;
          if(!right&&attempts===1){b.disabled=true;picture();status.textContent=op==='sub'?'Count the counters that are left. Try again.':'Count the two colours together. Try again.';return}
          finished=true;for(const child of row.children)child.disabled=true;
          help.hidden=true;status.textContent=(right?'You’ve got it! ':'Look at the counters. ')+q.label+' = '+q.answer+'.';
          if(!right)picture();
          let advanced=false;
          const advance=()=>{if(advanced||!a.isConnected||actor!==accessSession)return;advanced=true;index++;question()};
          btn(index===qs.length-1?'See my result':'Next fact →',advance,card,'primaryButton');
          if(right&&attempts===1&&index<qs.length-1)activityTimers.push(setTimeout(advance,1450));
        },row,'lPill');
      });
    }
    question();
  }
  function localRace(op,step){
    const actor=accessSession,a=learningPage('Number rally','tables',()=>homeTable(op,step));
    const players=['Player 1','Player 2'].map((name,i)=>({name,score:0,table:learningSelect(a,name+'’s table',Array.from({length:13},(_,n)=>[n,signs[op]+' '+n]),step)}));
    btn('Start rally',()=>{
      const rounds=players.map(p=>queue(op,+p.table.value));let turn=0;
      function pass(){
        if(actor!==accessSession)return;
        const card=learningPage('Number rally','tables',()=>homeTable(op,step));
        if(turn===10){
          const [p,q]=players;node('h2',p.score===q.score?'A draw!':(p.score>q.score?p.name:q.name)+' wins!',card);
          players.forEach(p=>node('p',p.name+' · '+p.score+' / 5',card));
          btn('Play again',()=>localRace(op,step),card,'primaryButton');return;
        }
        const who=turn%2,player=players[who],q=rounds[who][Math.floor(turn/2)];
        const panel=node('section',undefined,card,'numberStudio');node('h2','Pass to '+player.name,panel);
        btn('I’m ready',()=>{
          panel.replaceChildren();node('small',player.name+' · Round '+(1+Math.floor(turn/2))+' of 5',panel);node('h2',q.label+' = ?',panel);
          const row=node('div',undefined,panel,'numberAnswers');
          for(const n of options(q))btn(String(n),()=>{row.replaceChildren();if(n===q.answer)player.score++;
            node('p',(n===q.answer?'One point! ':'')+q.label+' = '+q.answer+'.',row);turn++;btn(turn===10?'See the result':'Pass the screen',pass,panel,'primaryButton');
          },row,'lPill');
        },panel,'primaryButton');
      }pass();
    },a,'primaryButton');
  }
  return {drawCounters:dots,tabs,fact,options,queue,home:homeTable,labels,signs};
})();
