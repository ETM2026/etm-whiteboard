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
    if(r){clearTimeout(r.timeout);clearInterval(r.clock);clearInterval(r.gameClock);clearInterval(r.contactTimer);try{r.conn?.close()}catch{}try{r.peer?.destroy()}catch{}}
    header?.remove();header=null;panel=null;thread=null;messageBox=null;form=null;
  }
  function end(r,why){
    if(!active(r))return;
    const visible=panel?.isConnected;
    leave();if(visible)lobby(why);else notice(why);
  }
  function send(r,data){
    if(!active(r)||!r.conn?.open)return false;
    try{r.conn.send(data);return true}catch{end(r,'The connection closed. Start a new invitation to play again.');return false}
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
    clearInterval(r.gameClock);
    if(FriendGames.isRace(r.game))r.gameClock=setInterval(()=>{
      if(!active(r))return;
      if(r.host&&r.match?.until&&!r.match.done&&Date.now()>=r.match.until){
        r.match.done=true;r.match.seq++;publishGame(r);
      }
      if(r.raceClockLabel?.isConnected&&r.viewUntil)r.raceClockLabel.textContent=Math.ceil(Math.max(0,r.viewUntil-Date.now())/1000)+' seconds';
    },250);
  }
  function action(r,a,seat,seq){
    if(!active(r)||!r.partner||!extended(r.game)||!r.gameView)return;
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
    header.textContent=r.candidate?'🏁 Join request':r.unread?'Friend • '+r.unread:'Friend room';
    header.setAttribute('aria-label',r.candidate?'Open join request from '+r.candidate:r.unread?r.unread+' unread friend messages':'Return to friend room');
  }
  function inviteReady(r){return r.host&&r.ready&&!r.partner&&!r.candidate}
  async function start(token,host,other,inviteId){
    if(!actor()||!/^[a-f0-9]{48}$/.test(token))return;
    leave();
    const r=room={actor:actor(),host,token,name:display(),partner:'',candidate:'',ready:false,game:host?chosenGame:inviteGame||'three',op:operation,steps:[myStep,myStep],prefs:[FriendGames.settings(choice),FriendGames.settings(choice)],answers:[],offer:'',chat:false,board:Array(host&&chosenGame==='four'?42:9).fill(''),round:1,unread:0,messages:[],recent:[],last:Date.now(),muted:false,status:'Connecting…'};
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
      if(named&&typeof Peer==='undefined')return;
      const p=r.peer=host?new Peer(address):new Peer();
      if(!named)deadline(r,'Couldn’t reach your friend. Check both devices are online, then join again.',30000);
      p.on('open',()=>{
        if(!active(r))return;
        if(host){if(r.conn)return;clearTimeout(r.timeout);r.ready=true;r.status='Ready to invite';refresh(r)}
        else attach(p.connect(address,{reliable:true,serialization:'json'}));
      });
      p.on('connection',c=>{if(active(r)&&host&&!r.conn)attach(c);else c.close()});
      p.on('call',c=>c.close());p.on('error',()=>{if(r.conn?.family)return;if(named){r.ready=false;r.status='Family invitations are available';refresh(r)}else end(r,'Couldn’t connect to this friend room. Try a fresh invitation or another network.')});
      p.on('disconnected',()=>{if(!named&&!r.partner)end(r,'The invitation service disconnected. Please start again.')});
      function attach(c){
        r.conn=c;
        let proved=false;
        const handshake=setTimeout(()=>{if(active(r)&&!proved){c.close();if(!host)end(r,'The invitation timed out. Ask for a fresh link.')}},18000);
        c.on('open',()=>{if(host)send(r,{type:'hello',proof:hostProof})});
        c.on('data',m=>{
          if(!active(r)||r.conn!==c||!m||typeof m!=='object')return;
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
            clearTimeout(r.timeout);r.chat=m.chat===true&&chatAllowed()&&(actor().role!=='guest'||m.guest===false);r.op=m.op;r.steps=[m.step,myStep];r.game=m.game;r.board=Array(r.game==='four'?42:9).fill('');r.partner=clean(m.name,24);r.status='Connected';if(extended(r.game))startGame(r);beginClock(r);refresh(r);return;
          }
          if(!r.partner&&m.type==='decline'){end(r,'Your friend closed this invitation. You can invite someone to a new game.');return}
          if(!r.partner)return;
          r.last=Date.now();
          if(m.type==='ping')return;
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
          else end(r,'Your friend has left or disconnected. This room is closed. Choose a game for a new invitation.');
        }
        c.on('close',closed);c.on('error',closed);
      }
    }catch{end(r,'This device couldn’t open a friend room. Check the connection and try again.')}
  }
  function beginClock(r){r.last=Date.now();r.clock=setInterval(()=>{
    if(!active(r)){leave();return}
    if(Date.now()-r.last>90000){end(r,'The friend connection ended. Send a fresh invitation to play again.');return}
    if(r.chat&&!chatAllowed()){r.chat=false;send(r,{type:'game-only'});refresh(r)}
    send(r,{type:'ping'});
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
    if(!active(r)||!r.candidate||!send(r,{type:'welcome',name:r.name,guest:actor().role==='guest',game:r.game,op:r.op,step:r.steps[0],chat:canChat(r)}))return;
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
      const names=invites.names(),key=JSON.stringify(names);if(key===last)return;last=key;buttons.replaceChildren();
      if(!names.length)node('p','Waiting for family to come online. You can also share the link below.',buttons);
      for(const name of names)btn('Invite '+name,async()=>{
        if(r.sending)return;r.sending=true;invites.forget(r.directId);
        const id=await invites.invite(name,link(r).split('#play=')[1],msg=>{
          r.inviteStatus=msg;if(active(r)&&r.inviteLabel?.isConnected)r.inviteLabel.textContent=msg;
        },(id,person)=>r.familyConnect(id,person));
        r.sending=false;if(!active(r)||r.partner)invites.forget(id);else r.directId=id;
      },buttons,'primaryButton');
    }
    r.inviteLabel=status;paint();
    clearInterval(r.contactTimer);r.contactTimer=setInterval(()=>{if(!active(r)||!section.isConnected){clearInterval(r.contactTimer);return}paint()},1000);
  }
  function draw(r){
    if(!active(r))return;
    const draft=panel?.isConnected&&messageBox?messageBox.value:'',wasTyping=messageBox&&document.activeElement===messageBox;
    panel=learningPage('Play with a friend','friends',learningPlayTogether);thread=null;messageBox=null;
    const card=node('div',undefined,panel,'friendCard');
    node('h2',r.partner?'You and '+r.partner:r.status,card);
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
      if(extended(r.game)){const seq=r.gameView?.seq;friendGameBoard(r,card,a=>action(r,a,0,seq),()=>refresh(r))}else if(r.game==='rally')drawRally(r,card);else{
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
      if(finished(r)){
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
    if(!r.candidate)btn(r.partner?'Leave game':'Cancel',()=>end(r,'You left the room.'),card,'quietButton');
  }
  function arrive(){
    if(!actor()||invitationShown)return;
    const t=sessionStorage.getItem(tokenKey);if(!t)return;
    sessionStorage.removeItem(tokenKey);
    const match=/^([a-f0-9]{48})(?:[.]([a-z]{2,9})(?:[.](add|sub|times))?)?$/.exec(t);if(!match||match[2]&&!Object.hasOwn(titles,match[2]))return;
    invitationShown=true;pendingInvite=match[1];inviteGame=match[2]||'';if(validOp(match[3]))operation=match[3];lobby();
  }
  function describe(visit){
    const m=/^([a-f0-9]{48})[.]([a-z]{2,9})(?:[.](add|sub|times))?$/.exec(visit);
    if(!m||!Object.hasOwn(titles,m[2]))return null;
    const game=m[2];return {token:m[1],game,op:m[3],title:titles[game],yes:game==='quiz'?'Join quiz':['tables','rally'].includes(game)?'Join rally':'Join game',
      options:parent=>{if(game==='rally')tablePicker(parent,false);gameOptions(game,parent)}};
  }
  window.ETMFriends={open:lobby,leave,arrive,describe,joinVisit(visit,other,id){
    const info=describe(visit);if(!info||!actor())return;inviteGame=info.game;pendingInvite='';if(validOp(info.op))operation=info.op;start(info.token,false,other,id);
  },choose(id){if(Object.hasOwn(titles,id))chosenGame=id;lobby()},rally(op,step){chosenGame='rally';operation=validOp(op)?op:'add';myStep=validStep(step)?step:2;lobby()}};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&room&&active(room)&&room.unread&&panel?.isConnected&&thread?.isConnected){paintChat(room);room.unread=0;updateHeader(room)}});
  window.addEventListener('pagehide',leave);
  queueMicrotask(arrive);
})();
