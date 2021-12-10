import { Canvas, Rectangle } from '../../Infinite.js';

var canvas = new Canvas();
canvas.colour = 'lightblue';

var square = new Rectangle(100,100);
square.colour = 'red';

canvas.onUpdate(() =>
{
    canvas.clear();
    canvas.draw(square);
});

canvas.run();