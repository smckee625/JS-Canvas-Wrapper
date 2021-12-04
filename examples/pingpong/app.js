import { Canvas, Events, Rectangle, Circle, DisplayText, Util } from '../../Infinite.js';

var canvas = new Canvas();
var events = new Events(canvas, { keyboard: true, mouse: false, touch: false, debug: false });
canvas.colour = "black";
canvas.fpsVisible(false);

//Players
var p1 = new Rectangle(20, 100);
p1.setPosition(10, canvas.height / 2);
p1.colour = 'blue';

var p2 = new Rectangle(20, 100);
p2.setPosition(canvas.width - p2.getSize().width - 10, canvas.height / 2);
p2.colour = 'green';

// Ball
var ball = new Circle(15);
ball.colour = 'white';
ball.setPosition(canvas.width / 2, canvas.height / 2)
ball.setRotation(90);

// Bounce Walls
var topWall = new Rectangle(canvas.width, 20);

var bottomWall = new Rectangle(canvas.width, 20);
bottomWall.y = canvas.height;

// Scores
var s1 = new DisplayText(0);
s1.colour = 'blue';

var s2 = new DisplayText(0);
s2.x = canvas.width - 40;
s2.colour = 'green';

// Update loop runs 60 times a second
canvas.onUpdate(async () =>
{
    // Movement
    if (events.isKeyDown('s')) p1.y += 5;
    if (events.isKeyDown('w')) p1.y -= 5;
    if (events.isKeyDown('arrowdown')) p2.y += 5;
    if (events.isKeyDown('arrowup')) p2.y -= 5;

    // Scoring
    if (ball.x > canvas.width)
    {
        s1.value++;
        ball.setPosition(canvas.width / 2, canvas.height / 2)
        ball.setRotation(Util.random(0,360))

        canvas.colour = 'lightblue';
        Util.delay(() => { canvas.colour = 'black'; }, 300);
    }
    else if (ball.x < 0)
    {
        s2.value++;
        ball.setPosition(canvas.width / 2, canvas.height / 2)
        ball.setRotation(Util.random(0,360))

        canvas.colour = 'lightgreen';
        Util.delay(() => { canvas.colour = 'black'; }, 300);
    }

    // Ball bounce when player is hit
    if (ball.intersects(p2)) ball.setRotation(Util.random(225, 315));
    if (ball.intersects(p1)) ball.setRotation(Util.random(45, 135));

    // Ball wall bounce
    if (ball.intersects(topWall) || ball.intersects(bottomWall)) ball.setRotation(180 - ball.getRotation());

    // Ball Move
    ball.move(7);

    // Clear everything on screen then draw
    canvas.clear();

    canvas.draw(ball);

    canvas.draw(p1);
    canvas.draw(p2);

    canvas.draw(s1);
    canvas.draw(s2);
});

// Run Game
canvas.run();