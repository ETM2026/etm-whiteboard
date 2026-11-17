// A private two-seat data channel. Family signalling, contacts and media are separate.
(function(){
  let room=null, panel=null, header=null, form=null, thread=null, messageBox=null, pendingInvite='', invitationShown=false, chosenGame='three';
  const titles={three:'Three in a row',four:'Connect four',rally:'Number rally',...FriendGames.titles};
  let operation='add',myStep=2,inviteGame='',choice=FriendGames.settings();
  const extended=id=>Object.hasOwn(FriendGames.titles,id);
  function chatAllowed(){return typeof accessManifest==='undefined'||!accessManifest ? actor()?.role==='guest' : accessManifest.root?.friendChat===true}
  function canChat(r){return r.chat===true&&chatAllowed()}
  const validStep=n=>Number.isInteger(n)&&n>=0&&n<=12;
  const validOp=op=>['add','sub','times'].includes(op);
  const tokenKey='ETM.friendVisit';
  function actor(){return pl && accessSession && accessSession.name===pl.n && sessionValid(accessSession) && accessSession.role!=='entry' ? accessSession : null}
  function active(r){return room===r && r.actor===actor()}
  function clean(text,limit){return typeof text==='string'?text.normalize('NFKC').replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,' ').trim().slice(0,limit):''}
  function display(){return clean(pl.n.replace(/^Guest · /,''),24)||'Player'}
  function hex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
  async function stamp(token,label){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('ETM-friends/v1/'+label+'/'+token))))}
  function link(r){return new URL(location.pathname,location.origin).href+'#play='+r.token+'.'+r.game+(r.game==='rally'?'.'+r.op:'')}
  function leave(){
    const r=room;room=null;if(r){window.ETMGameInvites?.forget(r.directId);window.ETMGameInvites?.close('welcome:'+r.token)}
    if(r){clearTimeout(r.rejoinTimer);clearTimeout(r.timeout);clearInterval(r.clock);clearInterval(r.gameClock);clearInterval(r.paperTimer);clearInterval(r.contactTimer);try{r.conn?.close()}catch{}try{r.peer?.destroy()}catch{}}
    header?.remove();header=null;panel=null;thread=null;messageBox=null;form=null;
  }
  function end(r,why){
    if(!active(r))return;
    const visible=panel?.isConnected;
    leave();if(visible&&r.duo&&r.partner){
      panel=learningPage('Maths together','friends',home);
      node('h2','Session ended',panel);node('p',why,panel);
      if(!r.saveWarned)node('p','Your working is in the child’s learning profile. Reopen Maths together to continue.',panel);
      btn('Invite '+r.partner+' again',()=>window.ETMFriends.together(r.partner),panel,'primaryButton');
      btn('Home',home,panel,'quietButton');
    }else if(visible)lobby(why);else notice(why);
  }
  function send(r,data){
    if(!active(r)||!r.conn?.open)return false;
    try{r.conn.send(data);return true}catch{if(r.conn?.family&&r.partner){r.waiting=true;refresh(r);return false}end(r,'The connection closed. Start a new invitation to play again.');return false}
  }
  function lobby(info){
    if(!actor())return;
    if(room&&active(room)){draw(room);return}
    panel=learningPage('Play with a friend','friends',learningPlayTogether);
    const card=node('div',undefined,panel,'friendCard');
    node('h2',pendingInvite?'You’re invited to '+(titles[inviteGame]||'a game')+(inviteGame==='rally'?' · '+window.ETMTables.labels[operation]:''):'Who would you like to play with?',card);
    node('p',info||(pendingInvite?'Choose Join. Your friend will see your name and can welcome you.':'Choose a game and invite one friend.'),card);
    if(pendingInvite){
      if(inviteGame==='rally')tablePicker(card,false);gameOptions(inviteGame,card);
      btn('Join my friend',()=>{const token=pendingInvite;pendingInvite='';start(token,false)},card,'primaryButton');
      btn('Dismiss invitation',()=>{pendingInvite='';home()},card,'quietButton');
    }else{
      const picker=learningSelect(card,'Choose a game',Object.entries(titles),chosenGame);
      picker.onchange=()=>{chosenGame=picker.value;lobby()};
      gameOptions(chosenGame,card);
      if(chosenGame==='rally')tablePicker(card,true);
      btn('Invite a friend',()=>start(hex(crypto.getRandomValues(new Uint8Array(24))),true),card,'primaryButton');
    }
  }
  function gameOptions(id,parent){
    if(id==='quiz'){const topic=learningSelect(parent,'My quiz topic',FriendGames.topics.map(t=>[t,t[0].toUpperCase()+t.slice(1)]),choice.topic);topic.onchange=()=>{choice.topic=topic.value}}
    if(['quiz','sprint','notes','music'].includes(id)){
      const level=learningSelect(parent,'My level',[[0,'Starting out'],[1,'Growing'],[2,'Challenge']],choice.level);
      level.onchange=()=>{choice.level=Number(level.value)};
    }
    if(id==='tables'){const table=learningSelect(parent,'My times table',Array.from({length:12},(_,i)=>[i+1,String(i+1)]),choice.table);table.onchange=()=>{choice.table=Number(table.value)}}
  }
  function acceptView(r,v){
    const previous=r.gameView;
    r.gameView=v;r.viewUntil=v.remaining==null?0:Date.now()+v.remaining;
    if(previous?.running&&v.running&&!v.done&&previous.attempt===v.attempt&&r.scoreLabel?.isConnected){
      r.scoreLabel.textContent=scoreText(r,v);
      return;
    }
    r.selected=null;r.called=false;r.wild=null;refresh(r);
  }
  function publishGame(r){
    const opponent=FriendGames.view(r.match,1);
    if(send(r,{type:'game-view',round:r.round,view:opponent}))acceptView(r,FriendGames.view(r.match,0));
  }
  function startGame(r){
    r.gameView=null;
    if(r.host){
      r.match=FriendGames.create(r.game,[r.name,r.partner],r.round,r.prefs);
      publishGame(r);
    }
    clearInterval(r.gameClock);clearInterval(r.paperTimer);
    if(FriendGames.isRace(r.game))r.gameClock=setInterval(()=>{
      if(!active(r))return;
      const now=Date.now();
      if(r.host&&r.match?.until&&!r.match.done&&(r.waiting||now-r.last>22000)){r.match.until+=Math.max(0,now-(r.raceTick||now));r.resumeRace=true}
      r.raceTick=now;
      if(r.waiting||now-r.last>22000)return;
      if(r.resumeRace){r.resumeRace=false;publishGame(r)}
      if(r.host&&r.match?.until&&!r.match.done&&Date.now()>=r.match.until){
        r.match.done=true;r.match.seq++;publishGame(r);
      }
      if(r.raceClockLabel?.isConnected&&r.viewUntil)r.raceClockLabel.textContent=Math.ceil(Math.max(0,r.viewUntil-Date.now())/1000)+' seconds';
    },250);
  }
  function action(r,a,seat,seq){
    if(!active(r)||!r.partner||r.waiting||!extended(r.game)||!r.gameView)return;
    if(!r.host){send(r,{type:'game-action',round:r.round,seq,action:a});return}
    const s=r.match;
    if((seq===s.seq||FriendGames.isRace(r.game))&&FriendGames.play(s,seat,a)){
      s.seq++;publishGame(r);
    }else if(seat===1){send(r,{type:'game-view',round:r.round,view:FriendGames.view(s,1)})}
    else notice('Try a legal move on your turn.');
  }
  function tablePicker(card,host){
    if(host){
      const op=learningSelect(card,'Race with',Object.entries(window.ETMTables.labels),operation);
      op.onchange=()=>{operation=op.value};
    }
    const step=learningSelect(card,'My table number',Array.from({length:13},(_,i)=>[i,String(i)]),myStep);
    step.onchange=()=>{myStep=Number(step.value)};
    node('p','Five turns each. Each first-try answer earns one point. You can each pick your own table.',card);
  }
  function retry(r,message){
    if(!active(r))return;
    if(!r.host){pendingInvite=r.token;inviteGame=r.game}
    end(r,message);
  }
  function deadline(r,message,ms){clearTimeout(r.timeout);r.timeout=setTimeout(()=>retry(r,message),ms)}
  function finished(r){if(extended(r.game))return !!r.gameView?.done;return r.game==='rally'?r.answers.length===10:!!result(r.board)}
  function nextRound(r){r.round++;r.board.fill('');r.answers=[];r.offer='';if(extended(r.game))startGame(r);refresh(r)}
  function requestAgain(r){
    if(r.offer==='in'){
      if(send(r,{type:'accept-rematch',round:r.round}))nextRound(r);
    }else if(!r.offer&&send(r,{type:'rematch',round:r.round})){r.offer='out';refresh(r)}
  }
  function rallyFact(r,index){
    // Both seats calculate the same unique facts and independently score each move.
    const seat=(index+r.round-1)%2;
    const seed=parseInt(r.token.slice(0,6),16)+r.round*7;
    const n=(seed+Math.floor(index/2)*5+seat*3)%13;
    return window.ETMTables.fact(r.op,r.steps[seat],n);
  }
  function rallyAnswer(r,n,local){
    const i=r.answers.length,seat=(i+r.round-1)%2;
    if(i>=10||!Number.isInteger(n)||n<0||n>150||((seat===0)===r.host)!==local)return;
    const q=rallyFact(r,i);
    if(local&&!send(r,{type:'answer',round:r.round,step:i,value:n}))return;
    r.answers.push({seat,correct:n===q.answer,label:q.label+' = '+q.answer});refresh(r);
  }
  function drawRally(r,card){
    const scores=[0,0],seat=r.host?0:1;
    for(const a of r.answers)if(a.correct)scores[a.seat]++;
    const done=finished(r),i=r.answers.length,myTurn=((i+r.round-1)%2)===seat;
    const title=done?scores[0]===scores[1]?'A draw!':scores[seat]>scores[1-seat]?'You won!':r.partner+' won!':myTurn?'Your turn':r.partner+'’s turn';
    node('p','Number rally · '+title,card,'friendTurn').setAttribute('role','status');
    const tracks=node('div',undefined,card,'rallyTracks');
    for(const who of [seat,1-seat]){
      const line=node('div',undefined,tracks);node('strong',(who===seat?'You':r.partner)+' · '+scores[who]+' / 5',line);
      const track=node('progress',undefined,line);track.max=5;track.value=scores[who];track.setAttribute('aria-label',who===seat?'Your points':'Friend’s points');
    }
    const last=r.answers[i-1];if(last)node('p',(last.correct?'✓ ':'Last fact · ')+last.label,card);
    if(done){
      const missed=r.answers.flatMap((a,j)=>a.seat===seat&&!a.correct?[j]:[]);
      if(missed.length){
        const retry=node('div',undefined,card);
        btn('Practise my missed sums',()=>{
          let index=0;
          function show(){
            retry.replaceChildren();
            if(index===missed.length){node('strong','You solved each of those sums.',retry);return}
            const fact=rallyFact(r,missed[index]);
            node('h3',fact.label+' = ?',retry);const note=node('p','',retry);
            for(const n of window.ETMTables.options(fact))btn(String(n),()=>{
              if(n!==fact.answer){note.textContent='Take your time. Try again.';return}index++;show();
            },retry,'lPill');
          }show();
        },retry,'lPill');
      }
    }
    if(!done){
      node('small','Round '+(Math.floor(i/2)+1)+' of 5',card);
      if(myTurn){const q=rallyFact(r,i);node('h2',q.label+' = ?',card);
        const row=node('div',undefined,card,'numberAnswers');
        for(const n of window.ETMTables.options(q))btn(String(n),()=>rallyAnswer(r,n,true),row,'lPill');
      }else node('p','Your next question opens when '+r.partner+' answers.',card);
    }
  }
  function refresh(r){if(active(r)&&panel?.isConnected)draw(r)}
  function updateHeader(r){
    if(!active(r))return;
    if(!header)header=btn('',()=>draw(r),appHeader,'quietButton friendBadge');
    header.textContent=r.waiting?'Rejoining '+r.partner+'…':r.partner&&!r.duo?'Back to game':r.duo&&r.partner?'Back to '+r.partner:r.candidate?'🏁 Join request':r.unread?'Friend • '+r.unread:'Friend room';
    header.setAttribute('aria-label',r.candidate?'Open join request from '+r.candidate:r.unread?r.unread+' unread friend messages':r.duo&&r.partner?'Back to '+r.partner:'Return to friend room');
  }
  function inviteReady(r){return r.host&&r.ready&&!r.partner&&!r.candidate}
  async function start(token,host,other,inviteId,duo=false,inviteName=''){
    if(!actor()||!/^[a-f0-9]{48}$/.test(token))return;
    leave();
    const r=room={duo,inviteName,paperOpen:duo,actor:actor(),host,token,name:display(),partner:'',candidate:'',ready:false,game:host?chosenGame:inviteGame||'three',op:operation,steps:[myStep,myStep],prefs:[FriendGames.settings(choice),FriendGames.settings(choice)],answers:[],offer:'',chat:false,board:Array(host&&chosenGame==='four'?42:9).fill(''),round:1,unread:0,messages:[],recent:[],last:Date.now(),muted:false,status:'Connecting…'};
    draw(r);updateHeader(r);
    try{
      const [id,hostProof,guestProof]=await Promise.all(['room','host','guest'].map(k=>stamp(token,k)));
      if(!active(r))return;
      const address='etm-friend-'+id.slice(0,40);
      const named=host&&actor().role!=='guest'&&window.ETMGameInvites;
      r.familyConnect=async(id,person)=>{
        if(!active(r)||r.conn)return;
        const c=await window.ETMGameInvites.channel(id,person);
        if(!active(r)||r.conn){c.close();return}
        clearTimeout(r.timeout);attach(c);
        if(host)send(r,{type:'hello',proof:hostProof});
      };
      if(other){await r.familyConnect(inviteId,other);return}
      if(named){r.named=true;r.status='Choose someone to invite';refresh(r)}
      if(duo||named&&typeof Peer==='undefined')return;
      function retryGuest(){
        if(!active(r)||host||!r.partner||r.conn||!r.secret)return;
        try{if(p.disconnected)p.reconnect();attach(p.connect(address,{reliable:true,serialization:'json'}))}catch{scheduleRetry()}
      }
      function scheduleRetry(){clearTimeout(r.rejoinTimer);r.rejoinTimer=setTimeout(retryGuest,1800)}
      const p=r.peer=host?new Peer(address):new Peer();
      if(!named)deadline(r,'Couldn’t reach your friend. Check both devices are online, then join again.',30000);
      p.on('open',()=>{
        if(!active(r))return;
        if(host){if(r.conn)return;clearTimeout(r.timeout);r.ready=true;r.status='Ready to invite';refresh(r)}
        else attach(p.connect(address,{reliable:true,serialization:'json'}));
      });
      p.on('connection',c=>{if(active(r)&&host&&!r.conn&&(!r.partner||c.peer===r.peerId))attach(c);else c.close()});
      p.on('call',c=>c.close());p.on('error',()=>{if(r.conn?.family)return;if(r.partner&&r.secret){if(!host&&!r.conn)scheduleRetry();return}if(named){r.ready=false;r.status='Family invitations are available';refresh(r)}else end(r,'Couldn’t connect to this friend room. Try a fresh invitation or another network.')});
      p.on('disconnected',()=>{if(host&&r.partner&&r.secret){try{p.reconnect()}catch{}}else if(!named&&!r.partner)end(r,'The invitation service disconnected. Please start again.')});
      function attach(c){
        r.conn=c;
        const resuming=!!r.partner;let proved=false;
        const handshake=setTimeout(()=>{if(active(r)&&!proved){c.close();if(!host&&!resuming)end(r,'The invitation timed out. Ask for a fresh link.')}},18000);
        c.on('open',()=>{if(host)send(r,{type:resuming?'rejoin-hello':'hello',proof:hostProof})});
        c.on('data',m=>{
          if(!active(r)||r.conn!==c||!m||typeof m!=='object')return;
          if(!proved&&resuming){
            if(!host&&m.type==='rejoin-hello'&&m.proof===hostProof){send(r,{type:'rejoin',secret:r.secret});return}
            if(host&&m.type==='rejoin'&&r.secret&&m.secret===r.secret){
              send(r,{type:'resumed',round:r.round,board:r.board,answers:r.answers,offer:r.offer,view:r.match?FriendGames.view(r.match,1):null});
            }else if(!host&&m.type==='resumed'&&Number.isSafeInteger(m.round)&&Array.isArray(m.board)&&m.board.length===r.board.length&&m.board.every(x=>['','X','O'].includes(x))&&Array.isArray(m.answers)&&m.answers.length<=10&&(!extended(r.game)||FriendGames.validView(r.game,m.view))){
              r.board=m.board;r.answers=m.answers;r.round=m.round;r.offer=m.offer==='in'?'out':m.offer==='out'?'in':'';
              if(m.view)acceptView(r,m.view);
            }else{c.close();return}
            proved=true;clearTimeout(handshake);r.last=Date.now();r.waiting=false;refresh(r);updateHeader(r);notice('Back to game with '+r.partner);return;
          }
          if(!proved){
            if(host&&m.type==='join'&&m.proof===guestProof&&clean(m.name,24)){
              proved=true;clearTimeout(handshake);r.candidate=clean(c.family?c.remoteName:m.name,24);
              r.chat=m.chat===true&&chatAllowed()&&(actor().role!=='guest'||m.guest===false);r.steps[1]=validStep(m.step)?m.step:2;r.prefs[1]=FriendGames.settings(m.pref);
              clearTimeout(r.timeout);r.timeout=setTimeout(()=>{if(active(r)&&r.conn===c&&!r.partner){c.close();notice('The welcome timed out. Your friend can join again.')}},60000);r.status=r.candidate+' wants to join.';if(c.family){welcome(r);return}if(!panel?.isConnected&&window.ETMGameInvites){window.ETMGameInvites.prompt('welcome:'+r.token,{title:r.candidate+' is ready to play',yes:'Let them in',accept:()=>welcome(r),decline:()=>end(r,'Invitation closed.')})}refresh(r);updateHeader(r);
            }else if(!host&&m.type==='hello'&&m.proof===hostProof){
              proved=true;clearTimeout(handshake);clearTimeout(r.timeout);r.status='Waiting for your friend to welcome you…';
              deadline(r,'Your friend hasn’t answered yet. You can join again or choose another game.',65000);send(r,{type:'join',proof:guestProof,name:r.name,step:myStep,pref:choice,guest:actor().role==='guest',chat:chatAllowed()});refresh(r);
            }else c.close();
            return;
          }
          if(!host&&!r.partner&&m.type==='welcome'&&clean(m.name,24)){
            if(!Object.hasOwn(titles,m.game)||(m.game==='rally'&&(!validOp(m.op)||!validStep(m.step)))){end(r,'This game needs a newer version of ETM.');return}
            if(!c.family&&typeof m.secret==='string'&&/^[a-f0-9]{48}$/.test(m.secret))r.secret=m.secret;clearTimeout(r.timeout);r.chat=m.chat===true&&chatAllowed()&&(actor().role!=='guest'||m.guest===false);r.op=m.op;r.steps=[m.step,myStep];r.game=m.game;r.board=Array(r.game==='four'?42:9).fill('');r.partner=clean(c.family?c.remoteName:m.name,24);r.status='Connected';if(extended(r.game))startGame(r);beginClock(r);refresh(r);updateHeader(r);return;
          }
          if(!r.partner&&m.type==='decline'){end(r,'Your friend closed this invitation. You can invite someone to a new game.');return}
          if(!r.partner)return;
          r.last=Date.now();if(r.waiting){r.waiting=false;refresh(r);updateHeader(r);notice('Back to game with '+r.partner)}
          if(m.type==='goodbye'){end(r,r.partner+' left. This room is closed.');return}if(m.type==='ping')return;
          if(r.duo&&c.family){
            if(m.type==='kept-page'){ensurePaper(r);if(ETM_CORE.validPage(m.page))r.storePage(m.page);return}
            if(m.type==='paper-point'){ensurePaper(r);r.paperBoard.highlight(m.i);return}
            if(m.type==='paper'&&window.ETMEquations.valid(m.state)){
              ensurePaper(r);r.paperBoard.receive(m.state);savePaper(r);return;
            }
            if(m.type==='switch-view'&&typeof m.paper==='boolean'){
              if(host)send(r,{type:'session-view',paper:m.paper});
              if(host){r.paperOpen=m.paper;refresh(r)}return;
            }
            if(!host&&m.type==='session-view'&&typeof m.paper==='boolean'){r.paperOpen=m.paper;refresh(r);return}
          }
          if(m.type==='chat'){
            const t=clean(m.text,220);if(!t||!canChat(r)||r.muted)return;
            r.recent=r.recent.filter(x=>Date.now()-x<6000);if(r.recent.length>=5)return;
            r.recent.push(Date.now());addChat(r,r.partner,t,true);return;
          }
          if(extended(r.game)&&m.round===r.round){
            if(host&&m.type==='game-action')action(r,m.action,1,m.seq);
            if(!host&&m.type==='game-view'&&FriendGames.validView(r.game,m.view)&&(!r.gameView||m.view.seq>=r.gameView.seq))acceptView(r,m.view);
          }
          if(m.type==='move'&&['three','four'].includes(r.game)&&m.round===r.round&&m.step===r.board.filter(Boolean).length)move(r,m.cell,host?'O':'X',false);
          if(m.type==='answer'&&r.game==='rally'&&m.round===r.round&&m.step===r.answers.length)rallyAnswer(r,m.value,false);
          if(m.round===r.round&&finished(r)){
            if(m.type==='rematch'){if(r.offer==='out')nextRound(r);else{r.offer='in';refresh(r)}}
            if(m.type==='accept-rematch'&&r.offer==='out')nextRound(r);
            if(m.type==='decline-rematch'){r.offer='';refresh(r);notice('Your friend finished this round.')}
          }
          if(m.type==='game-only'){r.chat=false;refresh(r)}
        });
        function closed(){
          clearTimeout(handshake);if(!active(r)||r.conn!==c)return;
          if(host&&!r.partner){clearTimeout(r.timeout);r.conn=null;r.candidate='';r.status='Ready to invite';refresh(r)}
          else if(!host&&!r.partner)retry(r,'The room is closed or your welcome timed out. Try joining again or ask for a fresh invitation.');
          else if(r.leaving){end(r,'You left the room.')}else if(!c.family&&r.secret){r.conn=null;r.waiting=true;refresh(r);updateHeader(r);if(!host)scheduleRetry()}
          else end(r,'Your friend has left or disconnected. This room is closed. Choose a game for a new invitation.');
        }
        c.on('close',closed);c.on('error',closed);
      }
    }catch{end(r,'This device couldn’t open a friend room. Check the connection and try again.')}
  }
  function savePaper(r){
    if(!active(r)||!r.paperBoard)return;
    try{
      const profile=ETM_CORE.profile(learningState,r.paperOwner);
      const merged=ETM_CORE.mergePaper(profile.familyPaper,r.paperBoard.snapshot());
      if(JSON.stringify(profile.familyPaper)===JSON.stringify(merged)&&!r.saveWarned)return;
      profile.familyPaper=merged;
      if(!learningStore())throw Error('Storage full');
      r.saveWarned=false;
    }
    catch{if(!r.saveWarned){r.saveWarned=true;notice('Your paper is live. This device could not keep a copy.')}}
  }
  function readPage(parent,page){
        node('h3','Page from '+page.date,parent);
        const grid=node('div',undefined,parent,'mathPaperGrid reading'),values=new Map(page.paper.cells.map(c=>[c[0],c[1]]));
        for(let i=0;i<page.paper.rows*12;i++)node('span',values.get(i)||'',grid,'paperSquare');
  }
  function ensurePaper(r){
    if(r.paperBoard||!r.conn?.family||!r.partner)return;
    r.paperOwner=r.actor.role==='dad'?r.partner:r.actor.name;
    r.paperElement=document.createElement('section');
    node('h3','Our maths paper',r.paperElement);
    const book=node('div',undefined,r.paperElement,'copybookTools');
    const date=node('input',undefined,book);date.type='date';date.setAttribute('aria-label','Page date');
    const today=new Date();date.value=new Date(today-today.getTimezoneOffset()*60000).toISOString().slice(0,10);
    const live=node('div',undefined,r.paperElement),archive=node('div',undefined,r.paperElement);
    const profile=()=>ETM_CORE.profile(learningState,r.paperOwner);
    function showArchive(){
      archive.replaceChildren();
      const pages=Object.values(profile().copybook||{}).reverse().sort((a,b)=>b.date.localeCompare(a.date));
      if(!pages.length)return;
      const list=node('details',undefined,archive);node('summary','Kept pages ('+pages.length+')',list);
      pages.forEach(page=>btn(page.date+' · '+page.paper.cells.filter(c=>c[1]).slice(0,12).map(c=>c[1]).join(''),()=>{
        archive.replaceChildren();live.hidden=book.hidden=true;
        readPage(archive,page);
        btn('Back to current page',()=>{live.hidden=book.hidden=false;showArchive()},archive,'lPill');
      },list,'lPill'));
    }
    r.storePage=page=>{const p=profile();p.copybook??={};p.copybook[page.id]=page;const saved=learningStore();if(!live.hidden)showArchive();return saved};
    function keep(){
      const paper=r.paperBoard.snapshot();if(!paper.cells.some(c=>c[1]))return true;
      const page={id:crypto.randomUUID(),date:date.value,paper:{rows:paper.rows,cells:paper.cells.filter(c=>c[1]).sort((a,b)=>a[0]-b[0])}};
      if(!ETM_CORE.validPage(page)){notice('Choose a date first.');return false}
      if(Object.values(profile().copybook||{}).some(p=>p.date===page.date&&JSON.stringify(p.paper)===JSON.stringify(page.paper)))return true;
      if(!r.storePage(page)){delete profile().copybook[page.id];showArchive();notice('Could not save this page. Your working is still here.');return false}
      send(r,{type:'kept-page',page});notice('Page kept in '+r.paperOwner+'’s copybook.');return true;
    }
    btn('Keep this page',keep,book,'lPill');
    btn('New page',()=>{if(keep())r.paperBoard.clearPage()},book,'lPill');showArchive();
    r.paperBoard=window.ETMEquations.mount(live,r.actor.role==='dad',()=>{
      savePaper(r);r.paperDirty=true;flushPaper();
    },i=>send(r,{type:'paper-point',i}));
    try{const saved=learningState.profiles[r.paperOwner]?.familyPaper;if(window.ETMEquations.valid(saved))r.paperBoard.receive(saved)}catch{}
    function flushPaper(){
      if(active(r)&&r.paperDirty&&r.conn.open&&r.conn.pending<4){
        r.paperDirty=false;send(r,{type:'paper',state:r.paperBoard.snapshot()});
      }
    }
    r.paperDirty=true;flushPaper();r.paperTimer=setInterval(flushPaper,250);
  }
  function wakeGame(){const r=room;if(activeRoom()&&r.conn?.open&&(!r.conn.family||r.conn.pending<6))send(r,{type:'ping'})}
  function activeRoom(){return room&&active(room)&&room.partner}
  window.addEventListener('online',wakeGame);document.addEventListener('visibilitychange',()=>{if(!document.hidden)wakeGame()});
  function beginClock(r){r.last=Date.now();r.clock=setInterval(()=>{
    if(!active(r)){leave();return}
    
    if(r.chat&&!chatAllowed()){r.chat=false;send(r,{type:'game-only'});refresh(r)}
    if(Date.now()-r.last>22000&&!r.waiting){r.waiting=true;refresh(r);updateHeader(r)}
    if(!r.conn?.family||r.conn.pending<5)send(r,{type:'ping'});
  },15000)}
  function result(b){
    const cols=b.length===42?7:3,need=cols===7?4:3;
    const win=ETM_GAMES.winningLine(b,cols,need,'');if(win)return win.mark;
    return b.every(Boolean)?'draw':'';
  }
  function turn(r){return (r.board.filter(Boolean).length+(r.round-1))%2?'O':'X'}
  function move(r,cell,mark,local){
    if(!active(r)||!r.partner||!Number.isInteger(cell)||cell<0||cell>=(r.game==='four'?7:9)||result(r.board)||r.board[cell]||turn(r)!==mark)return;
    if(local&&!send(r,{type:'move',round:r.round,step:r.board.filter(Boolean).length,cell}))return;
    if(r.game==='four')while(cell+7<42&&!r.board[cell+7])cell+=7;
    r.board[cell]=mark;refresh(r);
  }
  function addChat(r,who,text,incoming){
    r.messages.push({who,text});if(r.messages.length>60)r.messages.shift();
    if(panel?.isConnected&&thread?.isConnected&&!document.hidden)paintChat(r);
    else if(incoming){r.unread++;updateHeader(r);notice(r.partner+' sent a friend message. Open Friend room.')}
  }
  function paintChat(r){
    thread.replaceChildren();for(const m of r.messages){const line=node('p',undefined,thread);node('strong',m.who+' · ',line);node('span',m.text,line)}
    thread.scrollTop=thread.scrollHeight;
  }
  function welcome(r){
    if(!active(r)||!r.candidate)return;if(!r.conn.family){r.secret=hex(crypto.getRandomValues(new Uint8Array(24)));r.peerId=r.conn.peer}if(!send(r,{type:'welcome',secret:r.secret,name:r.name,guest:actor().role==='guest',game:r.game,op:r.op,step:r.steps[0],chat:canChat(r)}))return;
    window.ETMGameInvites?.close('welcome:'+r.token);window.ETMGameInvites?.forget(r.directId);
    clearTimeout(r.timeout);r.partner=r.candidate;r.candidate='';if(extended(r.game))startGame(r);beginClock(r);draw(r);updateHeader(r);
  }
  function directOptions(r,card){
    const invites=window.ETMGameInvites;if(!invites||actor()?.role==='guest')return;
    const section=node('div',undefined,card,'inviteFamily');
    node('h3','Invite someone in ETM',section);
    const buttons=node('div',undefined,section,'inviteNames'),status=node('p',r.inviteStatus||'',section);
    status.setAttribute('role','status');let last=null;
    function paint(){
      const names=invites.names().filter(n=>!r.duo||(r.actor.role==='dad'?FAMILY.includes(n):n==='Dad')),key=JSON.stringify(names);if(key===last)return;last=key;buttons.replaceChildren();
      if(!names.length)node('p',r.duo?'Open ETM on the other device and choose your family profile. Their name will appear here.':'Waiting for family to come online. You can also share the link below.',buttons);
      async function invitePerson(name){
        if(r.sending)return;r.sending=true;invites.forget(r.directId);
        const id=await invites.invite(name,r.duo?r.token+'.duo':link(r).split('#play=')[1],msg=>{
          r.inviteStatus=msg;if(active(r)&&r.inviteLabel?.isConnected)r.inviteLabel.textContent=msg;
        },(id,person)=>r.familyConnect(id,person));
        r.sending=false;if(!active(r)||r.partner)invites.forget(id);else r.directId=id;
      }
      for(const name of names)btn('Invite '+name,()=>invitePerson(name),buttons,'primaryButton');
      if(r.inviteName&&names.includes(r.inviteName)){const name=r.inviteName;r.inviteName='';invitePerson(name)}
    }
    r.inviteLabel=status;paint();
    clearInterval(r.contactTimer);r.contactTimer=setInterval(()=>{if(!active(r)||!section.isConnected){clearInterval(r.contactTimer);return}paint()},1000);
  }
  function draw(r){
    if(!active(r))return;
    const draft=panel?.isConnected&&messageBox?messageBox.value:'',wasTyping=messageBox&&document.activeElement===messageBox;
    panel=learningPage(r.duo?'Maths together':'Play with a friend','friends',r.duo?home:learningPlayTogether);thread=null;messageBox=null;
    const card=node('div',undefined,panel,'friendCard');
    const heading=node('h2',r.partner?'You and '+r.partner:r.status,card);window.etmMotif?.(heading,r.partner||r.name);
    if(r.partner){r.connectionNote=node('p',r.waiting?'Rejoining '+r.partner+'… Your game is here.':'',card);r.connectionNote.setAttribute('role','status');r.connectionNote.hidden=!r.waiting}
    if(r.named&&!r.partner&&!r.candidate)directOptions(r,card);
    if(inviteReady(r)){
      node('p','Playing with a guest? Send them this private link and keep ETM open.',card);
      btn('Copy invitation',async()=>{
        try{await navigator.clipboard.writeText(link(r));if(active(r))notice('Invitation copied. Send it to your friend.')}
        catch{if(!active(r)||card.querySelector('input'))return;const field=node('input',undefined,card);field.readOnly=true;field.value=link(r);field.setAttribute('aria-label','Friend invitation link');field.select()}
      },card,'primaryButton');
    }
    if(r.candidate&&!r.partner){
      node('p','Only let them in if you recognise the friend you invited.',card);
      btn('Let them in',()=>welcome(r),card,'primaryButton');
      btn('Decline invitation',()=>{send(r,{type:'decline'});end(r,'Invitation closed.')},card,'quietButton');
    }
    if(r.partner){
      if(r.duo){
        ensurePaper(r);
        btn(r.paperOpen?'Play a number rally':'Back to our paper',()=>{
          const paper=!r.paperOpen;
          if(!send(r,{type:r.host?'session-view':'switch-view',paper}))return;
          if(r.host){r.paperOpen=paper;refresh(r)}
        },card,'lPill');
      }
      if(r.waiting){node('p','Play continues when you are both connected.',card)}else if(r.duo&&r.paperOpen){card.appendChild(r.paperElement)}
      else if(extended(r.game)){const seq=r.gameView?.seq;friendGameBoard(r,card,a=>action(r,a,0,seq),()=>refresh(r))}else if(r.game==='rally')drawRally(r,card);else{
      const mark=r.host?'X':'O',winner=result(r.board),myTurn=turn(r)===mark;
      const counter=m=>r.game==='four'?(m==='X'?'red ●':'gold ◆'):m;
      const status=winner==='draw'?'A draw!':winner?(winner===mark?'You won!':r.partner+' won!'):myTurn?'Your turn · '+counter(mark):r.partner+'’s turn · '+counter(turn(r));
      node('p',(r.game==='four'?'Connect four':'Three in a row')+' · '+status,card,'friendTurn').setAttribute('role','status');
      const board=node('div',undefined,card,r.game==='four'?'friendFour':'friendBoard');
      if(r.game==='four'){
        const line=ETM_GAMES.winningLine(r.board,7,4,'');
        if(line)node('p','Four '+line.label+'! Look for the four stars.',card,'winExplanation');
        for(let col=0;col<7;col++){
          const b=btn('',()=>move(r,col,mark,true),board,'friendColumn');
          const spots=Array.from({length:6},(_,row)=>r.board[row*7+col]);
          b.setAttribute('aria-label','Drop in column '+(col+1)+'. From bottom: '+spots.slice().reverse().map(v=>v||'empty').join(', '));
          b.disabled=!!spots[0]||!!winner||!myTurn;
          spots.forEach((v,row)=>{
            const hit=line?.cells.includes(row*7+col);
            const disc=node('span',hit?'★':v==='X'?'●':v==='O'?'◆':'',b,'friendDisc'+(hit?' winCoin':''));
            disc.dataset.mark=v;
          });
          if(line?.cells.some(i=>i%7===col))b.setAttribute('aria-label',b.getAttribute?b.getAttribute('aria-label')+' · winning column':'Winning column '+(col+1));
        }
      }else r.board.forEach((v,i)=>{const b=btn(v,()=>move(r,i,mark,true),board,'friendCell');b.disabled=!!v||!!winner||!myTurn;b.dataset.mark=v;b.setAttribute('aria-label','Row '+(Math.floor(i/3)+1)+', column '+(i%3+1)+', '+(v||'empty'))});
      }
      if(!r.paperOpen&&finished(r)){window.etmMotif?.(card.querySelector?.('.friendTurn'),r.name);
        if(r.offer==='out')node('p','Rematch requested. Waiting for '+r.partner+'.',card);
        else btn(r.offer==='in'?'Accept rematch':'Play again',()=>requestAgain(r),card,'primaryButton');
        if(r.offer==='in')btn('Finish here',()=>{send(r,{type:'decline-rematch',round:r.round});r.offer='';end(r,'You finished the game.')},card,'quietButton');
      }
      if(!canChat(r))node('p','Games only · chat is off for this visit.',card);else{
      const chat=node('section',undefined,card,'friendChat');node('h3','Chat with '+r.partner,chat);
      thread=node('div',undefined,chat,'friendThread');thread.setAttribute('role','log');paintChat(r);
      r.unread=0;updateHeader(r);
      if(!r.muted){
        form=node('form',undefined,chat,'friendForm');messageBox=node('input',undefined,form);
        messageBox.maxLength=220;messageBox.placeholder='Write a message';messageBox.setAttribute('aria-label','Your message');messageBox.value=draft;if(wasTyping)messageBox.focus({preventScroll:true});
        const b=node('button','Send',form,'primaryButton');b.type='submit';
        form.onsubmit=e=>{e.preventDefault();const t=clean(messageBox.value,220);if(!t||!canChat(r))return;
          r.sent=(r.sent||[]).filter(x=>Date.now()-x<6000);if(r.sent.length>=5){notice('Give your friend a moment to reply.');return}
          if(send(r,{type:'chat',text:t})){r.sent.push(Date.now());messageBox.value='';addChat(r,'You',t,false)}};
      }
      btn(r.muted?'Turn chat on':'Mute chat',()=>{r.muted=!r.muted;draw(r)},chat,'quietButton');
    }
    }
    if(!r.candidate)btn(r.partner?'Leave game':'Cancel',()=>{if(r.partner&&r.conn?.open&&!r.conn.family&&send(r,{type:'goodbye'})){r.leaving=true;r.waiting=true;refresh(r);setTimeout(()=>end(r,'You left the room.'),250);return}if(r.partner)send(r,{type:'goodbye'});end(r,'You left the room.')},card,'quietButton');
  }
  function arrive(){
    if(!actor()||invitationShown)return;
    const t=sessionStorage.getItem(tokenKey);if(!t)return;
    sessionStorage.removeItem(tokenKey);
    const match=/^([a-f0-9]{48})(?:[.]([a-z]{2,9})(?:[.](add|sub|times))?)?$/.exec(t);if(!match||match[2]&&!Object.hasOwn(titles,match[2]))return;
    invitationShown=true;pendingInvite=match[1];inviteGame=match[2]||'';if(validOp(match[3]))operation=match[3];lobby();
  }
  function describe(visit){
    if(/^[a-f0-9]{48}\.duo$/.test(visit)&&familyActor())return {token:visit.split('.')[0],game:'rally',duo:true,title:'Maths together',yes:'Join maths'};
    const m=/^([a-f0-9]{48})[.]([a-z]{2,9})(?:[.](add|sub|times))?$/.exec(visit);
    if(!m||!Object.hasOwn(titles,m[2]))return null;
    const game=m[2];return {token:m[1],game,op:m[3],title:titles[game],yes:game==='quiz'?'Join quiz':['tables','rally'].includes(game)?'Join rally':'Join game',
      options:parent=>{if(game==='rally')tablePicker(parent,false);gameOptions(game,parent)}};
  }
  window.ETMFriends={copybook(){
    const user=actor();if(!user||user.role==='guest')return;
    const page=learningPage('Kept maths pages','maths',learningMath);
    for(const name of user.role==='dad'?FAMILY:[user.name]){
      const pages=Object.values(learningState.profiles[name]?.copybook||{}).reverse().sort((a,b)=>b.date.localeCompare(a.date));
      for(const saved of pages){const detail=node('details',undefined,page);node('summary',name+' · '+saved.date+' · '+saved.paper.cells.slice(0,10).map(c=>c[1]).join(''),detail);detail.ontoggle=()=>{if(detail.open&&detail.children.length===1)readPage(detail,saved)}}
    }
  },refreshPaper(name,paper){
    if(room&&active(room)&&room.paperOwner===name&&room.paperBoard)room.paperBoard.receive(paper);
  },together(inviteName=''){if(!familyActor())return;if(room&&active(room)){draw(room);return}chosenGame='rally';operation='add';myStep=2;start(hex(crypto.getRandomValues(new Uint8Array(24))),true,null,null,true,inviteName)},open:lobby,leave,arrive,describe,joinVisit(visit,other,id){
    const info=describe(visit);if(!info||!actor())return;inviteGame=info.game;pendingInvite='';if(validOp(info.op))operation=info.op;if(info.duo&&!(actor().role==='dad'?FAMILY.includes(other.name):other.name==='Dad'))return;start(info.token,false,other,id,!!info.duo);
  },choose(id){if(Object.hasOwn(titles,id))chosenGame=id;lobby()},rally(op,step){chosenGame='rally';operation=validOp(op)?op:'add';myStep=validStep(step)?step:2;lobby()}};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&room&&active(room)&&room.unread&&panel?.isConnected&&thread?.isConnected){paintChat(room);room.unread=0;updateHeader(room)}});
  window.addEventListener('pagehide',leave);
  queueMicrotask(arrive);
})();
