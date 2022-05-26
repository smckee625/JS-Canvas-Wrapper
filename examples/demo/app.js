import { Canvas, Keyboard, Polygon, Rectangle, Sprite, Texture, Util } from '../../Infinite.js';

// Create Canvas
var canvas = new Canvas();
canvas.colour = 'lightblue';
canvas.setFullscreen(false);

// Texture Area
var texture = await new Texture('spritesheet.png');
texture.setArea(new Rectangle(55, 68, 13, 115));

// Player Sprite
var player = new Rectangle(55, 68);
player.setTexture(texture);

// Center camera on player
canvas.getCamera().track(player);

// Random Center Rectangle to show movement
var box = new Rectangle(10, 10, 0, 80);

// Animation runs every 140ms, moving the textureArea move the sprites texture location on the spritesheet
Util.repeat(() =>
{
    if (Keyboard.isKeyDown("d"))
    {
        texture.setScale(1, 1);
        texture.getArea().x += 80;
    }
    else if (Keyboard.isKeyDown("a"))
    {
        // Flip sprite
        texture.setScale(-1, 1);
        texture.getArea().x += 80;
    }
    else texture.getArea().x = 13;

    // Loop animation position
    if (texture.getArea().x > 400) texture.getArea().x = 13;
}, 125);

// Game Loop
canvas.onUpdate(() =>
{
    // Movement Input
    if (Keyboard.isKeyDown("w")) player.y-=2;
    if (Keyboard.isKeyDown("a")) player.x-=2;
    if (Keyboard.isKeyDown("s")) player.y+=2;
    if (Keyboard.isKeyDown("d")) player.x+=2;

    // Detect intersect
    if (box.intersects(player)) box.colour = 'red';
    else if (box.colour == 'red') box.colour = 'black';

    // Display
    canvas.clear();
    canvas.draw(box);
    canvas.draw(player);
});

// Run game
canvas.run();