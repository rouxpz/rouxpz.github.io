let entry, button;
let toDisplay = " ";
let c;

function preload(){
  img1 =loadImage("images/ratty.png")
}

function setup() {
  createCanvas(windowWidth, windowHeight);
//the paege resizes when i reload it and then it fits screen
c = color(200);

// this the input field and initial value
entry = createInput("Ask whatever your heart desires here");
entry.position(170,370);
entry.size(220);

//button that will run question func()
button = createButton("Tell me");
button.position(255,400);
button.mousePressed(enterQuestion);

}

function draw() {
  background(162,0,0);
fill(115,22,22);
noStroke();
circle(50,50,300);
circle(280,380,400);
circle(550,600,250);
circle(800,200,600);
circle(1200,700,500);

  image(img1,400,200);

textSize(32);
fill(255,0,0);
stroke(0);
strokeWeight(4);
text('I HAVE ANSWERS',55,100);

//render toDisplay
text(toDisplay,10,30);
}
//takes value from input box into display variable, removes input and button when clocked
function enterQuestion() {
  toDisplay = "I dont know what " +entry.value()+ " means";
entry.style('display','none');
button.style('display','none');

c=color(227,10,230);


}