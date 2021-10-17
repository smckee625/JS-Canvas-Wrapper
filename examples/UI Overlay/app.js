import { Canvas, Events, Util } from '../../Infinite.js';

var canvas = new Canvas();
canvas.colour = 'lightblue';

var events = new Events(canvas, { keyboard: true, mouse: true, touch: false, debug: false });

var button = document.getElementById("btn_start");
button.onclick = () =>
{
    canvas.run();
    canvas.getUI().style.display = "none";
}

canvas.onUpdate(() =>
{
    canvas.clear();
});