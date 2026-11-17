// A sheet belongs to both players. Each square has an independent revision so
// simultaneous edits on different lines survive delivery in either order.
window.ETMEquations = (() => {
  const width=12, maxLines=16;
  const keys=Array.from('1234567890+−×÷=().□');
  const valid=ETM_CORE.validPaper;
  function mount(parent,teacher,send,onPoint){
    const cells=new Map(), squares=[],history=[];
    let rows=4, selected=0,clock=0,reading=false;
    const snapshot=()=>({rows,cells:Array.from(cells.values())});
    node('p','Tap a square, then a number or sign. Or drag a tile onto the paper.',parent,'paperTip');
    const toolbar=node('div',undefined,parent,'paperTools');
    const view=btn('See full working',()=>{reading=!reading;paint()},toolbar,'lPill');
    let pointing=false,pointed=null;
    const point=onPoint&&btn('Point to a square',()=>{
      pointing=!pointing;point.setAttribute('aria-pressed',String(pointing));
      point.textContent=pointing?'Tap the square to point':'Point to a square';
    },toolbar,'lPill');
    function highlight(i){
      if(!Number.isInteger(i)||i<0||i>=squares.length)return;
      pointed?.classList.remove('duoPoint');pointed=squares[i];pointed.classList.add('duoPoint');
    }
    const undo=btn('Undo my last edit',()=>{
      const previous=history.pop();if(!previous)return;
      selected=previous.index;write(previous.index,previous.value,false);
    },toolbar,'lPill');
    const scroll=node('div',undefined,parent,'paperScroll');
    const grid=node('div',undefined,scroll,'mathPaperGrid');
    const palette=node('div',undefined,parent,'paperTiles');
    const actions=node('div',undefined,parent,'paperTools');
    function choose(i){selected=i;paint()}
    function write(index,value,remember=true){
      if(carrying&&remember&&/^[0-9]$/.test(value)){value='⁰¹²³⁴⁵⁶⁷⁸⁹'[Number(value)];carrying=false;carry.textContent='Carry digit';carry.setAttribute('aria-pressed','false')}
      const old=cells.get(index);
      if((old?.[1]||'')!==value){
        const entry=[index,value,++clock,teacher?1:0];cells.set(index,entry);
        if(remember)history.push({index,value:old?.[1]||'',entry});
        send(snapshot());
      }
      selected=value?Math.min(index+1,rows*width-1):index;paint();
    }
    function nextLine(){
      const target=(Math.floor(selected/width)+1)*width+(guide?2:0);
      if(target>=maxLines*width)return;
      if(target>=rows*width){rows++;send(snapshot())}
      choose(target);squares[target].focus();
    }
    for(const key of keys){
      const tile=btn(key,()=>{if(!suppress)write(selected,key)},palette,'mathTile');
      if(key==='□')tile.setAttribute('aria-label','Unknown number');
      let start=null,suppress=false;
      tile.onpointerdown=e=>{
        if(e.button!==0)return;
        start=[e.clientX,e.clientY];suppress=false;tile.setPointerCapture(e.pointerId);
      };
      const target=e=>document.elementFromPoint(e.clientX,e.clientY)?.closest('.paperSquare');
      tile.onpointermove=e=>{
        if(!start)return;
        if(Math.hypot(e.clientX-start[0],e.clientY-start[1])<6&&!suppress)return;
        suppress=true;grid.querySelector('.dropHere')?.classList.remove('dropHere');
        const hit=target(e);if(hit&&grid.contains(hit))hit.classList.add('dropHere');
      };
      tile.onpointerup=e=>{
        if(!start)return;
        const hit=target(e);
        if(hit&&grid.contains(hit)){suppress=true;write(Number(hit.dataset.index),key)}
        start=null;grid.querySelector('.dropHere')?.classList.remove('dropHere');
        setTimeout(()=>{suppress=false},0);
      };
      tile.onpointercancel=()=>{start=null;grid.querySelector('.dropHere')?.classList.remove('dropHere')};
    }
    let carrying=false;
    const carry=btn('Carry digit',()=>{carrying=!carrying;carry.textContent=carrying?'Choose a carry digit':'Carry digit';carry.setAttribute('aria-pressed',String(carrying))},actions,'lPill');
    btn('Answer line',()=>{
      const start=guide?Math.floor(selected/width)*width+1:Math.min(selected,Math.floor(selected/width)*width+width-3);
      for(let i=start;i<start+3;i++)write(i,'━');
    },actions,'lPill');
    btn('Erase square',()=>write(selected,''),actions,'lPill');
    const columns=btn('Tens and units',()=>{
      const line=Math.floor(selected/width);
      selected=line*width+2;guide=!guide;columns.setAttribute('aria-pressed',String(guide));paint();
    },actions,'lPill');
    let guide=false;
    const next=btn('Next line ↓',nextLine,actions,'lPill');
    function paint(){
      while(squares.length<rows*width){
        const i=squares.length,b=btn('',()=>{
          if(pointing){highlight(i);onPoint(i);point.click();return}
          choose(i);
        },grid,'paperSquare');
        b.dataset.index=i;squares.push(b);
        b.onkeydown=e=>{
          const mapped=({'-':'−','*':'×','/':'÷',x:'×'})[e.key]||e.key;
          const offset=({ArrowLeft:-1,ArrowRight:1,ArrowUp:-width,ArrowDown:width})[e.key];
          if(e.ctrlKey||e.metaKey||e.altKey)return;
          if(keys.includes(mapped))write(i,mapped);
          else if(e.key==='Delete'||e.key==='Backspace')write(i,'');
          else if(offset)choose(Math.max(0,Math.min(rows*width-1,i+offset)));
          else if(e.key==='Enter')nextLine();else return;
          e.preventDefault();squares[selected].focus();
        };
      }
      while(history.length&&cells.get(history.at(-1).index)!==history.at(-1).entry)history.pop();
      palette.hidden=actions.hidden=undo.hidden=reading;
      grid.classList.toggle('reading',reading);
      scroll.classList.toggle('reading',reading);
      next.disabled=selected>=(maxLines-1)*width;
      undo.disabled=!history.length;view.textContent=reading?'Back to editing':'See full working';
      squares.forEach((b,i)=>{
        const value=cells.get(i)?.[1]||'';b.textContent=value;
        b.setAttribute('aria-label','Line '+(1+Math.floor(i/width))+', square '+(1+i%width)+(value?', '+value:', blank'));
        b.dataset.place=guide&&i%width===2?'Tens':guide&&i%width===3?'Units':'';
        b.disabled=reading;b.tabIndex=i===selected&&!reading?0:-1;b.classList.toggle('chosen',i===selected&&!reading);
      });
    }
    function receive(s){
      if(!valid(s))return;
      rows=Math.max(rows,s.rows);
      for(const c of s.cells){
        const old=cells.get(c[0]);clock=Math.max(clock,c[2]);
        if(!old||c[2]>old[2]||(c[2]===old[2]&&(c[3]>old[3]||c[3]===old[3]&&c[1]>old[1])))cells.set(c[0],c);
      }
      paint();
    }
    function clearPage(){
      for(const [i,c] of cells)if(c[1])cells.set(i,[i,'',++clock,teacher?1:0]);
      history.length=0;selected=0;reading=false;paint();send(snapshot());
    }
    paint();return {receive,snapshot,highlight,clearPage};
  }
  return {mount,valid};
})();
