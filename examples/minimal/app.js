import { Canvas, Events } from '../../Infinite.js';

var canvas = new Canvas();
canvas.colour = 'lightblue';

var events = new Events(canvas, { keyboard: true, mouse: true, touch: false, debug: false });

canvas.onUpdate(() =>
{
    canvas.clear();
});

canvas.run();