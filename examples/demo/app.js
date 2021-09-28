import { Canvas, Events, Line, Rectangle } from '../../Infinite.js';

var canvas = new Canvas();
canvas.colour = 'lightblue';

var events = new Events(canvas, { keyboard: true, mouse: true, touch: false, debug: false });

var line = new Line(10,10, 50, 50, 20, "green");
var t = new Rectangle(100, 100,0,0);
t.turn(30);

canvas.onUpdate(() =>
{
    if (line.intersects(t));
    if (events.isKeyDown("d")) t.x++;
    canvas.clear();
    canvas.draw(t);
    canvas.draw(line);
});

canvas.run();