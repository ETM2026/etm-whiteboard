// One private canvas for the two devices that accepted this invitation.
// The regular whiteboard contributes a starting picture, never live session strokes.
window.ETMDraw=(()=>{
  const invites=window.ETMGameInvites, colours=['#25435a','#007b70','#c04456','#ad6322','#5950ba'];
  const W=960,H=600;
  let active=null;
  function snapshot(){
    const c=document.createElement('canvas');c.width=W;c.height=H;
    const ctx=c.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,W,H);
    ctx.drawImage(drawingSnapshot(),0,0,W,H);
    return c;
  }
  function choose(){
    if(active){active.dialog.focus();return}
    const panel=openDrawer('Draw together');
    if(!familyActor()){node('p','Choose your family profile to invite someone to draw.',panel);return}
    if(accessSession.role==='dad'){const maths=btn('Maths sheet',()=>{list.replaceChildren();const children=invites.names().filter(n=>FAMILY.includes(n));if(!children.length)node('p','Ask your child to open ETM and choose their profile.',list);for(const name of children)btn('Start maths with '+name,()=>{cleanupDrawer();window.ETMSheet.setup(name,'equations')},list,'primaryButton')},panel,'lPill')}
    node('p','Invite someone to draw on a copy of this page. You’ll both have a pen.',panel);
    const list=node('div',undefined,panel,'drawerGrid'),actor=accessSession;
    function refresh(){
      if(actor!==accessSession||!familyActor()){cleanupDrawer();return}
      list.replaceChildren();const names=invites.names();
      if(!names.length)node('p','Ask your drawing partner to open ETM and choose their name.',list);
      for(const name of names)btn('Invite '+name,()=>{const base=snapshot();cleanupDrawer();host(name,base)},list,'primaryButton');
    }
    btn('Check who’s here',refresh,panel,'quietButton');refresh();
  }
  function board(name,hostSide,base){
    const actor=accessSession,local=hostSide?0:1,remote=1-local;
    let wire,invitation,closing=false,peerFinished=false,ended=false,done=false;
    let ready=hostSide,bg=base,colour=colours[hostSide?1:2],clock=0,pen=null;
    let contact=Date.now(),pingAt=0,previewAt=0,parts=[],decodeId=0;
    let exitDialog=null,revision=0,exported=-1;
    const opener=document.activeElement,marks=[new Map(),new Map()],history=[],queue=[];
    const d=node('dialog',undefined,document.body,'etmDrawRoom');
    d.setAttribute('aria-label','Draw together with '+name);
    const top=node('div',undefined,d,'drawRoomHeading');
    node('h2','Draw together',top);
    const status=node('p',hostSide?'Inviting '+name+'…':'Opening the picture…',top);status.setAttribute('role','status');
    const cross=btn('×',requestClose,top,'duetClose');cross.setAttribute('aria-label','Close Draw Together');
    const paperArea=node('div',undefined,d,'duetPaperArea');
    const page=node('canvas',undefined,paperArea,'duetCanvas');page.width=W;page.height=H;page.setAttribute('aria-label','Shared drawing paper');
    const tools=node('div',undefined,d,'duetTools');
    const swatches=node('div',undefined,tools,'duetColours');
    for(const [i,c] of colours.entries()){
      const b=btn('',()=>{colour=c;for(const s of swatches.children)s.setAttribute('aria-pressed',String(s===b))},swatches);
      b.style.setProperty('--ink',c);b.setAttribute('aria-label',['Navy','Teal','Berry','Ochre','Purple'][i]+' pen');b.setAttribute('aria-pressed',String(c===colour));
    }
    const undo=btn('Undo my stroke',()=>{
      if(closing||ended||!history.length)return;
      finishPen();revision++;const id=history.pop();marks[local].delete(id);push({t:'undo',id});paint();
    },tools,'quietButton');
    function savePicture(afterSave){
      const at=revision;
      page.toBlob(blob=>{
        if(done||actor!==accessSession)return;
        if(!blob){notice('The picture could not be saved. Try again.');return}
        const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='ETM-drawing-together.png';a.click();
        setTimeout(()=>URL.revokeObjectURL(url),60000);exported=at;afterSave?.();
      },'image/png');
    }
    const copy=btn('Keep a copy',()=>savePicture(),tools,'quietButton');
    const finish=btn('Finish',complete,tools,'primaryButton');
    const retry=btn('Invite again',requestInvite,tools,'primaryButton');retry.hidden=true;
    function requestClose(){
      finishPen();
      if(!marks[0].size&&!marks[1].size||exported===revision){dispose();return}
      if(exitDialog)return;
      const box=exitDialog=node('dialog',undefined,d,'duetExit');
      box.setAttribute('aria-label','Close this drawing?');
      node('h2','Close this drawing?',box);
      node('p',!ended&&wire&&(!navigator.onLine||queue.length||wire.pending)?'Some marks may still be sending. You can keep the picture on this screen.':'You can keep a picture before you leave.',box);
      const stay=()=>{box.close();box.remove();exitDialog=null;cross.focus()};
      const back=btn('Back to drawing',stay,box,'primaryButton');
      btn('Keep a copy and close',()=>savePicture(()=>{if(exitDialog===box)dispose()}),box,'quietButton');
      btn('Close without saving',dispose,box,'quietButton');
      box.oncancel=e=>{e.preventDefault();stay()};box.showModal();back.focus();
    }
    d.oncancel=e=>{if(e.target===d){e.preventDefault();requestClose()}};
    // Fit the same whole sheet on both screens. Resize only its display, so
    // rotating a tablet never clears the canvas or moves existing strokes.
    function fitPaper(){
      const width=Math.min(paperArea.clientWidth,paperArea.clientHeight*W/H);
      if(width>0)page.style.width=width+'px';
    }
    const nativeFit=window.CSS?.supports('width','1cqw');
    const observer=!nativeFit&&window.ResizeObserver?new window.ResizeObserver(fitPaper):null;
    d.showModal();finish.focus();
    if(!nativeFit){fitPaper();if(observer)observer.observe(paperArea);else window.addEventListener('resize',fitPaper)}
    function paint(){
      const ctx=page.getContext('2d');ctx.fillStyle='white';ctx.fillRect(0,0,W,H);if(bg)ctx.drawImage(bg,0,0,W,H);
      const ordered=[...marks[0].values(),...marks[1].values()].sort((a,b)=>a.id-b.id||a.side-b.side);
      for(const s of ordered){
        const p=s.p;ctx.strokeStyle=ctx.fillStyle=s.c;ctx.lineWidth=5;ctx.lineCap=ctx.lineJoin='round';
        if(p.length===2){ctx.beginPath();ctx.arc(p[0],p[1],2.5,0,2*Math.PI);ctx.fill();continue}
        ctx.beginPath();ctx.moveTo(p[0],p[1]);for(let n=2;n<p.length;n+=2)ctx.lineTo(p[n],p[n+1]);ctx.stroke();
      }
      undo.disabled=!history.length||closing||ended;copy.disabled=!ready;
    }
    function push(m){queue.push(m);flush()}
    function flush(){
      if(!wire?.open||done||actor!==accessSession)return;
      while(queue.length&&wire.pending<6){wire.send(queue[0]);queue.shift()}
    }
    function position(e){const r=page.getBoundingClientRect();return [Math.min(W,Math.max(0,Math.round((e.clientX-r.left)*W/r.width))),Math.min(H,Math.max(0,Math.round((e.clientY-r.top)*H/r.height)))]}
    function delta(){
      if(!pen)return;
      // Each update contains only the additional points. Final ink is kept through outages.
      const p=pen.mark.p.slice(pen.offset);if(!p.length)return;
      push({t:'ink',id:pen.mark.id,c:pen.mark.c,p});pen.offset=pen.mark.p.length;previewAt=Date.now();
    }
    function finishPen(){if(!pen)return;delta();pen=null}
    page.onpointerdown=e=>{
      if(!ready||closing||ended||pen||e.button!==0)return;e.preventDefault();
      const m={id:++clock,side:local,c:colour,p:position(e)};revision++;marks[local].set(m.id,m);history.push(m.id);
      pen={pointer:e.pointerId,mark:m,offset:0};page.setPointerCapture(e.pointerId);delta();paint();
    };
    page.onpointermove=e=>{
      if(!pen||pen.pointer!==e.pointerId)return;const xy=position(e),p=pen.mark.p;
      if(p.at(-2)===xy[0]&&p.at(-1)===xy[1])return;
      p.push(...xy);revision++;if(Date.now()-previewAt>=140||p.length-pen.offset>=256)delta();paint();
    };
    page.onpointerup=page.onpointercancel=page.onlostpointercapture=e=>{if(pen?.pointer===e.pointerId)finishPen()};
    function receive(m){
      if(!m||done||actor!==accessSession)return;contact=Date.now();
      if(m.t==='background'&&!hostSide&&!ready&&parts.length<100&&typeof m.part==='string'&&m.part.length<=16000){parts.push(m.part);return}
      if(m.t==='paper'&&!hostSide&&!ready){
        const img=new Image(),generation=++decodeId;img.onload=()=>{if(done||generation!==decodeId)return;bg=img;ready=true;paint();label()};
        img.onerror=()=>{if(!done)status.textContent='Could not open the starting picture. Leave and invite again.'};
        const src=parts.join('');parts=[];if(src.startsWith('data:image/jpeg;base64,'))img.src=src;return;
      }
      if(m.t==='ink'&&Number.isSafeInteger(m.id)&&m.id>0&&colours.includes(m.c)&&Array.isArray(m.p)&&m.p.length>=2&&m.p.length<=512&&m.p.length%2===0&&m.p.every((n,i)=>Number.isInteger(n)&&n>=0&&n<=(i%2?H:W))){
        let s=marks[remote].get(m.id);if(!s){s={id:m.id,side:remote,c:m.c,p:[]};marks[remote].set(m.id,s);clock=Math.max(clock,m.id)}
        s.p.push(...m.p);revision++;paint();
      }else if(m.t==='undo'){if(marks[remote].delete(m.id))revision++;paint()}
      else if(m.t==='finish'){peerFinished=true;if(!closing)complete();label()}
    }
    function bind(w){
      if(done||actor!==accessSession){w.close();return}
      retry.hidden=true;wire=w;contact=Date.now();w.on('data',receive);w.on('close',()=>{if(!done){finishPen();ended=true;label();paint()}});
      if(hostSide){
        const data=base.toDataURL('image/jpeg',.86),initial=[],paper=new Image();
        paper.onload=()=>{if(!done){bg=paper;paint()}};paper.src=data;
        for(let n=0;n<data.length;n+=16000)initial.push({t:'background',part:data.slice(n,n+16000)});
        queue.unshift(...initial,{t:'paper'});
      }
      flush();label();
    }
    function label(){
      if(ended){status.textContent=peerFinished?'Drawing finished. Keep a copy of your picture.':'The other device left. You can still keep this picture.';finish.hidden=true;return}
      if(closing){status.textContent='Finishing · waiting for both pictures to match…';return}
      if(!wire)return;
      if(Date.now()-contact>8500||navigator.onLine===false){status.textContent='Reconnecting to '+name+' · keep drawing';return}
      status.textContent=ready?'Drawing with '+name:'Opening the picture…';
    }
    function complete(){
      if(ended||closing)return;retry.hidden=true;finishPen();closing=true;paint();finish.disabled=true;
      if(!wire){if(invitation)invites.forget(invitation);ended=true;status.textContent='Drawing finished. You can keep your picture.';finish.hidden=true;return}
      push({t:'finish'});label();
    }
    function dispose(){
      if(done)return;done=true;++decodeId;clearInterval(timer);
      if(observer)observer.disconnect();else if(!nativeFit)window.removeEventListener('resize',fitPaper);if(invitation)invites.forget(invitation);wire?.close();exitDialog?.remove();d.close();d.remove();if(active?.dialog===d)active=null;
      if(actor===accessSession&&opener?.isConnected)opener.focus();
    }
    const timer=setInterval(()=>{
      if(actor!==accessSession||!familyActor()){dispose();return}
      if(!wire||ended)return;flush();
      if(closing&&peerFinished&&!queue.length&&!wire.pending){ended=true;label();return}
      if(!closing&&!queue.length&&!wire.pending&&Date.now()-pingAt>2500){pingAt=Date.now();push({t:'pulse'})}
      label();
    },250);
    function report(text){
      if(done||closing||wire)return;
      status.textContent=text;retry.hidden=!hostSide||!/(No reply|Not now|Try again|come online|Invite again)/i.test(text);
    }
    async function requestInvite(){
      if(done||closing||wire||!hostSide)return;
      retry.hidden=true;if(invitation)invites.forget(invitation);
      const id=await invites.invite(name,'draw-together-v1',report,async(id,who)=>{
        if(!done&&!closing&&actor===accessSession)bind(await invites.channel(id,who));
      });
      if(done||closing){if(id)invites.forget(id)}else invitation=id;
    }
    paint();
    return active={dialog:d,bind,report,requestInvite};
  }
  function host(name,base){
    if(active||!familyActor())return;
    board(name,true,base).requestInvite();
  }
  async function joinVisit(_visit,who,id){
    if(active||!familyActor())return;
    const s=board(who.name,false,null);
    try{s.bind(await invites.channel(id,who))}catch{s.report('Could not open the drawing. Ask for a new invitation.')}
  }
  return {choose,describe:()=>active?null:{title:'Draw together',yes:'Join drawing'},joinVisit};
})();
