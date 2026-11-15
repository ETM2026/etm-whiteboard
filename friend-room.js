// A private two-seat data channel. Family signalling, contacts and media are separate.
(function(){
  let room=null, panel=null, header=null, form=null, thread=null, messageBox=null, pendingInvite='', invitationShown=false, chosenGame='three';
  const tokenKey='ETM.friendVisit';
  function actor(){return pl && accessSession && accessSession.name===pl.n && sessionValid(accessSession) && accessSession.role!=='entry' ? accessSession : null}
  function active(r){return room===r && r.actor===actor()}
  function clean(text,limit){return typeof text==='string'?text.normalize('NFKC').replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2066-\u2069]/g,' ').trim().slice(0,limit):''}
  function display(){return clean(pl.n.replace(/^Guest · /,''),24)||'Player'}
  function hex(bytes){return Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('')}
  async function stamp(token,label){return hex(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode('ETM-friends/v1/'+label+'/'+token))))}
  function link(token){return new URL(location.pathname,location.origin).href+'#play='+token}
  function leave(){
    const r=room;room=null;
    if(r){clearTimeout(r.timeout);clearInterval(r.clock);try{r.conn?.close()}catch{}try{r.peer?.destroy()}catch{}}
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
    node('h2',pendingInvite?'You have a game invitation':'Who would you like to play with?',card);
    node('p',info||(pendingInvite?'Join the room and wait for your friend to let you in.':'Send a private link to one friend. Choose a game and chat while you play.'),card);
    if(pendingInvite){
      btn('Join my friend',()=>{const token=pendingInvite;pendingInvite='';start(token,false)},card,'primaryButton');
      btn('Dismiss invitation',()=>{pendingInvite='';home()},card,'quietButton');
    }else{
      const row=node('div',undefined,card,'atlasTabs');
      for(const [id,title] of [['three','Three in a row'],['four','Connect four']]){
        const b=btn(title,()=>{chosenGame=id;lobby()},row,'lPill');b.setAttribute('aria-pressed',String(id===chosenGame));
      }
      btn('Invite a friend',()=>start(hex(crypto.getRandomValues(new Uint8Array(24))),true),card,'primaryButton');
    }
  }
  function refresh(r){if(active(r)&&panel?.isConnected)draw(r)}
  function updateHeader(r){
    if(!active(r))return;
    if(!header)header=btn('',()=>draw(r),appHeader,'quietButton friendBadge');
    header.textContent=r.unread?'Friend • '+r.unread:'Friend room';
    header.setAttribute('aria-label',r.unread?r.unread+' unread friend messages':'Return to friend room');
  }
  function inviteReady(r){return r.host&&r.ready&&!r.partner&&!r.candidate}
  async function start(token,host){
    if(!actor()||!/^[a-f0-9]{48}$/.test(token))return;
    leave();
    const r=room={actor:actor(),host,token,name:display(),partner:'',candidate:'',ready:false,game:host?chosenGame:'three',board:Array(host&&chosenGame==='four'?42:9).fill(''),round:1,unread:0,messages:[],recent:[],last:Date.now(),muted:false,status:'Connecting…'};
    draw(r);updateHeader(r);
    try{
      const [id,hostProof,guestProof]=await Promise.all(['room','host','guest'].map(k=>stamp(token,k)));
      if(!active(r))return;
      const address='etm-friend-'+id.slice(0,40);
      const p=r.peer=host?new Peer(address):new Peer();
      r.timeout=setTimeout(()=>end(r,'Couldn’t reach your friend. Check that both devices are online and the invitation is still open.'),30000);
      p.on('open',()=>{
        if(!active(r))return;
        if(host){clearTimeout(r.timeout);r.ready=true;r.status='Ready to invite';refresh(r)}
        else attach(p.connect(address,{reliable:true,serialization:'json'}));
      });
      p.on('connection',c=>{if(active(r)&&host&&!r.conn)attach(c);else c.close()});
      p.on('call',c=>c.close());p.on('error',()=>end(r,'Couldn’t connect to this friend room. Try a fresh invitation or another network.'));
      p.on('disconnected',()=>{if(!r.partner)end(r,'The invitation service disconnected. Please start again.')});
      function attach(c){
        r.conn=c;
        let proved=false;
        const handshake=setTimeout(()=>{if(active(r)&&!proved){c.close();if(!host)end(r,'The invitation timed out. Ask for a fresh link.')}},18000);
        c.on('open',()=>{if(host)send(r,{type:'hello',proof:hostProof})});
        c.on('data',m=>{
          if(!active(r)||r.conn!==c||!m||typeof m!=='object')return;
          if(!proved){
            if(host&&m.type==='join'&&m.proof===guestProof&&clean(m.name,24)){
              proved=true;clearTimeout(handshake);r.candidate=clean(m.name,24);
              r.status=r.candidate+' wants to join.';if(!panel?.isConnected)notice('A friend is waiting. Open Friend room.');refresh(r);
            }else if(!host&&m.type==='hello'&&m.proof===hostProof){
              proved=true;clearTimeout(handshake);clearTimeout(r.timeout);r.status='Waiting for your friend to welcome you…';
              send(r,{type:'join',proof:guestProof,name:r.name});refresh(r);
            }else c.close();
            return;
          }
          if(!host&&!r.partner&&m.type==='welcome'&&clean(m.name,24)){
            if(!['three','four'].includes(m.game)){end(r,'This game needs a newer version of ETM.');return}
            r.game=m.game;r.board=Array(r.game==='four'?42:9).fill('');r.partner=clean(m.name,24);r.status='Connected';beginClock(r);refresh(r);return;
          }
          if(!r.partner)return;
          r.last=Date.now();
          if(m.type==='ping')return;
          if(m.type==='chat'){
            const t=clean(m.text,220);if(!t||r.muted)return;
            r.recent=r.recent.filter(x=>Date.now()-x<6000);if(r.recent.length>=5)return;
            r.recent.push(Date.now());addChat(r,r.partner,t,true);return;
          }
          if(m.type==='move'&&m.round===r.round&&m.step===r.board.filter(Boolean).length)move(r,m.cell,host?'O':'X',false);
          if(m.type==='again'&&!host&&m.round===r.round+1&&result(r.board)){r.round++;r.board.fill('');refresh(r)}
        });
        function closed(){
          clearTimeout(handshake);if(!active(r)||r.conn!==c)return;
          if(host&&!r.partner){r.conn=null;r.candidate='';r.status='Ready to invite';refresh(r)}
          else end(r,'Your friend has left or disconnected. This room is closed.');
        }
        c.on('close',closed);c.on('error',closed);
      }
    }catch{end(r,'This device couldn’t open a friend room. Check the connection and try again.')}
  }
  function beginClock(r){r.last=Date.now();r.clock=setInterval(()=>{
    if(!active(r)){leave();return}
    if(Date.now()-r.last>90000){end(r,'The friend connection ended. Send a fresh invitation to play again.');return}
    send(r,{type:'ping'});
  },15000)}
  function result(b){
    const cols=b.length===42?7:3,need=cols===7?4:3;
    for(let i=0;i<b.length;i++){
      if(!b[i])continue;
      for(const [dx,dy] of [[1,0],[0,1],[1,1],[-1,1]]){
        const x=i%cols,y=Math.floor(i/cols),endX=x+(need-1)*dx,endY=y+(need-1)*dy;
        if(endX<0||endX>=cols||endY>=b.length/cols)continue;
        let k=1;while(k<need&&b[i+k*(dy*cols+dx)]===b[i])k++;
        if(k===need)return b[i];
      }
    }
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
  function draw(r){
    if(!active(r))return;
    const draft=panel?.isConnected&&messageBox?messageBox.value:'',wasTyping=messageBox&&document.activeElement===messageBox;
    panel=learningPage('Play with a friend','friends',learningPlayTogether);thread=null;messageBox=null;
    const card=node('div',undefined,panel,'friendCard');
    node('h2',r.partner?'You and '+r.partner:r.status,card);
    if(inviteReady(r)){
      node('p','Share this link with the friend you want to play with. Keep ETM open.',card);
      btn('Copy invitation',async()=>{
        try{await navigator.clipboard.writeText(link(r.token));if(active(r))notice('Invitation copied. Send it to your friend.')}
        catch{if(!active(r)||card.querySelector('input'))return;const field=node('input',undefined,card);field.readOnly=true;field.value=link(r.token);field.setAttribute('aria-label','Friend invitation link');field.select()}
      },card,'primaryButton');
    }
    if(r.candidate&&!r.partner){
      node('p','Only let them in if you recognise the friend you invited.',card);
      btn('Let them in',()=>{if(!r.candidate||!send(r,{type:'welcome',name:r.name,game:r.game}))return;r.partner=r.candidate;r.candidate='';beginClock(r);draw(r)},card,'primaryButton');
      btn('Close invitation',()=>end(r,'Invitation closed.'),card,'quietButton');
    }
    if(r.partner){
      const mark=r.host?'X':'O',winner=result(r.board),myTurn=turn(r)===mark;
      const status=winner==='draw'?'A draw!':winner?(winner===mark?'You won!':r.partner+' won!'):myTurn?'Your turn · '+mark:r.partner+'’s turn · '+turn(r);
      node('p',(r.game==='four'?'Connect four':'Three in a row')+' · '+status,card,'friendTurn').setAttribute('role','status');
      const board=node('div',undefined,card,r.game==='four'?'friendFour':'friendBoard');
      if(r.game==='four'){
        for(let col=0;col<7;col++){
          const b=btn('',()=>move(r,col,mark,true),board,'friendColumn');
          const spots=Array.from({length:6},(_,row)=>r.board[row*7+col]);
          b.setAttribute('aria-label','Drop in column '+(col+1)+'. From bottom: '+spots.slice().reverse().map(v=>v||'empty').join(', '));
          b.disabled=!!spots[0]||!!winner||!myTurn;
          for(const v of spots)node('span',v,b,'friendDisc').dataset.mark=v;
        }
      }else r.board.forEach((v,i)=>{const b=btn(v,()=>move(r,i,mark,true),board,'friendCell');b.disabled=!!v||!!winner||!myTurn;b.dataset.mark=v;b.setAttribute('aria-label','Row '+(Math.floor(i/3)+1)+', column '+(i%3+1)+', '+(v||'empty'))});
      if(winner&&r.host)btn('Play again',()=>{if(send(r,{type:'again',round:r.round+1})){r.round++;r.board.fill('');draw(r)}},card,'primaryButton');
      if(winner&&!r.host)node('p','Your friend can start the next round.',card);
      const chat=node('section',undefined,card,'friendChat');node('h3','Chat with '+r.partner,chat);
      thread=node('div',undefined,chat,'friendThread');thread.setAttribute('role','log');paintChat(r);
      r.unread=0;updateHeader(r);
      if(!r.muted){
        form=node('form',undefined,chat,'friendForm');messageBox=node('input',undefined,form);
        messageBox.maxLength=220;messageBox.placeholder='Write a message';messageBox.setAttribute('aria-label','Your message');messageBox.value=draft;if(wasTyping)messageBox.focus({preventScroll:true});
        const b=node('button','Send',form,'primaryButton');b.type='submit';
        form.onsubmit=e=>{e.preventDefault();const t=clean(messageBox.value,220);if(!t)return;
          r.sent=(r.sent||[]).filter(x=>Date.now()-x<6000);if(r.sent.length>=5){notice('Give your friend a moment to reply.');return}
          if(send(r,{type:'chat',text:t})){r.sent.push(Date.now());messageBox.value='';addChat(r,'You',t,false)}};
      }
      btn(r.muted?'Turn chat on':'Mute chat',()=>{r.muted=!r.muted;draw(r)},chat,'quietButton');
    }
    if(!r.candidate)btn(r.partner?'Leave game':'Cancel',()=>end(r,'You left the room.'),card,'quietButton');
  }
  function arrive(){
    if(!actor()||invitationShown)return;
    const t=sessionStorage.getItem(tokenKey);if(!t)return;
    sessionStorage.removeItem(tokenKey);
    if(!/^[a-f0-9]{48}$/.test(t))return;
    invitationShown=true;pendingInvite=t;lobby();
  }
  window.ETMFriends={open:lobby,leave,arrive};
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&room&&active(room)&&room.unread&&panel?.isConnected&&thread?.isConnected){paintChat(room);room.unread=0;updateHeader(room)}});
  window.addEventListener('pagehide',leave);
  queueMicrotask(arrive);
})();
