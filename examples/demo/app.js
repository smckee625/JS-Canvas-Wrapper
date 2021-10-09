import { Canvas, Events, Rectangle, Sprite, Util } from '../../Infinite.js';

// Create Canvas
var canvas = new Canvas();
canvas.colour = 'lightblue';

// Create Event system
var events = new Events(canvas, { keyboard: true, mouse: false, touch: false, debug: false });

// Texture Area
var rectArea = new Rectangle(55, 67, 13, 115);

// Random Rectangle
var center = new Rectangle(10, 10, -5, -5);

// Player Sprite
var p = new Sprite('spritesheet.png', rectArea);

// Animation runs every 140ms
Util.repeat(() =>
{
    if (events.isKeyDown("d"))
    {
        p.setScale(1, 1);
        rectArea.x += 80;
    }
    else if (events.isKeyDown("a"))
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
    if (events.isKeyDown("w")) p.y--;
    if (events.isKeyDown("a")) p.x--;
    if (events.isKeyDown("s")) p.y++;
    if (events.isKeyDown("d")) p.x++;
    if (events.wasKeyPressed("r")) p.turn(30);

    // Center camera on player
    canvas.getCamera().setPosition(p.x - canvas.width / 2 + 60, p.y - canvas.height / 2 + 60);

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