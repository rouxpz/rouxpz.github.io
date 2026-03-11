var timeSpent = 0;

var ThingsYouCouldDo = [
"You could have stretched your body.",
"You could have drank some water.",
"You could have called a friend.",
"You could have gone outside.",
"You could have rested your eyes.",
"You could have started a book.",
"You could have listened to a new song.",
"You could have taken a walk.",
"You could have learned a new recipe.",
"You could have donated to charity.",
"You could have pet your dog.",
"You could have applied for a job.",
"You could have balanced on one foot.",
"You could have won a thumbwar.",
"You could have done a jumping jack.",
"You could have learned a new word.",
"You could have taken a cool photo.",
"You could have called your mom.",
"You could have made a quick sketch.",
"You could have meditated.",
"You could have tried to whistle.",
"You could have made a secret handshake.",
"You could have named a squirrel.",
"You could have adjusted your posture.",
"You could have held your breath for as long as you can.",
"You could have cracked your knuckles.",
"You could have studied for a test.",
"You could have made plans.",
"You could have sharpened a pencil.",
"You could have made a cup of tea.",
"You could have thanked your mailman.",
"You could have poured a glass of milk.",
"You could have brushed your hair.",
"You could have brushed your teeth.",
"You could have googled sharks.",
"You could have practiced patience.",
"You could have done literally anything else.",
"You could have canceled a subscription.",
"You could have unsubscribed from an email list.",
"You could have written a poem.",
"You could have planned an outfit.",
"You could have taken a deep breath.",
"You could have said hello to someone.",
"You could have learned about a new country.",
"You could have thought about your childhood bedroom.",
"You could have counted sheep.",
"You could have hummed a tune.",
"You could have told a joke",
"You could have practiced your fake laugh.",
"You could have looked out the window.",
"You could have refilled your waterbottle.",
"You could have eaten a sandwhich.",
"You could have vacummed your floor.",
"You could have imagined being able to fly.",
"You could have cut your toe nails.",
"You could have painted your nails.",
"You could have sang the alphabet.",
"You could have done your makeup.",
"You could have juggled a soccer ball.",
"You could have asked a question.",
"You could have kissed a frog.",
"You could have learned a chord on the guitar.",

];

function updateTimer() {

timeSpent = timeSpent + 1;

var display;

if (timeSpent < 60) {

display = timeSpent + " seconds";

} else {

var minutes = Math.floor(timeSpent / 60);
var remaining = timeSpent % 60;

display = minutes + " min " + remaining + " sec";

}

document.getElementById("timer").innerHTML = display;

var randomActivity = ThingsYouCouldDo[Math.floor(Math.random() * ThingsYouCouldDo.length)];

document.getElementById("alternative").innerHTML = randomActivity;

}

setInterval(updateTimer, 1000);