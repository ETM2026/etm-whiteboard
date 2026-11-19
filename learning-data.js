// Original teaching text and questions. Source links are for parents, not required network calls.
var ETM_DATA=(function(){
 var units=[];
 function unit(id,subject,title,icon,model,lesson,qs){units.push({id:id,subject:subject,title:title,icon:icon,model:model,lesson:lesson,questions:qs.map(function(q,i){return {id:id+':'+i,label:q[0],answer:q[1],others:q[2],explain:q[3],level:q[4],subject:subject,unit:id}})});}
 unit('world','geography','Our wonderful world','🌍','world',[
 'Earth has land and water. A continent is a very large area of land. Tap the shapes on our simple map.',
 'We use a seven-continent model here: Europe, Asia, Africa, North America, South America, Antarctica and Australia. A country is a smaller political area.',
 'The equator divides the Northern and Southern Hemispheres. Map drawings flatten a round Earth, so shapes and sizes can be distorted.'
 ],[
 ['Which is mostly water?','An ocean',['A mountain','A desert','A continent'],'Oceans are large connected bodies of salty water.',0],
 ['Which is a continent?','Africa',['Ireland','Sweden','Dublin'],'Africa is a continent; Ireland and Sweden are countries.',0],
 ['What shape is Earth roughly?','A ball',['A flat square','A triangle','A cube'],'Earth is nearly spherical, slightly flattened at its poles.',0],
 ['Which continent contains Ireland?','Europe',['Asia','Africa','Antarctica'],'Ireland is a country in Europe.',1],
 ['Which continent includes Brazil?','South America',['North America','Europe','Asia'],'Brazil is in South America.',1],
 ['Which continent is around the South Pole?','Antarctica',['Australia','Europe','Africa'],'Antarctica surrounds the South Pole.',1],
 ['What does the equator divide?','Northern and Southern Hemispheres',['Countries from cities','Land from sea','East from west'],'The equator is an imaginary line halfway between the poles.',2],
 ['Which is in the Southern Hemisphere?','Australia',['Ireland','Sweden','Canada'],'Australia is south of the equator.',2],
 ['Why can flat world maps look different?','A round surface must be flattened',['Earth changes shape each day','Countries swap places','North always moves'],'Different map projections distort area, shape or distance in different ways.',2]
 ]);
 unit('oceans','geography','Across the oceans','🌊','oceans',[
 'The sea connects places around the world. Find water on the map. Land and ocean are different parts of Earth.',
 'We commonly name five ocean regions: Pacific, Atlantic, Indian, Southern and Arctic. They connect as one global ocean.',
 'The Pacific is the largest ocean basin. The Atlantic lies between the Americas and Europe/Africa. The Arctic surrounds the North Pole.'
 ],[
 ['What do we call a very large area of salty water?','An ocean',['A hill','A forest','A road'],'An ocean is a large body of salty water.',0],
 ['Which can travel across an ocean?','A ship',['A bicycle on a road','A train on rails','A sled on snow'],'Ships travel on water.',0],
 ['Is a beach beside the sea?','Yes',['Only in a forest','Never','Only underground'],'A beach lies along the edge of water, often the sea.',0],
 ['Which ocean is west of Ireland?','Atlantic',['Pacific','Indian','Southern'],'Ireland faces the Atlantic to the west.',1],
 ['Which is the largest ocean basin?','Pacific',['Atlantic','Arctic','Indian'],'The Pacific is the largest ocean basin.',1],
 ['Which ocean surrounds the North Pole?','Arctic',['Indian','Southern','Atlantic'],'The Arctic Ocean is in the far north.',1],
 ['Which ocean lies between Africa and Australia?','Indian',['Arctic','Southern','Atlantic'],'The Indian Ocean lies east of Africa and west of Australia.',2],
 ['Why do we say one global ocean?','The named ocean regions connect',['Every sea has the same depth','There is only one ocean name','All water is fresh'],'The named regions form a connected body of salt water.',2],
 ['Which ocean region surrounds Antarctica?','Southern',['Arctic','Indian only','North Atlantic'],'The Southern Ocean surrounds Antarctica.',2]
 ]);
 unit('directions','geography','Map detective','🧭','compass',[
 'A map helps us find places. On this practice map, north is up. Try moving the explorer to a place.',
 'North and south are opposite directions. East and west are opposites too. Follow the compass, not how you hold the screen.',
 'A map key explains symbols. Grid references help locate places. Real maps need a north arrow; north is not always at the top.'
 ],[
 ['On our north-up map, which way is north?','Up',['Down','Left','Right'],'Our compass points north toward the top.',0],
 ['Which tool shows directions?','A compass',['A spoon','A paintbrush','A shoe'],'A compass helps identify directions.',0],
 ['What is a map useful for?','Finding places',['Making rain','Growing teeth','Cooking soup'],'Maps show where places are.',0],
 ['What is opposite north?','South',['East','West','North-east'],'North and south are opposite directions.',1],
 ['On a north-up map, which way is east?','Right',['Left','Down','Up'],'East is to the right when north is at the top.',1],
 ['What does a map key explain?','The symbols',['Tomorrow’s weather','Every person’s name','The time everywhere'],'A key tells you what a map’s symbols represent.',1],
 ['Must north always be at the top of a map?','No; check its north arrow',['Yes; on every map','Only on blue maps','Only at night'],'Maps can be rotated. Read the north arrow or compass rose.',2],
 ['What is opposite south-west?','North-east',['South-east','North-west','South'],'Opposite directions point away from each other through the centre.',2],
 ['Why use a grid reference?','To locate a particular place',['To change a country’s size','To heat a map','To choose its colour'],'A reference identifies a position in a map grid.',2]
 ]);
 unit('journeys','geography','Little world journeys','✈️','journeys',[
 'Let’s visit different countries. Ireland, Sweden, Australia and the United States are places on our map. Tap a destination.',
 'Ireland and Sweden are in Europe. Australia is both a country and the name of a continent in our model. The United States is in North America.',
 'A journey can cross countries and oceans. Places north and south of the equator can have opposite seasons; weather still varies from day to day.'
 ],[
 ['Which is a country?','Ireland',['A compass','A cloud','An ocean wave'],'Ireland is a country.',0],
 ['Which could carry people on a long journey over an ocean?','An aeroplane',['A wheelbarrow','A skateboard','A garden swing'],'Aeroplanes can cross oceans.',0],
 ['What do we call the place we are travelling to?','A destination',['A direction arrow','A wave','A cloud'],'A destination is where a journey ends.',0],
 ['Which two countries are in Europe?','Ireland and Sweden',['Australia and Ireland','United States and Australia','Sweden and Australia'],'Ireland and Sweden are both European countries.',1],
 ['The United States is on which continent?','North America',['Europe','Africa','Australia'],'The United States is in North America.',1],
 ['Is Australia south of the equator?','Yes',['No; it is at the North Pole','No; it is entirely north','Only at night'],'Australia is in the Southern Hemisphere.',1],
 ['When it is summer in Ireland, what season is it generally in Australia?','Winter',['Summer','Always spring','No seasons'],'The hemispheres have opposite seasons because of Earth’s tilt.',2],
 ['Does one hot day prove a place has a hot climate?','No; climate describes long-term patterns',['Yes; one day is enough','Only if it is Monday','Only beside a river'],'Weather describes short-term conditions; climate concerns long-term patterns.',2],
 ['Why plan a route before a journey?','To understand the path and crossings',['To make all places nearby','To stop Earth spinning','To change the oceans'],'A route helps you understand where and how you will travel.',2]
 ]);
 unit('daynight','science','Turn day into night','☀️','daynight',[
 "The dot is our home. When our side turns away from the Sun, it is night.",
 "The Sun is still shining. Earth spins, taking our home into daylight and then into darkness.",
 "Imagine two homes on the equator, halfway around Earth from each other. When one faces the Sun, the other faces away. One spin takes about a day; a trip around the Sun takes a year."
 ],[
 ['What gives Earth daylight?','The Sun',['A mountain','A cloud','A tree'],'The Sun is our main natural source of daylight.',0],
 ['When our place faces away from the Sun, is it day or night?','Night',['Always noon','Day','A rainbow'],'The side facing away receives no direct sunlight.',0],
 ['Does Earth spin?','Yes',['Only on Sundays','Never','Only when it rains'],'Earth rotates continuously.',0],
 ['What causes day and night?','Earth rotating',['The Sun switching off','Clouds hiding every place','Earth stopping'],'Rotation changes which places face the Sun.',1],
 ['About how long is one full Earth rotation?','One day',['One minute','One year','One month'],'A solar day is about twenty-four hours.',1],
 ['Does the Sun stop shining every night?','No',['Yes; everywhere','Only in winter','Only over oceans'],'Your place turns away while other places receive sunlight.',1],
 ["Two dots sit opposite each other on Earth’s equator. One faces the Sun. After half a spin, which dot faces the Sun?", "The dot that was in darkness", ["Both dots at once", "The same dot as before", "Neither dot until next year"], "Half a spin swaps which of those two places faces the Sun.", 2],
 ["A lamp is the Sun and a ball is Earth. Which test models one day?", "Keep the lamp still and spin the ball once", ["Switch the lamp off and on", "Move the ball once around the lamp without spinning it", "Move the lamp further away"], "One spin brings a marked place through daylight and darkness and back. Travelling around the Sun models a year.", 2],
 ["Two children see sunset at different times on a clear day. Which observation best explains that?", "Their homes turn away from sunlight at different times", ["The Sun stops shining once for each home", "Both homes face straight toward the Sun at sunset", "The Moon passes in front of each home every evening"], "Earth’s rotation carries different places across the edge of daylight at different times.", 2]
 ]);
 unit('water','science','A drop’s adventure','💧','water',[
 "Rain is water falling from clouds. On land it can make puddles.",
 "Some water in a puddle goes into the air as an invisible gas. This is evaporation. When the gas cools into tiny drops again, that is condensation.",
 "Liquid can evaporate without boiling. Cooling can turn invisible water vapour back into drops. To test what changes evaporation, change one thing and measure how much water is left."
 ],[
 ['Which is liquid water?','A raindrop',['A dry stone','A wooden block','A sheet of paper'],'A raindrop is liquid water.',0],
 ['What often falls from rain clouds?','Rain',['Sandwiches','Trees','Pebbles'],'Rain falls as drops of water.',0],
 ['What is frozen water called?','Ice',['Steam','Sand','Soil'],'Ice is solid water.',0],
 ['What is evaporation?','Liquid water becoming water vapour',['Water turning to stone','Clouds becoming soil','Ice turning to metal'],'Evaporation changes liquid water into gas.',1],
 ['What is condensation?','Water vapour becoming liquid drops',['Rain becoming rocks','Soil becoming air','Water becoming sunlight'],'Cooling water vapour can form liquid droplets.',1],
 ['What supplies much of the energy driving the water cycle?','The Sun',['The Moon’s colour','A map key','A compass needle'],'Solar energy helps water evaporate.',1],
 ["Drops appear outside a sealed cold bottle. Where did that water come from?", "Water vapour in the surrounding air", ["Water leaking through the sealed bottle", "The plastic changing into water", "Ice passing through the bottle wall"], "The cold surface cools nearby air, so some of its water vapour condenses into drops.", 2],
 ["Two dishes start with 50 mL of water. After a day one has 42 mL and one has 47 mL. Neither leaked. Which lost more by evaporation?", "The dish with 42 mL left", ["The dish with 47 mL left", "Both lost 5 mL", "Neither, because the water did not boil"], "The first lost 8 mL and the second lost 3 mL. Water does not have to boil to evaporate.", 2],
 ["How could you test whether moving air helps a wet cloth dry?", "Compare matching wet cloths with and without a fan at the same temperature", ["Compare a warm towel with a cold sock", "Add more water only to the cloth near the fan", "Start the fan cloth an hour earlier"], "Keep cloth, starting water, temperature and drying time alike. Then the airflow is the main difference.", 2]
 ]);
 unit('forces','science','Push, pull, roll','⚽','ramp',[
 "The ball goes down the ramp. Earth pulls it down. That pull is called gravity.",
 "Gravity pulls the ball down. On the steeper ramp, more of that pull is along the slope, so the ball picks up speed more quickly.",
 "To test the slope, change only the slope. If you also push the ball, you cannot tell which change made it quicker. Repeating each run helps you judge whether a difference is consistent."
 ],[
 ['To move a toy away from you, you might…','Push it',['Paint it','Name it','Count it'],'A push is a force that can move an object away.',0],
 ['To bring a toy toward you, you might…','Pull it',['Hide it','Sing to it','Colour it'],'A pull can bring an object closer.',0],
 ['Which way does a ball usually roll on a ramp?','Downhill',['Always uphill','Into the sky','Nowhere ever'],'Gravity helps the ball move downhill.',0],
 ['Which force pulls objects toward Earth?','Gravity',['Sunlight','A map','A musical note'],'Gravity attracts objects toward Earth.',1],
 ['In our model, what changes when the ramp gets steeper?','The ball gains speed faster',['The ball becomes alive','The ball changes colour','Gravity disappears'],'A steeper ramp increases the downhill part of gravity’s effect.',1],
 ['What can slow a sliding object on a rough surface?','Friction',['Its name','The day of the week','A rainbow'],'Friction opposes sliding motion between surfaces.',1],
 ["On the low ramp a ball takes 4 seconds, then 4 again. On the high ramp it takes 2 seconds both times. What does this support?", "This ball finished sooner on the high ramp", ["Every ball takes 2 seconds on a ramp", "The ball weighed less on the high ramp", "Gravity switched off on the low ramp"], "The same ball finished sooner in both high-ramp runs. These results describe this test.", 2],
 ["A car rolls faster on a steep wooden ramp than on a gentle carpeted ramp. Which test would tell you whether steepness mattered?", "Use the same surface at two slopes", ["Compare the same two ramps again", "Push harder on the gentle ramp", "Use two different cars on one slope"], "Keeping the surface and car the same lets you isolate the effect of the slope.", 2],
 ["Three runs take 3, 3 and 7 seconds. What should you do before deciding the usual time?", "Check what happened and repeat the runs", ["Use 7 because it is the biggest", "Pick the first time and stop", "Remove 7 without investigating"], "An unusual time could be a real variation or a measuring slip. More evidence helps you decide.", 2]
 ]);
 unit('plants','science','Help a plant grow','🌱','plants',[
 "A plant takes in water through its roots. Without enough water it can droop.",
 "Roots take in water. Leaves use light to make food for the plant. Real plants take days to show changes.",
 "Green leaves use light energy, water and carbon dioxide from the air to make sugar. A taller stem alone does not prove a plant is healthier: look at its leaves, too."
 ],[
 ['What can help a green plant grow?','Light',['A woolly hat','A toy car','A pencil case'],'Most green plants need light to grow well.',0],
 ['Which part is usually below the soil?','Roots',['Flowers','Leaves','Fruit'],'Roots anchor a plant and take up water.',0],
 ['Does a plant need some water?','Yes',['Never','Only pretend water','Only seawater'],'Plants need water, although amounts vary.',0],
 ['Which part usually takes up water from the soil?','Roots',['Petals','Seeds in a packet','Fruit skin'],'Roots absorb water from the soil.',1],
 ['Should you keep adding water without checking?','No; too much can harm plants',['Yes; more is always better','Only at night','Only if the pot is blue'],'Roots also need suitable conditions and air; overwatering can cause problems.',1],
 ['What do green leaves use light to help make?','Food for the plant',['Small stones','Plastic','Soil from nothing'],'Green plants make sugars using energy from light.',1],
 ["One plant in shade grew 4 cm but has pale leaves. Another in light grew 2 cm and has green leaves. What can you conclude?", "Height alone cannot show which plant is healthier", ["The tallest plant must be healthiest", "The shaded plant made more food for certain", "The shorter plant did not grow"], "Measure more than height. Pale leaves and a stretched stem can be signs of too little light.", 2],
 ["A sunny plant gets water every day. A shaded plant gets none. What stops this being a fair test of light?", "The amount of water also changed", ["Both plants have leaves", "They were checked on the same day", "There were two places to compare"], "If water and light both differ, either could explain a change in growth.", 2],
 ["A green plant has enough water but stays in the dark for a week. Why can stored food help only for a while?", "It needs light energy to make more sugar", ["Roots turn darkness into sugar", "Its leaves make more sugar in darkness", "Water alone replaces all the sugar it uses"], "The plant can use sugar it stored earlier, but photosynthesis needs light.", 2]
 ]);
 unit('magnets','science','Magnet mystery','🧲','magnets',[
 "One way round, the magnets pull together. Turn one around and they push apart.",
 "The ends are called poles. Two matching poles push apart. Different poles pull together, even across a small gap.",
 "Like poles repel and unlike poles attract. Distance also affects the force. If you change both the gap and the poles at once, you cannot tell which caused a difference in strength."
 ],[
 ['Can a magnet pull some objects without touching them?','Yes',['Never','Only if painted','Only in water'],'Magnetic forces can act across a gap.',0],
 ['What might a magnet attract?','An iron nail',['A wooden spoon','A paper cup','A plastic ruler'],'Iron is strongly attracted to an ordinary magnet.',0],
 ['Does turning a magnet change which pole faces the other magnet?','Yes',['Never','Only its name changes','It removes both poles'],'Turning it changes which pole is nearest.',0],
 ['What do north and south poles do when brought close?','Attract',['Always repel','Disappear','Make sunlight'],'Unlike magnetic poles attract.',1],
 ['What do two north poles do when brought close?','Repel',['Always attract','Melt','Turn into wood'],'Like magnetic poles repel.',1],
 ['Are all metals strongly attracted to an ordinary magnet?','No',['Yes; every metal','Only if shiny','Only if heavy'],'Iron is strongly attracted, but metals such as copper are not in the same way.',1],
 ["Two hidden magnet ends push apart. One end is north. What can you infer about the other?", "It is north too", ["It must be south", "It has no pole", "It must be made of wood"], "Repulsion tells you the facing poles are alike. Two north poles push apart.", 2],
 ["A magnet pulls a clip across 1 cm but not across 5 cm. What does the test show?", "The pull was enough to move this clip at the smaller gap", ["There is no magnetic force beyond 1 cm", "The clip changed metal as the gap grew", "The poles switched at the larger gap"], "Motion is evidence of enough force to move the clip. No movement does not prove there was no force.", 2],
 ["Two magnets attract. You turn both around without swapping places. What do you predict?", "They still attract", ["They now repel", "Only the left one pulls", "Both lose their poles"], "N facing S becomes S facing N. The pair is still unlike.", 2]
 ]);
 unit('floating','science','Float or sink?','⛵','floating',[
 "Watch the spoon go to the bottom. It sinks. Try the cork: it stays on top and floats.",
 "Water pushes up on both. The cork floats when that push balances its weight. The spoon sinks because the upward push is too small.",
 "Water pushes up on an object that moves water out of the way. A hollow boat can push aside enough water to support its weight. Adding a load makes it sit lower."
 ],[
 ['What does “float” mean here?','Stay at the water’s surface',['Fall to the bottom','Turn into ice','Become invisible'],'A floating object is supported at the surface.',0],
 ['Which example floats in our model?','A cork',['A solid steel spoon','A granite pebble','An iron nail'],'Cork normally floats in water.',0],
 ['What should you do before testing an idea?','Make a prediction',['Hide the result','Change every object','Decide facts cannot change'],'Predict first, then compare with what you observe.',0],
 ['Why can an empty sealed plastic bottle float?','It contains air and has low average density',['All plastic must float','It has no weight','Water cannot touch it'],'The trapped air helps lower the average density of the whole bottle.',1],
 ['Does every heavy object sink?','No',['Yes; always','Only in daytime','Only if it is long'],'Large ships can float; mass alone does not decide the result.',1],
 ['What should happen after a prediction is wrong?','Use the observation to improve your idea',['Hide it','Stop all experiments','Keep calling it correct'],'Unexpected results can help us learn.',1],
 ["A foil ball sinks. The same foil shaped into a wide boat floats. What changed?", "Its shape lets it push more water aside before flooding", ["The foil lost its weight", "The water stopped pulling down on the foil", "The foil became a different metal"], "The hollow shape can displace enough water for the upward push to balance the boat’s weight.", 2],
 ["You add a coin to a floating toy boat. It stays afloat. What do you expect to see?", "It sits lower and displaces more water", ["It sits higher because the coin is small", "It stays at exactly the same depth", "It no longer feels an upward push"], "The extra weight needs a greater upward push. The boat settles lower and pushes aside more water.", 2],
 ["A heavy sealed container floats and a light steel spoon sinks. Which rule fits both?", "Weight alone cannot tell you what will float", ["All heavy objects sink", "All small objects float", "Every metal object must sink"], "The water an object can displace matters as well as its weight.", 2]
 ]);
 unit('ireland','geography','Explore Ireland','☘️','ireland',[
 'Explore the island of Ireland. Find a city by the sea, then look for a town inland.',
 'Trace the River Shannon in your mind from Athlone to Limerick. Which place is farther south?',
 'The island includes Ireland and Northern Ireland. Compare the capitals, coasts and river towns.'
 ],[
 ['Find the capital of Ireland.','Dublin',['Cork','Galway','Limerick'],'Dublin is on the east coast.',0],
 ['Which southern city sits on the River Lee?','Cork',['Belfast','Dublin','Athlone'],'The River Lee flows through Cork.',0],
 ['Which city sits on Galway Bay?','Galway',['Dublin','Belfast','Cork'],'Galway Bay opens out to the Atlantic.',0],
 ['Which city is the capital of Northern Ireland?','Belfast',['Cork','Galway','Athlone'],'Belfast lies in the north-east of the island.',1],
 ['Which inland town sits near the middle of the island?','Athlone',['Cork','Dublin','Galway'],'Athlone is on the Shannon in the Irish midlands.',1],
 ['Find the west-coast city across the island from Dublin.','Galway',['Cork','Belfast','Athlone'],'Galway faces the Atlantic on the west coast.',1],
 ['Follow the Shannon downstream from Athlone. Which city do you reach?','Limerick',['Cork','Dublin','Belfast'],'The Shannon flows through Limerick toward its estuary.',2],
 ['A boat leaves the River Liffey and enters a bay. Which city has it passed?','Dublin',['Galway','Cork','Limerick'],'The River Liffey meets Dublin Bay on the east coast.',2],
 ['Travel north-east from Dublin to a city at the head of a lough. Where are you?','Belfast',['Athlone','Cork','Limerick'],'Belfast sits at the head of Belfast Lough.',2],
 ['Find the fishing harbour in County Donegal.','Killybegs',['Athlone','Dublin','Belfast'],'Killybegs Harbour opens into Donegal Bay.',0],
 ['Follow the River Eske to Donegal Bay. Which town do you reach?','Donegal Town',['Cork','Galway','Athlone'],'The Eske meets the bay at Donegal Town.',1],
 ['Follow the coast west from Donegal Town. Which fishing port do you reach?','Killybegs',['Dublin','Limerick','Cork'],'Killybegs lies west of Donegal Town on the same bay.',2]
 ]);
 unit('australia','geography','Explore Australia','🦘','australia',[
 'Find the mainland, then Tasmania. Tap the pins to discover a harbour, a city and a great rock.',
 'Use the north arrow. Look for Darwin in the north, Perth in the west and Hobart in the south.',
 'Compare coast and interior. Look at where Canberra sits in relation to Sydney and where Uluru sits in relation to the sea.'
 ],[
 ['Find Australia’s capital city.','Canberra',['Sydney','Perth','Darwin'],'Canberra is the national capital.',0],
 ['Which pin marks a great sandstone rock?','Uluru',['Sydney','Darwin','Hobart'],'Uluru rises from the dry interior.',0],
 ['Which city is on Tasmania?','Hobart',['Perth','Sydney','Canberra'],'Hobart is on the island south of the mainland.',0],
 ['Which city is on the west coast by the Indian Ocean?','Perth',['Sydney','Canberra','Hobart'],'Perth is on the western side of Australia.',1],
 ['Which city sits on the north coast?','Darwin',['Perth','Canberra','Sydney'],'Darwin is in the north of the Northern Territory.',1],
 ['Which harbour city lies north-east of Canberra?','Sydney',['Hobart','Uluru','Perth'],'Sydney is on the east coast beside the Tasman Sea.',1],
 ['Travel inland and south-west from Sydney. Which capital do you reach?','Canberra',['Perth','Darwin','Hobart'],'Canberra lies inland from Sydney.',2],
 ['Which stop would take you farthest from the coast?','Uluru',['Darwin','Perth','Sydney'],'Of these stops, Uluru lies deepest in the interior.',2],
 ['Cross Bass Strait heading south. Which city could you visit on that island?','Hobart',['Sydney','Perth','Darwin'],'Bass Strait separates Tasmania from the mainland.',2]
 ]);
 units.forEach(function(u,i){u.order=i});
 const experiments={
 "daynight": [
  "Move the dot into the dark.",
  "Turn Earth until the dot goes dark. Where is the Sun now?",
  "Start with the dot in daylight. Predict where it will be after half a turn, then test it."
 ],
 "water": [
  "Tap Make rain. Where do the drops land?",
  "Tap Warm the water, then Cool the vapour. What changes?",
  "A puddle shrinks even on a day without rain. Where could the water go? Try warming and cooling it in the picture."
 ],
 "forces": [
  "Tap Roll the ball. Which way does it go?",
  "Roll the ball. Make the ramp steeper and roll again.",
  "Try a gentle slope and a steep one. Keep the ball and starting point the same. Which run takes less time?"
 ],
 "plants": [
  "Tap See what happens. Then switch off Water and try again.",
  "Leave Water ticked. Try the plant with Light and then without it.",
  "Compare a plant in light with one in shade. What will you keep the same?"
 ],
 "magnets": [
  "Tap Bring them close. Now turn one magnet and try again.",
  "Look at the letters on the ends. Turn one magnet, then bring them close.",
  "Predict the motion before and after turning one magnet. Compare the pairs from the same gap."
 ],
 "floating": [
  "Pick the spoon. Tap Test it in the model.",
  "Guess which will float: a cork or a steel spoon? Test both.",
  "Test the spoon and the empty sealed bottle. Could something heavier than the spoon still float?"
 ]
};
 units.forEach(u=>{if(experiments[u.id]){u.tryIt=experiments[u.id];u.questions.filter(q=>q.level===2).forEach((q,i)=>q.id=u.id+':investigate:'+i)}});
 return {units:units,levels:['First steps','Growing','Challenge'],subjects:{maths:['Maths','🔢'],reading:['Reading','📚'],music:['Music','🎹'],geography:['Geography','🌍'],science:['Science','🔬']},sources:[['Earth, day and night','https://www.nasa.gov/learning-resources/for-kids-and-students/what-is-earth-grades-k-4/'],['Oceans','https://oceanservice.noaa.gov/facts/biggestocean.html'],['Water cycle','https://water.usgs.gov/edu/watercycle-kids-beg.html']]};
})();
