// Move the original action into one dock. No cloned buttons or copied feedback.
(function(){
 if(typeof document==='undefined'||typeof MutationObserver==='undefined')return;
 var base=btn,candidate=null,moved=null,origin=null,dock=null,scope=null,pending=false,lastArea=null;
 var names=/^(?:Check my thinking|Check with AI|Check answer|Next\s*→|Next question(?:\s*→)?|Next little question\s*→|Next player|Finish\s*⭐|See my adventure)$/;
 function area(b){return b&&b.closest('.activityArea')}
 function valid(b){return b&&b.isConnected&&!b.hidden&&names.test((b.textContent||'').trim())&&area(b)}
 function focus(a){var target=a&&a.querySelector('.lQuestionTitle,.tutorQuestion h2,.mathQuestionCard,.ttPracticeCard,.labQuizQuestion');if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'auto'})}}
 function release(){if(moved&&moved.parentNode===dock&&origin&&origin.isConnected)origin.appendChild(moved);if(dock)dock.remove();if(scope)scope.classList.remove('hasQuestionDock');moved=origin=dock=scope=null}
 function queue(){if(pending)return;pending=true;requestAnimationFrame(function(){pending=false;sync()})}
 function sync(){
  if(!valid(candidate)){var options=Array.from(club.querySelectorAll('button')).filter(valid);candidate=options[options.length-1]||null;}
  if(!candidate){release();var a=club.querySelector('.activityArea');if(a&&a!==lastArea){lastArea=a;focus(a)}return;}
  if(moved===candidate&&dock&&dock.isConnected)return;
  var b=candidate,a=area(b);release();candidate=b;scope=a;origin=b.parentNode;
  dock=node('div',undefined,a,'questionDock');dock.setAttribute('aria-label','Question controls');
  Object.assign(dock.style,{position:'fixed',left:'50%',transform:'translateX(-50%)',bottom:'12px',width:'min(900px, calc(100% - 28px))',zIndex:'150',display:'flex',justifyContent:'flex-end'});
  dock.appendChild(b);moved=b;a.classList.add('hasQuestionDock');
  if(!b.dataset.questionDockBound){b.dataset.questionDockBound='true';b.addEventListener('click',function(){queue();if(document.activeElement&&/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName))document.activeElement.blur()});}
  if(a!==lastArea){lastArea=a;focus(a)}
 }
 btn=function(text,fn,parent,cls){var b=base(text,fn,parent,cls);if(names.test(String(text).trim())){candidate=b;queue()}return b};
 new MutationObserver(queue).observe(club,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden','disabled']});queue();
})();
