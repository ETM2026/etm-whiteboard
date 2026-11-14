// A single viewport action dock for practice screens. Real buttons keep their
// handlers; the dock mirrors only the active check/next action, never advances on a timer.
(function(){
 if(typeof document==='undefined'||typeof MutationObserver==='undefined')return;
 var originalBtn=btn,source=null,dock=null,proxy=null,scope=null,scheduled=false,lastQuestion=null,summary=null,mirrored=null;
 var action=/^(?:Check my thinking|Check with AI|Next\s*→|Next question(?:\s*→)?|Next little question\s*→|Next player|Finish\s*⭐|See my adventure)$/;
 function label(b){return (b.textContent||'').trim()}
 function eligible(b){return b&&b.isConnected&&!b.hidden&&!b.classList.contains('questionDockButton')&&action.test(label(b))&&b.closest('.activityArea')}
 function focusQuestion(area){area=area||scope;if(!area)return;var target=area.querySelector('.tutorQuestion h2,.mathQuestionCard,.ttPracticeCard,.labQuizQuestion')||area.querySelector('h2,h3')||area;target.setAttribute('tabindex','-1');target.focus({preventScroll:true});target.scrollIntoView({block:'start',behavior:'auto'});}
 function position(){if(!dock)return;var v=window.visualViewport,keyboard=v?Math.max(0,window.innerHeight-v.height-v.offsetTop):0;dock.style.bottom=(keyboard+12)+'px';}
 function clear(){if(mirrored)mirrored.classList.remove('questionDockSource');mirrored=null;if(dock)dock.remove();if(scope)scope.classList.remove('hasQuestionDock');dock=proxy=source=scope=summary=null;}
 function queue(){if(scheduled)return;scheduled=true;requestAnimationFrame(function(){scheduled=false;sync()})}
 function sync(){
  if(!eligible(source)){
   var candidates=Array.from(club.querySelectorAll('button')).filter(eligible);source=candidates[candidates.length-1]||null;
  }
  if(!source){var area=club.querySelector('.activityArea');clear();if(area&&area!==lastQuestion&&area.querySelector('.tutorQuestion,.mathQuestionCard,.ttPracticeCard,.labQuizQuestion')){lastQuestion=area;focusQuestion(area);}return;}
  var nextScope=source.closest('.activityArea'),changed=nextScope!==scope;
  if(changed){clear();scope=nextScope;var candidates=Array.from(scope.querySelectorAll('button')).filter(eligible);source=candidates[candidates.length-1];if(!source)return;dock=node('div',undefined,scope,'questionDock');dock.setAttribute('aria-label','Question controls');summary=node('span','',dock,'questionDockFeedback');summary.setAttribute('aria-hidden','true');proxy=originalBtn(label(source),function(){if(!eligible(source)||source.disabled)return;var oldScope=scope,wasNext=/^(Next|Finish|See my)/.test(label(source));if(document.activeElement&&/^(INPUT|TEXTAREA)$/.test(document.activeElement.tagName))document.activeElement.blur();source.click();queue();if(wasNext)requestAnimationFrame(function(){var current=club.querySelector('.activityArea');if(current&&current!==oldScope)focusQuestion(current)})},dock,'primaryButton questionDockButton');scope.classList.add('hasQuestionDock');}
  if(mirrored!==source){if(mirrored)mirrored.classList.remove('questionDockSource');mirrored=source;source.classList.add('questionDockSource');}
  if(proxy.textContent!==label(source))proxy.textContent=label(source);if(proxy.disabled!==source.disabled)proxy.disabled=source.disabled;
  var feedback=scope.querySelector('.tutorFeedback,.ttPracticeFeedback')||club.querySelector('#clubFeedback'),message=feedback?(feedback.textContent||'').trim():'';if(summary.textContent!==message)summary.textContent=message;if(summary.hidden!==!message)summary.hidden=!message;
  position();
  if(changed&&scope!==lastQuestion){lastQuestion=scope;focusQuestion();}
 }
 btn=function(text,fn,parent,cls){var b=originalBtn(text,fn,parent,cls);if(action.test(String(text).trim())){source=b;queue();}return b;};
 new MutationObserver(queue).observe(club,{subtree:true,childList:true,attributes:true,attributeFilter:['disabled','hidden']});
 window.addEventListener('resize',position);if(window.visualViewport)window.visualViewport.addEventListener('resize',position);
 queue();
})();
