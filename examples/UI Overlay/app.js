import { Canvas } from '../../Infinite.js';

var canvas = new Canvas();
canvas.colour = 'lightblue';

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