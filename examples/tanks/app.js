import { Canvas, Keyboard, Line, Mouse, Rectangle, Texture } from '../../Infinite.js';

// Create Canvas
var canvas = new Canvas();
canvas.colour = 'lightblue';
canvas.setFullscreen(true );

// Textures
var tankTexture = await new Texture('images/tank_blue.png');
tankTexture.setScale(1, -1);
tankTexture.setArea(new Rectangle(42, 46, -21, -23));
tankTexture.setOrigin(21, 23);

var sandTexture = await new Texture('images/tileSand.png');
sandTexture.setScale(2, 2);
sandTexture.setArea(new Rectangle(128, 128));

var bulletTexture = await new Texture('images/bullet.png');
var explodeTexture = await new Texture('images/explosion.png');
explodeTexture.setOrigin(4, 7);

var boxTexture = await new Texture('images/crateWood.png');
boxTexture.setScale(2, 2);
boxTexture.setArea(new Rectangle(56, 56));

// Tiles
const TILE_WIDTH = 20;
var tiles = [];
for (let y = 0; y < TILE_WIDTH; y++)
{
    tiles.push([]);
    for (let x = 0; x < TILE_WIDTH; x++)
    {
        tiles[y][x] = new Rectangle(128, 128, x * 128, y * 128);
        tiles[y][x].setTexture(sandTexture);
    }
}

var box = new Rectangle(56, 56, 300, 300);
box.setTexture(boxTexture);
box.destroyed = false;

// Player tank
var tank = new Rectangle(42, 46);
tank.setTexture(tankTexture);
tank.setOrigin(21, 23);
var line = new Line(0, 0, 1, 1);

// Center camera on tank
canvas.getCamera().track(tank);

function add(p1, p2)
{
    if (typeof p1 === 'object')
    {
        if (typeof p2 === 'object') return { x: p1.x + p2.x, y: p1.y + p2.y };
        else return { x: p1.x + p2, y: p1.y + p2 };
    }
}

var bullets = [];
var lastFire = 0;
function fire()
{
    if (Date.now() - lastFire > 400)
    {
        let bullet = new Rectangle(8, 14);
        bullet.setOrigin(4, 7);
        bullet.setTexture(bulletTexture);
        bullet.setPosition(tank.getPosition());
        bullet.setRotation(tank.getRotation());
        bullet.explode = false;

        bullet.timeout = setTimeout(() =>
        {
            bullet.explode = true;
            bullet.setScale(.1, .1);
            bullet.setTexture(explodeTexture);
            bullet.setSize(64, 63);
            bullet.setOrigin(32, 32);

            setTimeout(() =>
            {
                bullets.shift();
            }, 600);
        }, 1000);
        bullets.push(bullet);
        lastFire = Date.now();
    }
}

// Game Loop
canvas.onUpdate(() =>
{
    // Aim tank
    line.setPoint1(tank.getPosition());
    line.setPoint2(add(Mouse.getPosition(), canvas.getCamera().getPosition()));
    tank.setRotation(line.getAngle());

    // Tank controls
    if (Keyboard.isKeyDown('w')) tank.move(3 * canvas.delta);
    if (Mouse.getButtons().left) fire();

    if (!box.destroyed && tank.intersects(box)) tank.move(-3 * canvas.delta);

    // Detect intersect
    // if (box.intersects(tank)) box.colour = 'red';
    // else if (box.colour == 'red') box.colour = 'black';

    // Move all bullets
    bullets.forEach(b =>
    {
        if (b.explode == false && !box.destroyed && b.intersects(box))
        {
            if (!box.destroyed)
            {
                clearTimeout(b.timeout);
                b.explode = true;
                b.setScale(.1, .1);
                b.setTexture(explodeTexture);
                b.setSize(64, 63);
                b.setOrigin(32, 32);
                box.destroyed = true;
                setTimeout(() =>
                {
                    bullets.shift();
                }, 600);

                setTimeout(() =>
                {
                    box.destroyed = false;
                }, 10000);
            }
        }

        if (b.explode == false) b.move(10 * canvas.delta);
        else if (b.explode == true && b.getScale().x < 1)
        {
            b.scale(1.2, 1.2);
        }
        else b.setScale(1, 1);
    });

    // Get visible area
    let bounds = canvas.getCamera().getBounds();

    // Display
    canvas.clear();
    let minY = Math.max(0, Math.floor(bounds.top / 128));
    let minX = Math.max(0, Math.floor(bounds.left / 128));
    let maxY = Math.min(TILE_WIDTH-1, Math.ceil(bounds.bottom / 128));
    let maxX = Math.min(TILE_WIDTH-1, Math.ceil(bounds.right / 128));
    for (let y = minY; y < maxY; y++)
    {
        for (let x = minX; x < maxX; x++)
        {
            canvas.draw(tiles[y][x]);
        }
    }

    // bounds.top -= 150;
    // bounds.left -= 150;
    // for (let y = 0; y < TILE_WIDTH; y++)
    // {
    //     for (let x = 0; x < TILE_WIDTH; x++)
    //     {
    //         let tile = tiles[y][x]
    //         if (bounds.left < tile.x && tile.x < bounds.right && bounds.top < tile.y && tile.y < bounds.bottom) canvas.draw(tiles[y][x]);
    //     }
    // }
    if (!box.destroyed) canvas.draw(box);
    bullets.forEach(b =>
    {
        if (bounds.left < b.x && b.x < bounds.right && bounds.top < b.y && b.y < bounds.bottom) canvas.draw(b);
    });
    canvas.draw(tank);
});

// Run game
canvas.run();