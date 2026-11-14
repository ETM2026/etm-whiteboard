// No model-authored text is ever shown to a child. Homework hints never contain worked answers.
export const TOPICS = {
 add:{name:'Addition',stages:['Within twenty','Tens and units','Hundreds'],next:'sub',hints:['Split each number into tens and units. What parts do you have?','Try drawing groups of ten and loose counters. Can you join matching groups?','If the units make another ten, exchange them for a ten before combining the parts.']},
 sub:{name:'Subtraction',stages:['Small differences','Exchanging a ten','Hundreds'],next:'times',hints:['Which number are you starting with, and what are you taking away?','Draw tens and units. Can you take away the units you need?','You can exchange a ten for loose units. Keep the total value the same.']},
 times:{name:'Multiplication',stages:['Twos, fives and tens','Threes, fours and sixes','Facts to twelve'],next:'divide',hints:['How many equal groups are there? How many are in each group?','Draw an array: equal rows with the same number of dots in every row.','Think of a nearby multiplication fact you already know. How can it help?']},
 divide:{name:'Division',stages:['Sharing small groups','Related times tables','Larger equal groups'],next:'fraction',hints:['Are you sharing into equal groups or finding how many groups fit?','Draw the items and share them fairly. Check that each group is equal.','Which multiplication fact could help you check your sharing?']},
 place:{name:'Place value',stages:['Tens','Hundreds','Thousands'],next:'add',hints:['Look at the position of the digit. What place is it in?','Draw a place-value chart and put each digit in its own column.','A digit’s value depends on its column. Can you explain the difference?']},
 fraction:{name:'Fractions',stages:['Halves of groups','Quarters of groups','Thirds and fifths'],next:'divide',hints:['What is the whole? How many equal parts is it split into?','Draw the whole, then share it into equal groups.','The bottom number tells you how many equal parts make the whole. Which parts do you need?']},
 clock:{name:'Time',stages:['Hours and half hours','Quarter hours','Five-minute steps'],next:'add',hints:['Start with the hour. Which hour has the short hand passed?','Count the minutes separately from the hour.','Use a clock face and move the minute hand in equal steps.']}
} as const;
export type Topic=keyof typeof TOPICS;
export const topicValid=(s:unknown):s is Topic=>typeof s==='string'&&Object.hasOwn(TOPICS,s);
export type Question={topic:Topic;level:number;a:number;b:number;label:string;answer:number;hinted:boolean;attempts:number};
function random(n:number){return crypto.getRandomValues(new Uint32Array(1))[0]%n;}
export function question(topic:Topic,level:number,blocked:number[]=[],exercises:{topic:string;a:number;b:number}[]=[]):Question{
 for(let tryNo=0;tryNo<500;tryNo++){
  let a=0,b=0,answer=0,label='';const max=[20,99,999][level];
  if(topic==='add'||topic==='sub'){a=1+random(topic==='add'?max-1:max);b=1+random(topic==='sub'?a:max-a);answer=topic==='add'?a+b:a-b;label=a+(topic==='add'?' + ':' − ')+b+' = ?';}
  if(topic==='times'||topic==='divide'){const ts=level===0?[2,5,10]:level===1?[3,4,6]:[7,8,9,11,12];b=ts[random(ts.length)];const factor=1+random(12);a=topic==='divide'?b*factor:factor;answer=topic==='divide'?factor:a*b;label=a+(topic==='divide'?' ÷ ':' × ')+b+' = ?';}
  if(topic==='place'){const p=[10,100,1000][level];b=1+random(9);a=b*p+random(p);answer=b*p;label='In '+a+', what is the value of the digit in the '+['tens','hundreds','thousands'][level]+' place?';}
  if(topic==='fraction'){b=level===0?2:level===1?4:[3,5][random(2)];answer=1+random(12);a=b*answer;label='What is one '+({2:'half',3:'third',4:'quarter',5:'fifth'} as Record<number,string>)[b]+' of '+a+'?';}
  if(topic==='clock'){a=1+random(12);b=(level===0?[0,30]:level===1?[15,45]:[5,10,20,25,35,40,50,55])[random(level===0||level===1?2:8)];answer=a*60+b;label='Write '+(b===0?a+" o’clock":b===30?'half past '+a:b===15?'quarter past '+a:b===45?'quarter to '+(a===12?1:a+1):b+' minutes past '+a)+' as hours:minutes.';}
  // Exclude original homework operands AND calculated answers from generated practice.
  if(blocked.includes(a)||blocked.includes(b)||blocked.includes(answer))continue;
  if(exercises.some(e=>e.topic===topic&&((e.a===a&&e.b===b)||(['add','times'].includes(topic)&&e.a===b&&e.b===a))))continue;
  return {topic,level,a,b,label,answer,hinted:false,attempts:0};
 }
 throw Object.assign(Error('Choose a different topic so practice stays separate from your homework.'),{status:409});
}
export function parseAnswer(s:unknown,q:Question):number|null{
 if(typeof s!=='string'||s.length>24)return null;
 if(q.topic==='clock'){const m=/^(\d{1,2}):(\d{2})$/.exec(s.trim());if(!m||+m[1]<1||+m[1]>12||+m[2]>59)return null;return +m[1]*60+(+m[2]);}
 if(!/^\d{1,6}$/.test(s.trim()))return null;return +s.trim();
}
export function publicQuestion(q:Question){return {topic:q.topic,level:q.level,label:q.label,hinted:q.hinted};}
export function skillSummary(rows:any[]){return Object.keys(TOPICS).map(t=>{
 const levels=[0,1,2].map(level=>{const rs=rows.filter(r=>r.topic===t&&r.level===level),ind=rs.filter(r=>r.independent&&r.correct),days=new Set(ind.map(r=>new Date(r.at).toISOString().slice(0,10))),rate=rs.length?ind.length/rs.length:0;
 const secure=ind.length>=6&&rate>=.8&&days.size>=2;const last=rs.reduce((a,r)=>Math.max(a,r.at),0);
 return {level,attempts:rs.length,independent:ind.length,hints:rs.filter(r=>r.hinted).length,retries:rs.filter(r=>r.retried).length,guessed:rs.filter(r=>r.confidence==='guess').length,secure,due:!!last&&Date.now()-last>3*86400000,last};});
 const first=levels.find(x=>!x.secure);return {topic:t,name:TOPICS[t as Topic].name,levels,recommendedLevel:first?.level??2,next:first?TOPICS[t as Topic].stages[first.level]:TOPICS[TOPICS[t as Topic].next as Topic].name};
});}

