// Dad selects the activity. The invited child owns the answer fields.
window.ETMSheet=(()=>{
  const invitations=window.ETMGameInvites;
  let active=null;
  function validPage(p){
    if(!p||typeof p!=='object')return false;
    return p.kind==='table'?Number.isInteger(p.step)&&p.step>=1&&p.step<=12:
      p.kind==='question'&&typeof p.text==='string'&&p.text.trim().length>0&&p.text.length<=160;
  }
  function room(partner,teacher){
    const actor=accessSession,d=node('dialog',undefined,document.body,'sheetDialog');
    const title='Practice with '+(teacher?partner:'Dad');d.setAttribute('aria-label',title);
    const head=node('div',undefined,d,'sheetHead');node('h2',title,head);
    const close=btn('×',leave,head,'quietButton');close.setAttribute('aria-label','Leave practice');
    const status=node('p','',d);status.setAttribute('role','status');
    const body=node('div',undefined,d),footer=node('div',undefined,d,'sheetFooter');
    let wire,offer,inviteVersion=0,page,version=0,answers=[],fields=[],dirty=false,clock=0,closed=false;
    const live=()=>!closed&&actor===accessSession&&familyActor();
    function report(msg){if(live()&&status.textContent!==msg)status.textContent=msg}
    function dispose(){
      if(closed)return;closed=true;inviteVersion++;clearInterval(timer);
      if(offer)invitations.forget(offer);wire?.close();d.close();d.remove();if(active?.dialog===d)active=null;
    }
    function leave(){
      if(wire?.open&&page&&!confirm('Leave this practice sheet?'))return;
      dispose();
    }
    d.oncancel=e=>{e.preventDefault();leave()};d.showModal();
    function editor(){
      body.replaceChildren();footer.replaceChildren();body.className='sheetForm';
      const select=learningSelect(body,'What shall we practise?', [['table','Times table'],['question','My own question']],page?.kind||'table');
      const table=learningSelect(body,'Choose a table',Array.from({length:12},(_,i)=>[String(i+1),(i+1)+' times table']),String(page?.step||10));
      const label=node('label','Your question',body),input=node('input',undefined,label);input.maxLength=160;input.value=page?.text||'';input.placeholder='e.g. What is half of 68?';
      function toggle(){label.hidden=select.value!=='question';table.parentElement.hidden=select.value!=='table'}
      select.onchange=toggle;toggle();
      const submit=btn(wire?.open?'Send new sheet':'Invite '+partner,async()=>{
        const next=select.value==='table'?{kind:'table',step:Number(table.value)}:{kind:'question',text:input.value.trim()};
        if(!validPage(next)){input.focus();return}
        if(wire?.open){
          if(wire.pending>=40){report('Reconnecting. Try sending the new sheet again in a moment.');return}
          if(answers.some(Boolean)&&!confirm('Start a new sheet and clear the answers on this one?'))return;
          startPage(next);wire.send({t:'sheet',page,version});return;
        }
        const gen=++inviteVersion;
        if(offer)invitations.forget(offer);page=next;submit.disabled=select.disabled=table.disabled=input.disabled=true;
        const id=await invitations.invite(partner,'practice-sheet-v1',msg=>{
          if(!live()||wire||gen!==inviteVersion)return;report(msg);
          if(/No reply|Not now|Try again|come online|Invite again/i.test(msg))submit.disabled=select.disabled=table.disabled=input.disabled=false;
        },async(id,who)=>{
          if(!live()||gen!==inviteVersion)return;
          const w=await invitations.channel(id,who);
          if(!live()||gen!==inviteVersion){w.close();return}
          attach(w);startPage(next);w.send({t:'sheet',page,version});
        });
        if(!live()||gen!==inviteVersion){if(id)invitations.forget(id)}else {offer=id;if(!id)submit.disabled=select.disabled=table.disabled=input.disabled=false}
      },footer,'primaryButton');
      if(wire?.open)btn('Back to sheet',render,footer,'quietButton');
    }
    function startPage(next){
      page=next;version++;answers=Array(page.kind==='table'?12:1).fill('');dirty=false;render();
    }
    function render(){
      body.replaceChildren();footer.replaceChildren();fields=[];body.className='';
      const paper=node('section',undefined,body,'sheetPaper');
      node('h3',page.kind==='table'?page.step+' times table':page.text,paper);
      answers.forEach((answer,i)=>{
        const line=node('div',undefined,paper,'sheetLine'),text=page.kind==='table'?window.ETMTables.bookRow('times',page.step,i+1).label+' =':'Your answer';
        const label=node('label',text,line);
        if(teacher){const out=node('output',answer||'—',line);out.setAttribute('aria-label',text);fields.push(out);return}
        const input=node('input',undefined,line);input.id='etm-sheet-answer-'+i;label.htmlFor=input.id;
        input.inputMode=page.kind==='table'?'numeric':'text';input.autocomplete='off';input.maxLength=page.kind==='table'?5:100;input.value=answer;
        input.oninput=()=>{
          if(!live()||!wire?.open)return;
          if(page.kind==='table')input.value=input.value.replace(/[^0-9]/g,'');
          answers[i]=input.value;dirty=true;flush();
        };
        input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();fields[i+1]?.focus()}};fields.push(input);
      });
      if(teacher)btn('Choose next sheet',editor,footer,'quietButton');
      report(teacher?'Watch '+partner+' fill in the answers.':'Dad can see the answers as you type.');
    }
    function flush(){
      if(!live()||teacher||!dirty||!wire?.open||wire.pending>=4)return;
      wire.send({t:'answers',version,values:answers.slice()});dirty=false;
    }
    function disconnected(){
      if(!live())return;report('The other device left. This sheet has ended.');
      fields.forEach(el=>el.disabled=true);footer.replaceChildren();
    }
    function attach(w){
      wire=w;clock=Date.now();let lastPulse=0;
      w.on('data',msg=>{
        if(!live()||!msg)return;clock=Date.now();
        if(msg.t==='sheet'&&!teacher&&validPage(msg.page)&&Number.isSafeInteger(msg.version)&&msg.version>version){
          version=msg.version-1;startPage(msg.page);return;
        }
        if(msg.t==='answers'&&teacher&&msg.version===version&&Array.isArray(msg.values)&&msg.values.length===answers.length&&msg.values.every(v=>typeof v==='string'&&v.length<=100)){
          answers=msg.values.slice();fields.forEach((el,i)=>{el.textContent=answers[i]||'—'});return;
        }
      });w.on('close',disconnected);
      pulse=()=>{if(w.pending<2&&Date.now()-lastPulse>3500){lastPulse=Date.now();w.send({t:'pulse'})}};
    }
    let pulse=()=>{},wasDisconnected=false;
    const timer=setInterval(()=>{
      if(!live()){dispose();return}
      if(!wire?.open)return;
      flush();pulse();const lost=Date.now()-clock>12000;
      if(lost)report('Reconnecting to '+partner+'…');
      else if(wasDisconnected)report(teacher?'Connected · following '+partner+'’s answers.':'Connected · Dad can see your answers.');
      wasDisconnected=lost;
    },250);
    if(teacher)editor();else report('Opening Dad’s sheet…');
    return active={dialog:d,attach,dispose,live,report};
  }
  return {
    setup(name){if(active){active.dialog.focus();return}if(familyActor()&&dadUnlocked()&&FAMILY.includes(name))room(name,true)},
    describe(){return !active&&familyActor()&&accessSession.role==='child'?{title:'Practise with Dad',yes:'Join practice'}:null},
    async joinVisit(_,who,id){
      if(active||!familyActor()||accessSession.role!=='child'||who.name!=='Dad')return;
      const child=room('Dad',false);
      try{const wire=await invitations.channel(id,who);if(child.live())child.attach(wire);else wire.close()}catch{child.report('Could not open the sheet. Ask Dad to invite you again.')}
    }
  };
})();
