// The host applies actions to the existing rules; each device receives its own view.
var FriendGames = (function(){
  const titles={checkers:'Checkers',uno:'UNO',pairs:'Matching pairs',quiz:'Family quiz',word:'Guess the word',voyage:'Treasure voyage',draw:'Draw & guess',sprint:'Maths Sprint',tables:'Times Tables Rally',notes:'Note Race',music:'Music Quiz Race'};
  const races=['sprint','tables','notes','music'];
  const topics=['geography','ireland','australia','science','oceans','numbers','space','animals','dinosaurs','piano','roblox','minecraft','art','building'];
  const words=['boat','cat','rocket','fish','house','tree','star','moon','duck','apple','kite','sun'];
  const clues={boat:'It floats.',cat:'A pet that purrs.',rocket:'It travels into space.',fish:'It has fins.',house:'People live here.',tree:'It has roots and branches.',star:'It shines in the night sky.',moon:'It orbits Earth.',duck:'A bird that quacks.',apple:'A fruit.',kite:'It flies on a string.',sun:'It gives Earth light.'};
  const missions=[['How many fish? 🐟 🐟 🐟',['2','3','4'],1],['Which word names this? ⛵',['boot','boat','bat'],1],['Four boxes with three fish each. How many fish?',['7','12','16'],1]];
  const sample=(a)=>a[Math.floor(Math.random()*a.length)];
  const isRace=id=>races.includes(id);
  function settings(raw={}){
    return {topic:topics.includes(raw?.topic)?raw.topic:'animals',level:[0,1,2].includes(raw?.level)?raw.level:0,table:Number.isInteger(raw?.table)&&raw.table>=1&&raw.table<=12?raw.table:2};
  }
  function create(id,names,round,prefs){
    const first=(round-1)%2,s={id,names,turn:first,scores:[0,0],done:false,message:'',seq:0,prefs:prefs.map(settings)};
    if(id==='checkers'){s.board=ETM_GAMES.checkers();s.board.turn=first?-1:1;s.board.positions={[s.board.board.join(',')+':'+s.board.turn]:1}}
    if(id==='uno'){s.cards=ETM_GAMES.cards(names,false,false);s.turn=s.cards.turn}
    if(id==='pairs'){s.faces=ETM_CORE.shuffle(['🐟','🐸','🦋','🐢','🐳','🦀'].flatMap(v=>[v,v]));s.open=[];s.matched=[]}
    if(id==='word'){s.word=sample(words);s.guesses=[]}
    if(id==='draw'){s.drawingRound=0;drawing(s)}
    if(id==='voyage')s.stage=0;
    if(id==='quiz'){
      s.index=0;s.questions=s.prefs.map(p=>ETM_CORE.quiz(p.topic,p.level,3));
    }
    if(isRace(id)){s.ready=[false,false];s.attempts=[0,0];s.questions=[null,null];s.until=0;s.running=false;s.feedback=['','']}
    return s;
  }
  function drawing(s){s.ink=[];s.choices=ETM_CORE.shuffle(words).slice(0,4);s.secret=sample(s.choices);s.guessed=[]}
  function raceFact(s,seat){
    const p=s.prefs[seat];
    if(s.id==='tables'){const q=window.ETMTables.fact('times',p.table,1+Math.floor(Math.random()*12));const options=window.ETMTables.options(q).map(String);return {label:q.label+' = ?',options,correct:options.indexOf(String(q.answer))}}
    if(s.id==='sprint')return ETM_CORE.math(p.level,sample(['add','sub']));
    const grade=['elementary','preliminary','grade1'][p.level];
    if(s.id==='notes'){
      const q=makeNoteQuestion(grade);
      return {label:'Which note is this?',pitch:q.pitch,clef:q.clef,options:q.options.map(n=>nm(n)),correct:q.options.indexOf(q.answer)};
    }
    const q=makeMusicQuiz(grade,'revision');
    return {label:q.label,symbol:q.symbol,bank:QUIZ_BANK.findIndex(v=>v.label===q.label&&v.answer===q.answer),options:q.options,correct:q.options.indexOf(q.answer)};
  }
  function validChoice(n,list){return Number.isInteger(n)&&n>=0&&n<list.length}
  function raceAct(s,seat,a,now){
    if(a.kind==='ready'&&!s.running&&!s.ready[seat]){
      s.ready[seat]=true;
      if(s.ready.every(Boolean)){s.running=true;s.until=['tables','sprint'].includes(s.id)?now+60000:0;s.questions=[raceFact(s,0),raceFact(s,1)]}
      return true;
    }
    const q=s.questions[seat];
    if(a.kind!=='answer'||!s.running||!q||a.attempt!==s.attempts[seat]||!validChoice(a.value,q.options)||(s.until&&now>=s.until))return false;
    const right=q.correct===a.value;s.attempts[seat]++;if(right)s.scores[seat]++;
    s.feedback[seat]=right?'✓ One point!':'That one was '+q.options[q.correct]+'.';
    if(!s.until&&s.scores[seat]>=10)s.done=true;else s.questions[seat]=raceFact(s,seat);
    return true;
  }
  function play(s,seat,a,now=Date.now()){
    if(!a||s.done||![0,1].includes(seat))return false;
    if(isRace(s.id))return raceAct(s,seat,a,now);
    if(s.id==='uno'&&a.kind==='catch')return ETM_GAMES.catchOne(s.cards,seat);
    if(s.id==='draw'&&a.kind==='guess'){
      if(seat===s.turn||!s.ink.length||!validChoice(a.value,s.choices)||s.guessed.includes(a.value))return false;
      s.guessed.push(a.value);if(s.choices[a.value]===s.secret){s.scores[seat]++;s.message='You found the '+s.secret+'!';s.drawingRound++;if(s.drawingRound===2)s.done=true;else{s.turn=seat;drawing(s)}}else s.message='Try a different picture.';return true;
    }
    if(seat!==s.turn)return false;
    if(s.id==='checkers'){
      const b=s.board,ok=a.kind==='move'?ETM_GAMES.move(b,a.from,a.to):a.kind==='claim'&&ETM_GAMES.claimDraw(b);
      if(!ok)return false;s.turn=b.turn===1?0:1;s.done=b.winner!==null;if(s.done&&b.winner)s.scores[b.winner===1?0:1]=1;return true;
    }
    if(s.id==='uno'){
      const c=s.cards;let ok=false;
      switch(a.kind){
        case 'open':ok=ETM_GAMES.opening(c,a.color);break;
        case 'card':ok=ETM_GAMES.play(c,a.value,a.color,a.called===true);break;
        case 'take':ok=ETM_GAMES.draw(c);break;
        case 'pass':ok=ETM_GAMES.pass(c);break;
        case 'accept':case 'challenge':ok=!!ETM_GAMES.resolve(c,a.kind==='challenge');break;
      }
      if(!ok)return false;s.turn=c.turn;s.done=c.winner!==null;s.scores=c.players.map(p=>p.score);return true;
    }
    if(s.id==='pairs'){
      if(a.kind==='cover'&&s.open.length===2){s.open=[];return true}
      if(a.kind!=='flip'||s.open.length>=2||!validChoice(a.value,s.faces)||s.open.includes(a.value)||s.matched.includes(a.value))return false;
      s.open.push(a.value);if(s.open.length===2){
        if(s.faces[s.open[0]]===s.faces[s.open[1]]){s.matched.push(...s.open);s.open=[];s.scores[seat]++;s.done=s.matched.length===s.faces.length;s.message='A pair! Have another go.'}
        else{s.turn=1-seat;s.message='Two different pictures. Remember where they are.'}
      }return true;
    }
    if(s.id==='word'){
      if(a.kind!=='letter'||typeof a.value!=='string'||!/^[a-z]$/.test(a.value)||s.guesses.includes(a.value))return false;
      s.guesses.push(a.value);s.done=[...s.word].every(l=>s.guesses.includes(l));s.turn=1-seat;return true;
    }
    if(s.id==='draw'){
      if(a.kind==='erase'&&s.ink.length){s.ink.pop();return true}
      if(a.kind!=='stroke'||s.ink.length>=96||!Array.isArray(a.points)||!a.points.length||a.points.length>64||!a.points.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isInteger(n)&&n>=0&&n<=255)))return false;
      s.ink.push(a.points);return true;
    }
    if(s.id==='voyage'||s.id==='quiz'){
      const quiz=s.id==='quiz',q=quiz?s.questions[seat][Math.floor(s.index/2)]:null;
      const options=quiz?q.options:missions[s.stage][1],answer=quiz?q.correct:missions[s.stage][2];
      if(a.kind!=='answer'||!validChoice(a.value,options))return false;
      const right=a.value===answer;
      s.message=right?'✓ '+options[answer]+'!':quiz?'The answer was '+options[answer]+'.':'Have another look and try again.';
      if(right)s.scores[seat]++;if(quiz||right){s.turn=1-seat;s.done=quiz?++s.index===6:++s.stage===missions.length}return true;
    }
    return false;
  }
  function question(q){return {label:q.label,options:q.options,symbol:q.symbol,bank:q.bank,pitch:q.pitch,clef:q.clef}}
  function view(s,seat){
    const v={turn:s.turn,done:s.done,scores:s.scores.slice(),message:s.message,seq:s.seq};
    if(s.id==='checkers')Object.assign(v,{board:s.board.board.slice(),chain:s.board.chain,claim:s.board.canDraw});
    if(s.id==='uno'){
      const c=s.cards;Object.assign(v,{hand:c.players[seat].hand.slice(),counts:c.players.map(p=>p.hand.length),top:c.discard.at(-1),color:c.color,opening:c.chooseOpeningColor,pending:!!c.pending,drawn:c.turn===seat?c.drawn:null,catchable:c.oneWindow===1-seat,oneCalled:c.oneCalled.slice(),message:c.message,winner:c.winner});
    }
    if(s.id==='pairs'){v.faces=s.faces.map((f,i)=>s.open.includes(i)||s.matched.includes(i)?f:'');v.cover=s.open.length===2}
    if(s.id==='word'){v.mask=[...s.word].map(l=>s.guesses.includes(l)?l:'_').join(' ');v.clue=clues[s.word];v.guesses=s.guesses.join('')}
    if(s.id==='draw'){v.ink=s.ink;v.choices=s.choices;v.guessed=s.guessed;if(seat===s.turn)v.secret=s.secret}
    if(s.id==='voyage'&&!s.done){const [label,options]=missions[s.stage];v.q={label,options}}
    if(s.id==='quiz'&&!s.done){v.q=question(s.questions[s.turn][Math.floor(s.index/2)]);v.message=s.message}
    if(isRace(s.id)){Object.assign(v,{ready:s.ready.slice(),running:s.running,remaining:s.until?Math.max(0,s.until-Date.now()):null,attempt:s.attempts[seat],message:s.feedback[seat]});if(s.running&&!s.done)v.q=question(s.questions[seat])}
    return v;
  }
  function validView(id,v){
    const small=(x,max)=>typeof x==='string'&&x.length<=max;
    const num=(x,max)=>Number.isInteger(x)&&x>=0&&x<=max;
    const arr=(x,max,ok)=>Array.isArray(x)&&x.length<=max&&x.every(ok);
    if(!v||!num(v.seq,1e7)||!num(v.turn,1)||typeof v.done!=='boolean'||!arr(v.scores,2,x=>num(x,100000))||v.scores.length!==2||!small(v.message,600))return false;
    if(id==='checkers')return arr(v.board,64,x=>[-2,-1,0,1,2].includes(x))&&v.board.length===64&&(v.chain===null||num(v.chain,63));
    if(id==='uno'){
      const card=c=>c&&num(c.id,107)&&['red','yellow','green','blue','wild'].includes(c.c)&&typeof c.v==='string'&&/^(?:[0-9]|skip|reverse|draw2|draw4|wild)$/.test(c.v);
      return card(v.top)&&arr(v.hand,108,card)&&arr(v.counts,2,x=>num(x,108))&&v.counts.length===2&&arr(v.oneCalled,2,x=>typeof x==='boolean')&&['red','yellow','green','blue'].includes(v.color);
    }
    if(id==='pairs')return arr(v.faces,12,x=>small(x,8))&&v.faces.length===12;
    if(id==='word')return small(v.clue,160)&&small(v.mask,32)&&small(v.guesses,26);
    if(id==='draw')return arr(v.ink,96,stroke=>arr(stroke,64,p=>Array.isArray(p)&&p.length===2&&p.every(n=>num(n,255))))&&arr(v.choices,4,x=>words.includes(x))&&arr(v.guessed,4,x=>num(x,3))&&(v.secret===undefined||words.includes(v.secret));
    if(isRace(id)&&(!arr(v.ready,2,x=>typeof x==='boolean')||v.ready.length!==2||typeof v.running!=='boolean'||!num(v.attempt,1e7)||(v.remaining!==null&&!num(v.remaining,60000))))return false;
    return v.done||isRace(id)&&!v.running||!!(v.q&&small(v.q.label,500)&&arr(v.q.options,8,x=>small(x,250))&&v.q.options.length>=2&&(!v.q.symbol||small(v.q.symbol,128)));
  }
  return {titles,settings,topics,isRace,create,play,view,validView};
})();

function scoreText(r,v){
  const names=r.host?[r.name,r.partner]:[r.partner,r.name];
  return names.map((name,i)=>name+' · '+v.scores[i]).join('    |    ');
}
function friendGameBoard(r,card,act,redraw){
  const v=r.gameView,seat=r.host?0:1;
  if(!v){node('p','Getting the game ready…',card);return}
  const names=r.host?[r.name,r.partner]:[r.partner,r.name],mine=v.turn===seat,racing=FriendGames.isRace(r.game);
  node('h3',FriendGames.titles[r.game],card);
  if(v.done){
    const cooperative=['word','draw','voyage'].includes(r.game);
    const win=r.game==='uno'?v.winner:v.scores[0]===v.scores[1]?null:v.scores[0]>v.scores[1]?0:1;
    node('p',cooperative?'You did it together!':win===null?'A draw!':win===seat?'You won!':names[win]+' won!',card,'friendTurn').setAttribute('role','status');
  }else if(!racing)node('p',r.game==='draw'?(mine?'Your turn to draw':names[v.turn]+' is drawing'):mine?'Your turn':names[v.turn]+'’s turn',card,'friendTurn').setAttribute('role','status');
  if(['pairs','quiz','sprint','tables','music','notes'].includes(r.game)||r.game==='uno'&&v.done)
    r.scoreLabel=node('p',scoreText(r,v),card,'fgPlayers');
  if(v.message)node('p',v.message,card,'fgMessage').setAttribute('role','status');
  if(v.done){if(v.mask)node('h3',v.mask,card);if(r.game==='draw')friendDrawing(v,false,card,act,true);return}
  if(racing&&!v.running){node('p',r.game==='tables'||r.game==='sprint'?'Both tap Ready. Score as many as you can in one minute.':'Both tap Ready. First to ten correct wins.',card);
    if(v.ready[seat])node('p','Waiting for '+r.partner+' to be ready.',card);
    else btn('Ready to race',()=>act({kind:'ready'}),card,'primaryButton');
    return;
  }
  if(r.game==='checkers'||r.game==='uno'){
    const hints=pl?.guest?familyGuestHints:profileSettings(learningName()).gameHints!==false;
    const help=btn(hints?'✓ Show hints':'Show hints',()=>{if(pl?.guest)familyGuestHints=!hints;else setProfileSettings(learningName(),{gameHints:!hints});redraw()},card,'quietButton');help.setAttribute('aria-pressed',String(hints));
    if(r.game==='checkers'){
      const rules={board:v.board,turn:v.turn?-1:1,chain:v.chain,winner:null},moves=ETM_GAMES.moves(rules),selected=v.chain??r.selected;
      const board=node('div',undefined,card,'fgBoard');board.setAttribute('aria-label','Checkers board');board.setAttribute('role','group');
      v.board.forEach((piece,i)=>{
        const col=i%8,row=Math.floor(i/8),dark=(col+row)%2,legal=moves.some(m=>m.from===selected&&m.to===i);
        const b=btn('',()=>{
          if(legal){act({kind:'move',from:selected,to:i});return}
          if(moves.some(m=>m.from===i)){r.selected=i;redraw()}else notice(v.chain!==null?'Finish jumping with the same piece.':'Choose a movable piece, then its destination.');
        },board,'fgSquare '+(dark?'dark':'light')+(i===selected&&mine?' selected':'')+(hints&&mine&&legal?' legal':''));
        b.disabled=!mine||!dark;b.setAttribute('aria-label',String.fromCharCode(65+col)+(8-row)+' · '+(piece?names[piece>0?0:1]+(Math.abs(piece)===2?' king':' piece'):'empty'));
        if(piece)node('span',Math.abs(piece)===2?'♔':'',b,'fgPiece '+(piece>0?'coral':'ivory'));else if(hints&&mine&&legal)node('span','',b,'fgMoveDot');
      });
      if(v.claim&&mine)btn('Claim a draw',()=>act({kind:'claim'}),card,'quietButton');
    }else{
      node('p',r.partner+' has '+v.counts[1-seat]+' cards'+(v.oneCalled[1-seat]?' · UNO!':''),card);
      const pile=node('div',undefined,card,'fgCardTable');familyCard(v.top,pile);node('strong','Active colour · '+v.color,pile,'fgActiveColor '+v.color);
      const hand=node('div',undefined,card,'fgHand');
      const can=c=>mine&&!v.opening&&!v.pending&&(v.drawn===null||v.drawn===c.id)&&(c.c==='wild'||c.c===v.color||c.v===v.top.v);
      for(const c of v.hand)familyCard(c,hand,()=>{if(!can(c)){notice('Match the active colour or the top card.');return}
        if(c.c==='wild'){r.wild=c.id;redraw()}else act({kind:'card',value:c.id,called:!!r.called})},!mine||v.opening||v.pending||hints&&!can(c));
      if(mine&&(v.opening||r.wild!=null)){node('strong','Choose a colour',card);familyColorPicker(card,color=>act(v.opening?{kind:'open',color}:{kind:'card',value:r.wild,color,called:!!r.called}));
        if(!v.opening)btn('Cancel colour choice',()=>{r.wild=null;redraw()},card,'quietButton')}
      else if(mine&&v.pending){btn('Accept +4',()=>act({kind:'accept'}),card,'primaryButton');btn('Challenge +4',()=>act({kind:'challenge'}),card,'quietButton')}
      else if(mine){btn(v.drawn===null?'Draw one card':'Pass',()=>act({kind:v.drawn===null?'take':'pass'}),card,'primaryButton');
        if(!hints||v.hand.length===2)btn(r.called?'✓ UNO call ready':'Call UNO with my next card',()=>{r.called=!r.called;redraw()},card,'quietButton')}
      if(v.catchable||!hints)btn('Catch a missed UNO call',()=>act({kind:'catch'}),card,'quietButton');
    }
    return;
  }
  if(r.game==='pairs'){
    const grid=node('div',undefined,card,'memoryGrid');v.faces.forEach((face,i)=>{const b=btn(face||'★',()=>act({kind:'flip',value:i}),grid,'memoryCard');b.disabled=!mine||!!face||v.cover;b.setAttribute('aria-label','Card '+(i+1)+' · '+(face||'hidden'))});
    if(mine&&v.cover)btn('Turn them over',()=>act({kind:'cover'}),card,'primaryButton');return;
  }
  if(r.game==='word'){node('p',v.clue,card);node('h2',v.mask,card,'friendWord');const keys=node('div',undefined,card,'letterBank');
    for(const c of 'abcdefghijklmnopqrstuvwxyz'){const b=btn(c.toUpperCase(),()=>act({kind:'letter',value:c}),keys,'letterTile');b.disabled=!mine||v.guesses.includes(c)}return;
  }
  if(r.game==='draw'){friendDrawing(v,mine,card,act);return}
  const q=v.q;if(!q)return;
  if(racing&&v.remaining!==null){
    const clock=node('span',undefined,card,'lMode');r.raceClockLabel=clock;
    clock.textContent=Math.ceil(Math.max(0,r.viewUntil-Date.now())/1000)+' seconds';
  }
  node('h2',q.label,card,'quizQuestion');
  if(r.game==='notes'&&Number.isInteger(q.pitch)&&q.pitch>=21&&q.pitch<=108)node('div',undefined,card,'noteStaff').innerHTML=staffSVG(q.pitch,q.clef==='bass'?'bass':'treble');
  if(r.game==='music'){
    const entry=Number.isInteger(q.bank)?QUIZ_BANK[q.bank]:null;
    if(entry?.svg)node('div',undefined,card,'quizSymbol').innerHTML=entry.svg;else if(q.symbol)node('div',q.symbol,card,'quizSymbol');
  }
  const options=node('div',undefined,card,'atlasTabs');
  q.options.forEach((o,i)=>{const b=btn(String(o),()=>act({kind:'answer',value:i,attempt:v.attempt}),options,'lPill');b.disabled=!racing&&!mine});
}
function friendDrawing(v,mine,parent,act,finished=false){
  if(!finished)node('p',mine?'Draw a '+v.secret+' for your friend.':'Watch the sketch. What could it be?',parent);
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 255 255');svg.setAttribute('class','friendSketch');svg.setAttribute('aria-label',mine?'Drawing pad':'Friend’s drawing');parent.appendChild(svg);
  function line(points){const el=document.createElementNS(ns,'polyline');el.setAttribute('points',points.map(p=>p.join(',')).join(' '));svg.appendChild(el);return el}
  v.ink.forEach(line);
  if(mine&&!finished){
    let points,preview,pen;
    function point(e){const r=svg.getBoundingClientRect();return [[e.clientX-r.left,r.width],[e.clientY-r.top,r.height]].map(([v,d])=>Math.max(0,Math.min(255,Math.round(v*255/d))))}
    svg.onpointerdown=e=>{if(points||v.ink.length>=96)return;pen=e.pointerId;svg.setPointerCapture(pen);points=[point(e)];preview=line(points)};
    svg.onpointermove=e=>{if(points&&e.pointerId===pen){points.push(point(e));if(points.length>64)points=points.filter((_,i)=>i%2===0);preview.setAttribute('points',points.map(p=>p.join(',')).join(' '))}};
    svg.onpointercancel=()=>{points=null;preview?.remove()};
    svg.onpointerup=e=>{if(!points||e.pointerId!==pen)return;const stroke=points;points=null;if(stroke.length===1)stroke.push(stroke[0]);act({kind:'stroke',points:stroke})};
    if(v.ink.length)btn('Undo last line',()=>act({kind:'erase'}),parent,'quietButton');
  }else if(!finished){const row=node('div',undefined,parent,'atlasTabs');v.choices.forEach((word,i)=>{const b=btn(word,()=>act({kind:'guess',value:i}),row,'lPill');b.disabled=!v.ink.length||v.guessed.includes(i)})}
  if(v.ink.length)btn('Share drawing',()=>{
    const canvas=document.createElement('canvas');canvas.width=canvas.height=768;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,768,768);
    ctx.scale(768/255,768/255);ctx.strokeStyle='#213d51';ctx.lineWidth=3;ctx.lineCap=ctx.lineJoin='round';
    for(const points of v.ink){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke()}
    window.ETMShareDrawing(canvas);
  },parent,'quietButton');
}
