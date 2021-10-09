import { Canvas, Circle, Events, Line, Polygon, Rectangle, Sprite, Util } from '../../Infinite.js';

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
var rectArea = new Rectangle(55, 67, 13, 115);

// Random Rectangle
var rect = new Rectangle(10, 10, -5, -5);

// player Sprite
var num = 200;
var p = [];
var img = new Image();
img.src = 'spritesheet.png';
img.onload = () =>
{
    for (let i = 0; i < num; i++)
    {
        p.push(new Sprite(img, rectArea));
    }

Util.repeat(() =>
{
    if (events.isKeyDown("d"))
    {
        for (let i = 0; i < num; i++) p[i].setScale(1, 1);
        rectArea.x += 80;
    }
    else if (events.isKeyDown("a"))
    {
        for (let i = 0; i < num; i++) p[i].setScale(-1, 1);
        rectArea.x += 80;
    }
    if (rectArea.x > 400) rectArea.x = 13;
}, 140);

canvas.onUpdate(async () =>
{
    if (events.isKeyDown("w")) for (let i = 0; i < num; i++) p[i].y--;
    if (events.isKeyDown("a")) for (let i = 0; i < num; i++) p[i].x--;
    if (events.isKeyDown("s")) for (let i = 0; i < num; i++) p[i].y++;
    if (events.isKeyDown("d")) for (let i = 0; i < num; i++) p[i].x++;

    if (events.wasKeyPressed("r")) for (let i = 0; i < num; i++) p[i].turn(30);
    if (events.wasKeyPressed("t")) rect.turn(30);

    canvas.getCamera().setPosition(p[0].x - canvas.width / 2 + 60, p[0].y - canvas.height / 2 + 60);

    for (let i = 0; i < num; i++) 
    {
        if (rect.intersects(p[i])) rect.colour = 'red';
        else if (rect.colour == 'red') rect.colour = 'black';
    }

    canvas.clear();
    canvas.draw(rect);
    for (let i = 0; i < num; i++) canvas.draw(p[i]);
});

canvas.run();
}