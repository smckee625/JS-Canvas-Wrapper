import { Canvas, Events, Util } from '../../Infinite.js';

var canvas = new Canvas();
canvas.colour = 'lightblue';

var evt = new Events(canvas, { keyboard: true, mouse: true, touch: true, debug: false });

// Creates a new function called evt.save(), that has access to inputs to allow cross platform support
// self - current event object 
// k - keyboard,   m - mouse,   t - touchscreen
evt.create('save', (self, k, m, t) =>
{
    if (k.isKeyDown('s') || (t.isTouch && t.position.x < 50))
    {
        t.isTouch = false;
        return true;
    }
    else return false;
});

canvas.onUpdate(() =>
{
    // This code will run if the key 'S' is pressed or if the very left is pressed on a touchscreen device
    if (evt.save()) 
    {
        // Change background to red and then change it back to lightblue 2 seconds later
        canvas.colour = 'red';
        Util.delay(() => { canvas.colour = 'lightblue'; }, 2000);
    }
    
    canvas.clear();
});

canvas.run();