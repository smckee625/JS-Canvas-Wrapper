import { Canvas, Circle, Events, Line, Polygon, Rectangle, Sprite } from '../../Infinite.js';

var canvas = new Canvas();
canvas.colour = 'lightblue';

var events = new Events(canvas, { keyboard: true, mouse: true, touch: false, debug: false });

// Texture Areas
var triArea = new Polygon([
    { x: 50, y: 0 },
    { x: 100, y: 100 },
    { x: 0, y: 100 }
], 100, 100);
var cirArea = new Circle(60, 100, 100);

// Random Rectangle
var rect = new Rectangle(300, 100, 200, 200);

// player Sprite
var p = new Sprite('https://www.pngplay.com/wp-content/uploads/6/Apple-Fruit-Shining-Small-Transparent-PNG.png', cirArea);

canvas.onUpdate(() =>
{
    if (events.isKeyDown("w")) p.y--;
    if (events.isKeyDown("a")) p.x--;
    if (events.isKeyDown("s")) p.y++;
    if (events.isKeyDown("d")) p.x++;

    if (events.wasKeyPressed("r")) p.turn(30);
    if (events.wasKeyPressed("t")) rect.turn(30);

    if (rect.intersects(p)) rect.colour = 'red';
    else if (rect.colour == 'red') rect.colour = 'black';

    canvas.clear();
    canvas.draw(rect);
    canvas.draw(p);
});

canvas.run();