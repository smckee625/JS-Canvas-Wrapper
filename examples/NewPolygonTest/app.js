import { Canvas, Rectangle, Polygon, Mouse, OldPolygon } from '../../Infinite.js';

var canvas = new Canvas();
canvas.colour = 'lightblue';

var square = new Rectangle(100, 100);
square.colour = 'red';

let data = [
    { x: 0, y: 0},
    { x: 200, y: 0},
    { x: 200, y: 200},
    { x: 0, y: 200},
    { x: 0, y: 0}
];

var arr = [];
var num = 1000;
for (let i = 0; i < num; i++)
{
    var p = new Polygon(data, 300+Math.round(i/5), 300+ Math.round(i/5));
    // var p = new OldPolygon(data, 300+Math.round(i/5), 300+ Math.round(i/5));
    arr.push(p);   
}
var c = 0;

canvas.onUpdate(() =>
{
    if (c == 100000) c = 0;

    var m = Mouse.getPosition();
    for (let i = 0; i < num; i++)
    {
        arr[i].rotate(1);
        // arr[i].setScale(Math.round(c) % 2+1, Math.round(c) % 2+1);
        if (arr[i].contains(m)) arr[i].colour = 'red';
        else arr[i].colour = 'black';
    }
    c += .01;

    canvas.clear();
    for (let i = 0; i < num; i++)
    {
        canvas.draw(arr[i]);
    }
});

canvas.run();