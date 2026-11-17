// The laptop keeps its original store. A phone with unrelated data gets a fresh local cache.
const homeService='https://etm-maths-ai.doyletommy2020.workers.dev';
async function homePost(path,body){
  const response=await fetch(homeService+'/'+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),cache:'no-store',signal:AbortSignal.timeout(18000)});
  const result=await response.json();
  if(!response.ok)throw Error(result.error||'Family sign-in is unavailable.');
  return result;
}
async function homeKeys(pin,salt){
  const input=new TextEncoder();
  const source=await crypto.subtle.importKey('raw',input.encode(pin),'PBKDF2',false,['deriveBits']);
  const bits=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',salt:input.encode('ETM family home v1 '+salt),iterations:310000,hash:'SHA-256'},source,512));
  const key=await crypto.subtle.importKey('raw',bits.slice(0,32),'AES-GCM',false,['encrypt','decrypt']);
  const proof=url64(bits.slice(32));
  return {key,proof,verifier:url64(await crypto.subtle.digest('SHA-256',input.encode(proof)))};
}
if(accessManifest&&!visitProfile){homePost('home-status',{}).then(async status=>{if(status.salt&&accessManifest){window.ETMHome.stale=status.salt!==await fingerprint(accessManifest.root.pub)||status.revision>accessManifest.revision}}).catch(()=>{})}
let homeOwner=null, homeBusy=false, homeDone=0;
async function publishHome(){
  const owner=homeOwner;
  if(!owner||owner.session!==accessSession||!dadUnlocked()){homeOwner=null;return}
  if(homeBusy||homeDone===accessManifest.revision)return;
  homeBusy=true;
  try{
    const manifest=copyObject(accessManifest), iv=crypto.getRandomValues(new Uint8Array(12));
    const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},owner.keys.key,new TextEncoder().encode(JSON.stringify(manifest)));
    const data={revision:manifest.revision,salt:owner.salt,verifier:owner.keys.verifier,box:b64(iv)+'.'+b64(cipher)};
    data.visits=[];
    for(const name of FAMILY){
      if(!manifest.children[name])continue;
      const publicEntry=c=>({pub:c.pub,epoch:c.epoch,history:c.history});
      const visible=c=>JSON.parse(JSON.stringify(publicEntry(c)));
      const partial={v:9,family:manifest.family,revision:manifest.revision,root:visible(manifest.root),children:{}};
      if(typeof manifest.root.friendChat==='boolean')partial.root.friendChat=manifest.root.friendChat;
      for(const [person,c] of Object.entries(manifest.children))partial.children[person]=person===name?c:visible(c);
      partial.sig=await signature(owner.session.key,manifestBody(partial));
      data.visits.push({name,manifest:partial});
    }
    const body={path:'home-publish',name:'Dad',role:'dad',epoch:owner.session.epoch,family:accessRoom,at:Date.now(),nonce:crypto.randomUUID(),data};
    await homePost(body.path,{body,sig:await signature(owner.session.key,body)});
    homeDone=manifest.revision;window.ETMHome.ready=true;
    if(!localStorage.getItem('etmHomePublished')){localStorage.setItem('etmHomePublished','1');notice('Family sign-in is ready. Everyone can use the usual ETM address.')}
  }catch{ /* Retry while Dad is signed in. */ }finally{homeBusy=false}
}
window.ETMHome={
  async remember(pin,session){
    const salt=await fingerprint(accessManifest.root.pub),keys=await homeKeys(pin,salt);
    if(accessSession!==session)return;
    homeOwner={session,salt,keys};homeDone=0;await publishHome();
  },
  async join(){
    const a=accessDialog('Welcome to your family'),input=node('input',undefined,a,'pinInput');
    node('p','Dad signs in once on this device. Then everyone uses their own PIN.',a);
    input.type='password';input.inputMode='numeric';input.autocomplete='off';input.placeholder='Dad’s existing PIN';input.maxLength=8;
    const status=node('p','',a,'formError');
    const go=btn('Connect this device',async()=>{
      if(!/^\d{4,8}$/.test(input.value)){status.textContent='Enter Dad’s PIN.';return}
      go.disabled=true;
      try{
        const {salt}=await homePost('home-status',{});
        if(!salt)throw Error('First open ETM as Dad on the laptop with your pieces.');
        const keys=await homeKeys(input.value,salt);input.value='';
        const {box}=await homePost('home-open',{proof:keys.proof});
        const [iv,cipher]=box.split('.');
        const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(iv)},keys.key,unb64(cipher));
        const m=JSON.parse(new TextDecoder().decode(plain));
        if(!await validManifest(m,m.family)||await fingerprint(m.root.pub)!==salt)throw Error('Family sign-in could not be verified.');
        if(!a.isConnected)return;
        const same=accessRoom===m.family&&accessManifest&&await fingerprint(accessManifest.root.pub)===salt&&(!readJSON('etmDataFamilyV1',null)||readJSON('etmDataFamilyV1',null)===m.family);
        const prefix=same?familyStoragePrefix:'family.'+salt+'.';
        const put=(key,value)=>window.localStorage.setItem(prefix+key,value);
        put('etmAccessV9:'+m.family,JSON.stringify(m));put('etmTrustV9:'+m.family,salt);put('etmRoom',m.family);put('etmMathsAIEndpoint:'+m.family,homeService);
        window.localStorage.setItem('ETM.activeStore',prefix);
        location.replace(location.pathname);
      }catch(error){status.textContent=error instanceof TypeError||error.name==='TimeoutError'?'ETM couldn’t reach family sign-in. Check your connection or try another network.':error.message;go.disabled=false}
    },a,'primaryButton');
    input.onkeydown=e=>{if(e.key==='Enter'&&!go.disabled)go.click()};input.focus();
  }
};
setInterval(publishHome,15000);
let finishing=false;
async function finishVisit(){
  if(finishing)return;
  finishing=true;
  if(familyActorForVisit()){
    const deadline=Date.now()+22000;
    while(familySync.busy&&Date.now()<deadline)await new Promise(r=>setTimeout(r,100));
    await syncNow();
    if(familySync.message!=='Family synced'&&!confirm('Some changes may still be on this computer. Finish and clear this visit anyway?')){finishing=false;return}
  }
  leaveVisit();
}
function familyActorForVisit(){return visitProfile&&accessSession?.role==='child'&&sessionValid(accessSession)}
function leaveVisit(){
  window.ETMPrivate?.stop();window.ETMScreen?.stop('',true);
  sessionStorage.removeItem('ETM.visitProfile');
  visitStore.clear();location.replace(location.pathname);
}
Object.assign(window.ETMHome,{
  finish:finishVisit,
  startVisit(name){sessionStorage.setItem('ETM.visitProfile',name);location.replace(location.pathname)},
  child(name){
    if(!FAMILY.includes(name)||visitProfile!==name)return;
    const card=accessDialog(name+'’s PIN'),input=node('input',undefined,card,'pinInput');
    input.type='password';input.inputMode='numeric';input.autocomplete='off';input.maxLength=4;input.placeholder='Your four numbers';input.setAttribute('aria-label',name+' PIN');
    const status=node('p','',card,'formError');
    const go=btn('Open my room',async()=>{
      if(input.value.length!==4||go.disabled)return;
      go.disabled=true;status.textContent='Opening your room…';
      const pin=input.value;input.value='';
      try{
        const challenge=await homePost('visit-salt',{name});
        const material=await crypto.subtle.importKey('raw',new TextEncoder().encode(pin),'PBKDF2',false,['deriveBits']);
        const raw=await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',iterations:210000,salt:unb64(challenge.salt)},material,256);
        const {manifest:m}=await homePost('visit-open',{name,key:b64(raw)});
        if(!await verifySignature(m.root.pub,manifestBody(m),m.sig))throw Error('Could not verify your family.');
        if(!card.isConnected)return;
        accessRoom=m.family;accessManifest=m;accessExpected=await fingerprint(m.root.pub);
        const credential=m.children[name],key=await unlockCredential(credential,pin);
        if(!card.isConnected)return;
        localStorage.setItem('etmRoom',m.family);localStorage.setItem('etmMathsAIEndpoint:'+m.family,homeService);
        learningKey='etmLearningV2:'+m.family;learningLoad();
        entrySigner=null;await ensureEntrySigner();if(!card.isConnected)return;
        publicMembers={};accessSession={name,role:'child',family:m.family,key,pub:credential.pub,epoch:credential.epoch};
        closeAccessDialog();join(m.family);selectPerson(PEOPLE.find(p=>p.n===name));syncNow();
      }catch(e){status.textContent=e.message;go.disabled=false;input.focus()}
    },card,'primaryButton');
    input.oninput=()=>{if(/^\d{4}$/.test(input.value))go.click()};input.focus();
  }
});
if(visitProfile){
  const finish=btn('Finish visit',finishVisit,appHeader,'quietButton');
  finish.setAttribute('aria-label','Finish visit and sign out');
  let lastInput=Date.now();
  for(const event of ['pointerdown','keydown','touchstart'])document.addEventListener(event,()=>{lastInput=Date.now()},{passive:true});
  setInterval(()=>{if(Date.now()-lastInput>600000)leaveVisit()},15000);
  window.addEventListener('pagehide',()=>{
    for(const db of ['etm-family-recordings','etmSantaInboxV1','etmSantaListsV1'])indexedDB.deleteDatabase(familyStoragePrefix+db);
  });
  if(visitProfile==='Guest')showGuestEntry();else window.ETMHome.child(visitProfile);
}

window.addEventListener('pageshow',event=>{if(event.persisted&&visitProfile)location.replace(location.pathname)});
const homeBeforeContinue=home;
home=function(){
  homeBeforeContinue();
  if(!pl||pl.guest)return;
  const piece=(pieceStore()[pl.n]||[]).filter(p=>p.lastPlayed).sort((a,b)=>b.lastPlayed-a.lastPlayed)[0];
  const hero=club.querySelector('.welcomeCopy');
  if(piece&&hero){
    hero.querySelector('.eyebrow')?.remove();hero.querySelector('p')?.remove();
    hero.querySelector('h2').textContent='Ready for more piano?';
    btn('Continue '+piece.title,()=>openCoach(piece),hero,'primaryButton');
  }
};
async function checkRelease(){
  if(document.hidden||document.getElementById('ETMUpdateReady'))return;
  try{
    const r=await fetch('release.json',{cache:'no-store'});
    if(!r.ok||(await r.json()).version===version)return;
    const b=btn('Update ready',()=>location.reload(),appHeader,'quietButton');b.id='ETMUpdateReady';
  }catch{}
}
document.addEventListener('visibilitychange',checkRelease);setInterval(checkRelease,300000);
