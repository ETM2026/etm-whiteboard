// Shared arithmetic working. Each draft line belongs to the child.
window.ETMEquations = (() => {
  const alphabet = /^[0-9+×÷−= ]{0,48}$/;
  const sum = /^(\d+)\s*([+×÷−])\s*(\d+)(?:\s*=\s*(\d+))?$/;
  function calculate(match) {
    const a = Number(match[1]), b = Number(match[3]);
    return ({'+':a+b,'−':a-b,'×':a*b,'÷':a/b})[match[2]];
  }
  function valid(s) {
    return !!s && Array.isArray(s.lines) && s.lines.length>0 && s.lines.length<=20 &&
      s.lines.every(v=>typeof v==='string' && alphabet.test(v)) &&
      typeof s.columns==='boolean' && typeof s.done==='boolean';
  }
  function normal(text) {return text.replace(/-/g,'−').replace(/[xX*]/g,'×').replace(/\//g,'÷')}
  function keypad(parent,press) {
    const keys=node('div',undefined,parent,'eqKeys');
    for(const key of ['7','8','9','÷','4','5','6','×','1','2','3','−','0','=','⌫','+']){
      const b=btn(key,()=>press(key),keys,'lPill');
      if(key==='⌫')b.setAttribute('aria-label','Delete last symbol');
    }
  }
  function columns(line,parent){
    const match=line.match(/^(\d+)\s*([+×÷−])\s*(\d*)(?:\s*=\s*(\d*))?$/);
    if(!match)return;
    const box=node('div',undefined,parent,'eqColumns');
    node('div',match[1],box);node('div',match[2]+' '+(match[3]||'□'),box);
    node('strong',match[4]||'□',box);
  }
  function mount(parent,question,teacher,send,point){
    let state={lines:[''],columns:false,done:false},previous=[],editing=0;
    function remember(){previous.push(JSON.stringify(state));if(previous.length>100)previous.shift()}
    function update(){send(structuredClone(state));paint()}
    function edit(value){
      if(teacher||state.done||!alphabet.test(value)||value===state.lines[editing])return;
      remember();state.lines[editing]=value;update();
    }
    let marked=-1;
    function paint(){
      parent.replaceChildren();
      if(!teacher)btn(state.columns?'Use line view':'Use columns',()=>{state.columns=!state.columns;update()},parent,'quietButton');
      state.lines.forEach((line,i)=>{
        const row=node('div',undefined,parent,'eqStep');
        row.classList.toggle('eqPoint',marked===i);
        node('small','Step '+(i+1),row);
        const val=node('strong',line||'□',row);
        if(state.columns)columns(line,row);
        if(teacher)btn('Point here',()=>{marked=i;point(i);paint()},row,'quietButton');
        else if(!state.done&&i!==editing)btn('Edit',()=>{editing=i;paint()},row,'quietButton');
        else if(!teacher&&!state.done)val.setAttribute('aria-label','Current working line');
      });
      if(state.done){node('p','Final answer: '+state.lines.at(-1).split('=').at(-1).trim(),parent,'eqResult');}
      if(teacher)return;
      const msg=node('p','',parent);msg.setAttribute('role','status');
      if(!state.done){
        keypad(parent,k=>edit(k==='⌫'?state.lines[editing].slice(0,-1):state.lines[editing]+k));
        function advance(done){
          const line=state.lines[editing],m=line.match(sum);
          if(!m||m[4]===undefined){msg.textContent='Finish this line with = and your answer.';return}
          if(Number(m[4])!==calculate(m)){msg.textContent='Check this line once more.';return}
          if(done){
            if(state.lines.some(v=>{const t=v.match(sum);return !t||t[4]===undefined||Number(t[4])!==calculate(t)})){msg.textContent='Check each line before finishing.';return}
            const target=normal(question).replace(/[=?\s]+$/,'').trim().match(sum);
            if(target&&Number(state.lines.at(-1).split('=').at(-1))!==calculate(target)){msg.textContent='That step works. Look at the original question. Is there another step?';return}
          }
          if(!done&&editing===19){msg.textContent='You can use up to 20 lines.';return}
          remember();
          if(done)state.done=true;
          else if(editing===state.lines.length-1){state.lines.push(m[4]);editing++}
          else editing++;
          update();
        }
        btn('Next line',()=>advance(false),parent,'primaryButton');btn('Finish answer',()=>advance(true),parent,'quietButton');
      }
      const undo=btn('Undo',()=>{if(!previous.length)return;state=JSON.parse(previous.pop());editing=Math.min(editing,state.lines.length-1);update()},parent,'quietButton');undo.disabled=!previous.length;
    }
    paint();
    return {receive(s){if(teacher&&valid(s)){state=s;paint()}},highlight(i){if(Number.isInteger(i)&&i>=0&&i<state.lines.length){marked=i;paint();parent.querySelector('.eqPoint')?.scrollIntoView({block:'nearest'})}}};
  }
  return {mount,keypad,normal,valid};
})();
