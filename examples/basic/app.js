import { Canvas, Keyboard, Rectangle } from '../../Infinite.js';

var canvas = new Canvas();
canvas.colour = 'lightblue';

var square = new Rectangle(100,100);
square.colour = 'black';

var square1 = new Rectangle(100,100, 200,200);
square1.colour = 'black';

canvas.onUpdate(() =>
{
    if (Keyboard.isKeyDown('w')) square.y--;
    if (Keyboard.isKeyDown('a')) square.x--;
    if (Keyboard.isKeyDown('s')) square.y++;
    if (Keyboard.isKeyDown('d')) square.x++;
    if (Keyboard.isKeyDown('r')) square1.rotate(2)

    if (square.intersects(square1)) square1.colour = 'red';
    else square1.colour = 'black';

    canvas.clear();
    canvas.draw(square);
    canvas.draw(square1);
});

canvas.run();