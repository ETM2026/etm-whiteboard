// Visible invitations between signed-in family devices. The private room token is
// encrypted for the chosen device before the existing signed transport carries it.
window.ETMGameInvites=(function(){
  const prompts=new Map(),sent=new Map();
  let current=null, actor=accessSession;
  function close(id){
    const p=prompts.get(id);if(!p)return;
    clearTimeout(p.timer);prompts.delete(id);
    if(current===id){current=null;p.dialog?.remove();showNext()}
  }
  function showNext(){
    if(current||!prompts.size)return;
    const [id,p]=prompts.entries().next().value;current=id;
    const d=p.dialog=node('dialog',undefined,document.body,'gameInviteCard');
    const title=node('h2',p.title,d);title.id='etmInviteTitle';d.setAttribute('aria-labelledby',title.id);
    if(p.text)node('p',p.text,d);
    p.options?.(d);
    const yes=btn(p.yes,()=>{close(id);p.accept()},d,'primaryButton');
    const no=()=>{close(id);p.decline?.()};
    btn('Not now',no,d,'quietButton');d.oncancel=e=>{e.preventDefault();no()};
    if(typeof d.showModal==='function')d.showModal();else d.setAttribute('open','');
    yes.focus();p.shown?.();
  }
  function prompt(id,options){
    if(actor!==accessSession)reset();if(prompts.has(id))return;
    options.timer=setTimeout(()=>close(id),90000);
    prompts.set(id,options);showNext();
  }
  function reset(){
    for(const p of prompts.values()){clearTimeout(p.timer);p.dialog?.remove()}
    current=null;prompts.clear();
    for(const s of sent.values())clearTimeout(s.timer);
    sent.clear();actor=accessSession;
  }
  function devices(){return familyActor()?allowedDevices().filter(d=>Date.now()-d.seen<90000):[]}
  function names(){return Array.from(new Set(devices().map(d=>d.name)))}
  function forget(id,cancel=true){
    const s=sent.get(id);if(!s)return;
    clearTimeout(s.timer);sent.delete(id);
    if(cancel&&s.actor===accessSession)for(const d of s.targets)send('etm-game-invite-19',{to:d.id,name:d.name,id,kind:'cancel'});
  }
  async function invite(name,visit,update,onJoin){
    if(actor!==accessSession)reset();const targets=devices().filter(d=>d.name===name);
    if(!targets.length||!memberKeys){update('Waiting for '+name+' to come online. You can also share the link.');return}
    const id=crypto.randomUUID(),s={actor:accessSession,targets,update,onJoin,name,declined:new Set()};sent.set(id,s);
    update('Waiting for delivery to '+name+'…');
    s.timer=setTimeout(()=>{forget(id);update('No reply from '+name+'. Invite again or share the link.')},90000);
    try{
      for(const d of targets){
        const iv=crypto.getRandomValues(new Uint8Array(12));
        const box=await crypto.subtle.encrypt({name:'AES-GCM',iv},await letterKey(d.key),new TextEncoder().encode(visit));
        if(sent.get(id)!==s||accessSession!==s.actor)return;
        await send('etm-game-invite-19',{to:d.id,name,id,kind:'offer',key:memberKeys.public,iv:b64(iv),box:b64(box)});
      }
    }catch{forget(id);update('Couldn’t deliver the invitation. Try again or share the link.')}
    return id;
  }
  // Reuse the family connection for named games, including its offline-tolerant relay.
  // Sequence and acknowledge moves since a direct path and a relay can both deliver.
  const channels=new Map();
  async function channel(id,other){
    const key=await letterKey(other.key),session=accessSession,queue=new Map(),inbox=new Map(),events={};
    let next=1,received=0,chain=Promise.resolve(),rx=Promise.resolve();
    const wire={open:true,family:true,remoteName:other.name,on(type,fn){(events[type]??=[]).push(fn)},
      send(data){
        if(!wire.open||queue.size>=48)throw Error('Family connection is busy.');
        const n=next++;queue.set(n,null);
        chain=chain.then(async()=>{
          const iv=crypto.getRandomValues(new Uint8Array(12));
          const box=await crypto.subtle.encrypt({name:'AES-GCM',iv},key,new TextEncoder().encode(JSON.stringify(data)));
          if(!wire.open)return;
          const frame={kind:'frame',n,iv:b64(iv),box:b64(box)};queue.set(n,frame);post(frame);
        }).catch(()=>wire.close());
      },
      close(tell=true){
        if(!wire.open)return;if(tell)post({kind:'end'});wire.open=false;clearInterval(timer);
        channels.delete(id);queue.clear();inbox.clear();emit('close');
      },
      take(b){
        if(!wire.open||b.from!==other.id||b.name!==other.name||session!==accessSession)return;
        const d=b.data;
        if(d.kind==='end'){wire.close(false);return}
        if(d.kind==='ack'&&Number.isSafeInteger(d.n)&&d.n<next){for(const n of queue.keys())if(n<=d.n)queue.delete(n);return}
        if(d.kind!=='frame'||!Number.isSafeInteger(d.n)||d.n<1||d.n>received+64||typeof d.box!=='string'||d.box.length>145000)return;
        rx=rx.then(async()=>{
          if(!wire.open)return;
          if(d.n>received&&!inbox.has(d.n)){
            const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(d.iv)},key,unb64(d.box));
            inbox.set(d.n,JSON.parse(new TextDecoder().decode(bytes)));
          }
          while(wire.open&&inbox.has(received+1)){const n=++received,data=inbox.get(n);inbox.delete(n);emit('data',data)}
          if(wire.open)post({kind:'ack',n:received});
        }).catch(()=>wire.close());
      }
    };
    function emit(t,...args){for(const fn of events[t]||[])fn(...args)}
    function post(frame){if(session===accessSession)send('etm-game-data-19',{...frame,to:other.id,name:other.name,id})}
    channels.set(id,wire);
    const timer=setInterval(()=>{if(session!==accessSession){wire.close(false);return}for(const frame of queue.values())if(frame)post(frame)},4000);
    return wire;
  }
  async function receive(b){
    const d=b.data,session=accessSession;
    if(!familyActor()||!['dad','child'].includes(b.role)||d.to!==me||d.name!==session.name||typeof d.id!=='string'||d.id.length!==36||Date.now()-b.at>90000)return;
    if(b.topic==='etm-game-data-19'){channels.get(d.id)?.take(b);return}
    const key=b.from+'/'+d.id;
    if(d.kind==='cancel'){close(key);return}
    if(d.kind==='seen'||d.kind==='joining'||d.kind==='later'){
      const s=sent.get(d.id);
      if(s?.actor!==session||!s.targets.some(p=>p.id===b.from&&p.name===b.name))return;
      if(d.kind==='later'){s.declined.add(b.from);if(s.declined.size!==s.targets.length)return}
      s.update(d.kind==='seen'?b.name+' can see your invitation.':d.kind==='joining'?b.name+' tapped Join. Connecting…':b.name+' chose Not now.');
      if(d.kind==='joining')s.onJoin?.(d.id,s.targets.find(p=>p.id===b.from));
      if(d.kind!=='seen')forget(d.id,d.kind==='joining');
      return;
    }
    if(d.kind!=='offer'||typeof d.box!=='string'||d.box.length>512||prompts.has(key))return;
    try{
      const clear=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(d.iv)},await letterKey(d.key),unb64(d.box));
      if(accessSession!==session)return;
      const visit=new TextDecoder().decode(clear),info=window.ETMFriends.describe(visit);if(!info)return;
      const reply=kind=>{if(session===accessSession)send('etm-game-invite-19',{to:b.from,name:b.name,id:d.id,kind})};
      prompt(key,{title:b.name+' invites you to '+info.title,text:'Play together on your own screens.',yes:info.yes,
        options:info.options,shown:()=>reply('seen'),accept:()=>{reply('joining');window.ETMFriends.joinVisit(visit,{id:b.from,name:b.name,key:d.key},d.id)},decline:()=>reply('later')});
    }catch{/* A different family device cannot open this invitation. */}
  }
  setInterval(()=>{if(actor!==accessSession)reset()},500);
  return {prompt,close,reset,names,invite,forget,receive,channel};
})();
