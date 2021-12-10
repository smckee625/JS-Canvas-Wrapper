import { Canvas, Keyboard, Rectangle, Sprite, Util } from '../../Infinite.js';

// Create Canvas
var canvas = new Canvas();
canvas.colour = 'lightblue';
canvas.setFullscreen(false);

// Texture Area
var rectArea = new Rectangle(55, 67, 13, 115);

// Random Rectangle
var center = new Rectangle(10, 10, -5, -5);

// Player Sprite
var p = await new Sprite('spritesheet.png', rectArea);

// Center camera on player
canvas.getCamera().track(p);

// Animation runs every 140ms
Util.repeat(() =>
{
    if (Keyboard.isKeyDown("d"))
    {
        p.setScale(1, 1);
        rectArea.x += 80;
    }
    else if (Keyboard.isKeyDown("a"))
    {
        // Flip sprite
        p.setScale(-1, 1);
        rectArea.x += 80;
    }
    else
    {
        rectArea.x = 13;
    }
    // Reset animation position
    if (rectArea.x > 400) rectArea.x = 13;
}, 140);

// Game Loop
canvas.onUpdate(async () =>
{
    // Movement & Rotation
    if (Keyboard.isKeyDown("w")) p.y--;
    if (Keyboard.isKeyDown("a")) p.x--;
    if (Keyboard.isKeyDown("s")) p.y++;
    if (Keyboard.isKeyDown("d")) p.x++;

    // Detect intersect
    if (center.intersects(p)) center.colour = 'red';
    else if (center.colour == 'red') center.colour = 'black';

    // Display
    canvas.clear();
    canvas.draw(center);
    canvas.draw(p);
});

// Run game
canvas.run();