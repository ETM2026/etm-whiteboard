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
 'Earth spins. A place facing the Sun has daylight. Turn our model and watch the little marker.',
 'The Sun lights the side facing it. As Earth rotates, a place can move into the dark side. A full rotation takes about a day.',
 'Day and night come from rotation. Seasons come from Earth’s tilted axis as it orbits the Sun, not from the Sun going around Earth.'
 ],[
 ['What gives Earth daylight?','The Sun',['A mountain','A cloud','A tree'],'The Sun is our main natural source of daylight.',0],
 ['When our place faces away from the Sun, is it day or night?','Night',['Always noon','Day','A rainbow'],'The side facing away receives no direct sunlight.',0],
 ['Does Earth spin?','Yes',['Only on Sundays','Never','Only when it rains'],'Earth rotates continuously.',0],
 ['What causes day and night?','Earth rotating',['The Sun switching off','Clouds hiding every place','Earth stopping'],'Rotation changes which places face the Sun.',1],
 ['About how long is one full Earth rotation?','One day',['One minute','One year','One month'],'A solar day is about twenty-four hours.',1],
 ['Does the Sun stop shining every night?','No',['Yes; everywhere','Only in winter','Only over oceans'],'Your place turns away while other places receive sunlight.',1],
 ['Which motion makes a year?','Earth orbiting the Sun',['Earth spinning once','The Moon spinning once','Clouds crossing the sky'],'A year is about one trip of Earth around the Sun.',2],
 ['What mainly causes our seasons?','Earth’s tilted axis',['The Sun switching temperature daily','Earth being flat','The Moon covering the Sun'],'Earth’s tilt changes sunlight through the year.',2],
 ['Can it be daytime in one place and night elsewhere?','Yes',['Never','Only on the Moon','Only once a year'],'Different parts of Earth face toward or away from the Sun.',2]
 ]);
 unit('water','science','A drop’s adventure','💧','water',[
 'Water can move between sea, air and land. Warmth helps liquid water become invisible water vapour. Explore our model.',
 'Evaporation turns liquid into gas. Cooling can turn water vapour into tiny liquid drops: condensation. Rain is precipitation.',
 'Water follows many paths. It can collect in rivers, soak into the ground, freeze, melt and return to the air. The model shows only a few of those paths.'
 ],[
 ['Which is liquid water?','A raindrop',['A dry stone','A wooden block','A sheet of paper'],'A raindrop is liquid water.',0],
 ['What often falls from rain clouds?','Rain',['Sandwiches','Trees','Pebbles'],'Rain falls as drops of water.',0],
 ['What is frozen water called?','Ice',['Steam','Sand','Soil'],'Ice is solid water.',0],
 ['What is evaporation?','Liquid water becoming water vapour',['Water turning to stone','Clouds becoming soil','Ice turning to metal'],'Evaporation changes liquid water into gas.',1],
 ['What is condensation?','Water vapour becoming liquid drops',['Rain becoming rocks','Soil becoming air','Water becoming sunlight'],'Cooling water vapour can form liquid droplets.',1],
 ['What supplies much of the energy driving the water cycle?','The Sun',['The Moon’s colour','A map key','A compass needle'],'Solar energy helps water evaporate.',1],
 ['Is water vapour itself visible?','No; it is a gas',['Yes; it is every white cloud','Yes; it is ice','Only if it is salty'],'The white part of a cloud is tiny droplets or ice, not water vapour itself.',2],
 ['Where can rain go after reaching land?','Into rivers and the ground',['Only back to a cloud immediately','Only into bottles','Nowhere'],'Runoff and infiltration are two possible paths.',2],
 ['Is the water cycle only one fixed circular route?','No; water follows many paths',['Yes; every drop takes identical steps','Only in summer','Only on islands'],'Water can move and change state along different connected paths.',2]
 ]);
 unit('forces','science','Push, pull, roll','⚽','ramp',[
 'A push or pull is a force. Try a gentle and a steeper ramp. Predict what the ball will do before you roll it.',
 'Gravity pulls objects toward Earth. On this model, a steeper ramp lets the ball gain speed more quickly. The ball and surface stay the same.',
 'A fair comparison changes one thing at a time. Surface roughness and friction can also affect motion, so they must be controlled.'
 ],[
 ['To move a toy away from you, you might…','Push it',['Paint it','Name it','Count it'],'A push is a force that can move an object away.',0],
 ['To bring a toy toward you, you might…','Pull it',['Hide it','Sing to it','Colour it'],'A pull can bring an object closer.',0],
 ['Which way does a ball usually roll on a ramp?','Downhill',['Always uphill','Into the sky','Nowhere ever'],'Gravity helps the ball move downhill.',0],
 ['Which force pulls objects toward Earth?','Gravity',['Sunlight','A map','A musical note'],'Gravity attracts objects toward Earth.',1],
 ['In our model, what changes when the ramp gets steeper?','The ball gains speed faster',['The ball becomes alive','The ball changes colour','Gravity disappears'],'A steeper ramp increases the downhill part of gravity’s effect.',1],
 ['What can slow a sliding object on a rough surface?','Friction',['Its name','The day of the week','A rainbow'],'Friction opposes sliding motion between surfaces.',1],
 ['To test ramp steepness fairly, what should stay the same?','The ball and ramp surface',['Nothing','Only the title','Every object’s colour only'],'Keep other relevant variables the same while changing steepness.',2],
 ['Why repeat a test?','To check that a result is reliable',['To guarantee your guess is right','To remove all forces','To avoid observing'],'Repeated observations help you check a pattern.',2],
 ['Does a simple model include every real-world effect?','No',['Yes; always','Only on a tablet','Only if it is colourful'],'Models simplify reality. This one does not calculate all rolling and friction effects.',2]
 ]);
 unit('plants','science','Help a plant grow','🌱','plants',[
 'Most green plants need water and light to grow well. Try changing their conditions in this pretend garden.',
 'Roots take up water. Leaves use light to help make food. Different plants need different amounts, so more water is not always better.',
 'Green plants use light, water and carbon dioxide to make sugars. Test one condition at a time and allow real plants enough time to respond.'
 ],[
 ['What can help a green plant grow?','Light',['A woolly hat','A toy car','A pencil case'],'Most green plants need light to grow well.',0],
 ['Which part is usually below the soil?','Roots',['Flowers','Leaves','Fruit'],'Roots anchor a plant and take up water.',0],
 ['Does a plant need some water?','Yes',['Never','Only pretend water','Only seawater'],'Plants need water, although amounts vary.',0],
 ['Which part usually takes up water from the soil?','Roots',['Petals','Seeds in a packet','Fruit skin'],'Roots absorb water from the soil.',1],
 ['Should you keep adding water without checking?','No; too much can harm plants',['Yes; more is always better','Only at night','Only if the pot is blue'],'Roots also need suitable conditions and air; overwatering can cause problems.',1],
 ['What do green leaves use light to help make?','Food for the plant',['Small stones','Plastic','Soil from nothing'],'Green plants make sugars using energy from light.',1],
 ['Which gas do green plants use to make sugars?','Carbon dioxide',['Helium only','Neon only','None'],'Photosynthesis uses carbon dioxide and water with light energy.',2],
 ['To compare light fairly, what could stay the same?','Plant type, water and observation time',['Nothing','Only the pot’s label','The question alone'],'Control other important conditions while changing light.',2],
 ['Why does our pretend plant change faster than a real one?','It is a simplified model',['Real plants never grow','Screens produce soil','All plants grow instantly'],'Real growth happens over time; this model only illustrates conditions.',2]
 ]);
 unit('magnets','science','Magnet mystery','🧲','magnets',[
 'Magnets can pull some things without touching them. Try turning one magnet around in our model.',
 'Magnets have north and south poles. Unlike poles attract; like poles repel. Not every metal is strongly attracted by a magnet.',
 'A magnetic force can act across a gap. Compare pole combinations while keeping distance the same to explore a pattern.'
 ],[
 ['Can a magnet pull some objects without touching them?','Yes',['Never','Only if painted','Only in water'],'Magnetic forces can act across a gap.',0],
 ['What might a magnet attract?','An iron nail',['A wooden spoon','A paper cup','A plastic ruler'],'Iron is strongly attracted to an ordinary magnet.',0],
 ['Does turning a magnet change which pole faces the other magnet?','Yes',['Never','Only its name changes','It removes both poles'],'Turning it changes which pole is nearest.',0],
 ['What do north and south poles do when brought close?','Attract',['Always repel','Disappear','Make sunlight'],'Unlike magnetic poles attract.',1],
 ['What do two north poles do when brought close?','Repel',['Always attract','Melt','Turn into wood'],'Like magnetic poles repel.',1],
 ['Are all metals strongly attracted to an ordinary magnet?','No',['Yes; every metal','Only if shiny','Only if heavy'],'Iron is strongly attracted, but metals such as copper are not in the same way.',1],
 ['Which pair repels?','South facing south',['North facing south','South facing north','Either pair of unlike poles'],'Two like poles repel.',2],
 ['For a fair comparison of poles, what should you keep the same?','The distance and the magnets',['Nothing','Only the wall colour','Only the day'],'Distance and magnet strength affect the comparison.',2],
 ['What is evidence that magnets exert a force?','A change in another object’s motion',['Their colour alone','Their price','Their label’s font'],'Forces can change an object’s motion, even without contact.',2]
 ]);
 unit('floating','science','Float or sink?','⛵','floating',[
 'Predict what happens in water. Try a cork, a steel spoon and an empty sealed bottle in our pretend bowl.',
 'Whether something floats depends on its material, shape and what is inside. An empty sealed bottle can float because it contains air.',
 'Water pushes upward on immersed objects. A steel ship can float because its hull displaces enough water; a small solid steel spoon usually sinks.'
 ],[
 ['What does “float” mean here?','Stay at the water’s surface',['Fall to the bottom','Turn into ice','Become invisible'],'A floating object is supported at the surface.',0],
 ['Which example floats in our model?','A cork',['A solid steel spoon','A granite pebble','An iron nail'],'Cork normally floats in water.',0],
 ['What should you do before testing an idea?','Make a prediction',['Hide the result','Change every object','Decide facts cannot change'],'Predict first, then compare with what you observe.',0],
 ['Why can an empty sealed plastic bottle float?','It contains air and has low average density',['All plastic must float','It has no weight','Water cannot touch it'],'The trapped air helps lower the average density of the whole bottle.',1],
 ['Does every heavy object sink?','No',['Yes; always','Only in daytime','Only if it is long'],'Large ships can float; mass alone does not decide the result.',1],
 ['What should happen after a prediction is wrong?','Use the observation to improve your idea',['Hide it','Stop all experiments','Keep calling it correct'],'Unexpected results can help us learn.',1],
 ['How can a steel ship float while a steel spoon sinks?','Its hollow hull displaces enough water',['Ships have no mass','Steel changes into wood','Only spoons feel gravity'],'Shape and the whole object’s average density matter.',2],
 ['Which force acts upward on an immersed object?','Buoyancy',['Only a downward push','No force','Sunlight'],'Water exerts an upward buoyant force.',2],
 ['Would opening and filling the bottle change the test?','Yes; the contents and average density change',['No; contents never matter','Only the colour changes','It stops being matter'],'Changing the air and water inside changes the whole object.',2]
 ]);
 units.forEach(function(u,i){u.order=i});
 return {units:units,levels:['First steps','Growing','Challenge'],subjects:{maths:['Maths','🔢'],reading:['Reading','📚'],music:['Music','🎹'],geography:['Geography','🌍'],science:['Science','🔬']},sources:[['Earth, day and night','https://www.nasa.gov/learning-resources/for-kids-and-students/what-is-earth-grades-k-4/'],['Oceans','https://oceanservice.noaa.gov/facts/biggestocean.html'],['Water cycle','https://water.usgs.gov/edu/watercycle-kids-beg.html']]};
})();
