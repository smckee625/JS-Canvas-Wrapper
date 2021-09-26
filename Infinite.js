// Seamus's TODO list
// -------------------------------------------------------------------
// DONE Finish Polygon class
// DONE Create draw/render method for the Polygon class
// DONE Concave Polygon detection when a shape is inside it doesn't work yet

// TEST Contains method for sprite and polygon classes

// TODO Fix/Restructer the Sprite class again to make it easier to use
// TODO Add touch events/controls to Events class
// TODO Add touch joysticks for touch game support
// TODO Flesh out Util class with more backend functions
// TODO Rewrite/add more feature to the DisplayText class
import 'https://unpkg.com/intersects/umd/intersects.min.js';
import { isPolygonConvex } from './PolygonDetect.js';

document.querySelectorAll('*').style = 'margin: 0%; padding: 0%;';
class Canvas
{
    #canvas;
    #ctx;
    #fps;
    #fpsInterval;
    #fpsTimer;
    #lastCallTime;

    constructor(width, height)
    {
        this.#canvas = document.getElementById("Infinite");
        this.#canvas.tabIndex = '1';
        this.#ctx = this.#canvas.getContext("2d");

        this.#fpsTimer = document.createElement("div");
        this.#fpsTimer.style.position = 'absolute';
        this.#fpsTimer.style.top = '0px';
        this.#fpsTimer.style.fontSize = '24px';
        document.body.appendChild(this.#fpsTimer);

        if (arguments.length === 0) this.setSize(window.innerWidth, window.innerHeight);
        else this.setSize(width, height);

        this.colour = 'black';
        this.#canvas.style.backgroundColor = this.colour;
        let self = this;
        this.onResize = function ()
        {
            self.setSize(window.innerWidth, window.innerHeight);
        }
        this.fpsVisible(true);
    }

    clear()
    {
        this.#ctx.beginPath();
        this.#ctx.clearRect(0, 0, this.width, this.height);
        if (this.#ctx.fillStyle != this.colour)
        {
            this.#ctx.rect(0, 0, this.width, this.height);
            this.#ctx.fillStyle = this.colour;
            this.#ctx.fill();
        }
    }

    draw(shape)
    {
        shape.draw(this.#ctx);
    }

    run()
    {
        this.running = true;
        this.#start();
        this.#lastCallTime = performance.now();
        this.#fps = 0;
        this.#loop();
    }

    #loop()
    {
        if (this.running)
        {
            this.#update();
            window.requestAnimationFrame(() => this.#loop());
        }
        else 
        {
            this.#end();
            this.#update();
        }

        let delta = (performance.now() - this.#lastCallTime) / 1000;
        this.#lastCallTime = performance.now();
        this.#fps = 1 / delta;
    }

    stop()
    {
        this.running = false;
    }

    #start = () => { };
    #update = () => { };
    #end = () => { };

    onStart(func) { this.#start = func; }
    onUpdate(func) { this.#update = func; }
    onEnd(func) { this.#end = func; }

    getHTMLCanvas()
    {
        return this.#canvas;
    }

    setSize(width, height)
    {
        this.width = width;
        this.height = height;

        this.#canvas.width = this.width;
        this.#canvas.height = this.height;
    }

    setPosition(x, y)
    {
        this.#canvas.style.position = 'absolute';
        this.#canvas.style.top = y;
        this.#canvas.style.left = x;
    }

    setFullscreen(val)
    {
        if (val)
        {
            this.setSize(window.innerWidth, window.innerHeight);
            window.addEventListener('resize', this.onResize, false);
        }
        else
        {
            window.removeEventListener('resize', this.onResize, false);
        }
    }

    fpsVisible(val)
    {
        if (val)
        {
            this.#fpsTimer.style.display = "block";

            let self = this;
            this.#fpsInterval = setInterval(() =>
            {
                self.#fpsTimer.textContent = Math.round(self.#fps);
            }, 100);
        }
        else
        {
            this.#fpsTimer.style.display = "none";

            clearInterval(this.#fpsInterval);
        }
    }
}



class Events 
{
    #lastKey;
    #mouse = {
        position: {
            x: null,
            y: null
        },
        change: {
            x: null,
            y: null
        },
        button: {
            left: false,
            middle: false,
            right: false,
            other: false
        }
    };
    #touch;

    #interval = 50;
    #lastCall = 0;
    #lastKeyPress = 'p';

    constructor(canvas, options)
    {
        this.pressedKeys = {};
        var self = this;
        if (options['keyboard'])
        {
            window.onkeydown = function (e)
            {
                self.pressedKeys[e.key.toLowerCase()] = true;
                self.#lastKey = e.key.toLowerCase();
                self.#lastKeyPress = '';
            };
            window.onkeyup = function (e)
            {
                self.pressedKeys[e.key.toLowerCase()] = false;
                self.#lastKeyPress = e.key;
            };
            window.onblur = function (e)
            {
                self.pressedKeys = {};
            };
        }
        if (options['mouse'])
        {
            let HTMLCanvas = canvas.getHTMLCanvas();
            HTMLCanvas.oncontextmenu = function (e) { e.preventDefault(); e.stopPropagation(); }
            window.onmousemove = function (e)
            {
                if (Date.now() - self.#lastCall > self.#interval)
                {
                    var rect = HTMLCanvas.getBoundingClientRect();
                    let x = Math.round((e.clientX - rect.left) / (rect.right - rect.left) * HTMLCanvas.width);
                    let y = Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * HTMLCanvas.height);
                    if (x <= 0) x = 0;
                    if (y <= 0) y = 0;
                    self.#mouse.position = {
                        x: x,
                        y: y
                    };
                    self.#mouse.change = { x: e.movementX, y: e.movementY };
                    self.#lastCall = Date.now();
                }
            }
            window.onmousedown = function (e)
            {
                let arr = [0, 0, 0, 0];
                let buttons = e.buttons;
                let index = 3;
                for (let i = 16; i >= 1; i /= 2)
                {
                    if (buttons - i >= 0) 
                    {
                        arr[index]++;
                        buttons -= i;
                    }
                    if (i != 16) index--;
                }
                self.#mouse.button.left = Boolean(arr[0]);
                self.#mouse.button.right = Boolean(arr[1]);
                self.#mouse.button.middle = Boolean(arr[2]);
                self.#mouse.button.other = Boolean(arr[3]);
            }
            window.onmouseup = function (e)
            {
                let arr = [0, 0, 0, 0];
                let buttons = e.buttons;
                let index = 3;
                for (let i = 16; i >= 1; i /= 2)
                {
                    if (buttons - i >= 0) 
                    {
                        arr[index]++;
                        buttons -= i;
                    }
                    if (i != 16) index--;
                }
                self.#mouse.button.left = Boolean(arr[0]);
                self.#mouse.button.right = Boolean(arr[1]);
                self.#mouse.button.middle = Boolean(arr[2]);
                self.#mouse.button.other = Boolean(arr[3]);
            }
        }
        if (options['touch'])
        {
            throw 'Touch events are not yet finished';
        }
        if (options['debug'])
        {
            window.onerror = function (msg, url, linenumber)
            {
                alert('Error: ' + msg + '\nFile: ' + url.split('/')[url.split('/').length - 1] + '\nLine: ' + linenumber);
                return true;
            };
        }
    }

    isKeyDown(key)
    {
        return this.pressedKeys[key.toLowerCase()];
    }

    wasKeyPressed(key)
    {
        if (key.toLowerCase() == this.#lastKeyPress.toLowerCase())
        {
            this.#lastKeyPress = '';
            return true;
        }
        else return false;
    }

    getLastKeyPressed()
    {
        return this.#lastKey;
    }

    getMouse()
    {
        return this.#mouse;
    }

    getTouch()
    {
        return this.#touch;
    }

    setCallsPerSecond(number)
    {
        this.#interval = 1000.0 / number;
    }
}



class Util
{
    static delay(func, ms)
    {
        setTimeout(func, ms);
    }
    
    static random(start, end)
    {
        return Math.round(Math.random() * Math.abs(end - start)) + start;
    }

    static objArrayToArray(objArr)
    {
        let arr = [];
        for (let i = 0; i < objArr.length; i++)
        {
            arr.push(objArr[i]().x);
            arr.push(objArr[i]().y);
        }
        return arr;
    }

    static rotatePoint(pt, center, angle)
    {
        if (angle != 0)
        {
            let angle = angle * (Math.PI / 180); // Convert to radians

            let tempX = pt.x - center.x;
            let tempY = pt.y - center.y;

            let rotatedX = Math.cos(angle) * tempX - Math.sin(angle) * tempY + center.x;

            let rotatedY = Math.sin(angle) * tempX + Math.cos(angle) * tempY + center.y;

            return { x: rotatedX, y: rotatedY };
        }
        else return pt;
    }
}



// Drawables
class Shape
{
    constructor()
    {
        this.x = 0;
        this.y = 0;
        this._direction = 0;
        this.colour = "black";
    }

    getPosition()
    {
        return { x: this.x, y: this.y };
    }

    setPosition(x, y)
    {
        this.x = x;
        this.y = y;
    }

    getDirection()
    {
        return this._direction;
    }

    setDirection(degrees)
    {
        this._direction = degrees % 360;
    }

    turn(degrees)
    {
        this._direction = (this._direction + degrees) % 360;
    }

    move(distance)
    {
        let rads = this._direction * (Math.PI / 180);
        this.x += Math.round(distance * Math.sin(rads));
        this.y -= Math.round(distance * Math.cos(rads));
    }
}



class Polygon extends Shape
{
    #dimensions = { minX: null, maxX: null, minY: null, maxY: null };
    constructor(json, x, y)
    {
        super();

        this._points = [];
        this._lines = [];

        this.rOriginX = 0;
        this.rOriginY = 0;

        if (arguments.length > 0) this.setPoints(json);
        if (arguments.length == 3)
        {
            this.x = x;
            this.y = y;
        }
    }

    addPoint(x, y)
    {
        if (x > this.#dimensions.maxX) this.#dimensions.maxX = x;
        else if (x < this.#dimensions.minX) this.#dimensions.minX = x;
        if (y > this.#dimensions.maxY) this.#dimensions.maxY = y;
        else if (y < this.#dimensions.minY) this.#dimensions.minY = y;
        this.rOriginX = (this.#dimensions.maxX - this.#dimensions.minX) / 2;
        this.rOriginY = (this.#dimensions.maxY - this.#dimensions.minY) / 2;

        if (arguments.length == 1)
        {
            this._points.push(() => { return this.rotatePoint({ x: this.x + x.x, y: this.y + x.y }) });
            return true;
        }
        else if (arguments.length == 2)
        {
            this._points.push(() => { return this.rotatePoint({ x: this.x + x, y: this.y + y }) });
            return true;
        }
        return false;
    }

    setPoints(json)
    {
        this._points = [];
        let self = this;
        this.#dimensions.minX = json[0].x;
        this.#dimensions.maxX = json[0].x;
        this.#dimensions.minY = json[0].y;
        this.#dimensions.maxY = json[0].y;

        json.forEach(point =>
        {
            if (point.x > this.#dimensions.maxX) this.#dimensions.maxX = point.x;
            else if (point.x < this.#dimensions.minX) this.#dimensions.minX = point.x;
            if (point.y > this.#dimensions.maxY) this.#dimensions.maxY = point.y;
            else if (point.y < this.#dimensions.minY) this.#dimensions.minY = point.y;

            this._points.push(() => { return this.rotatePoint({ x: this.x + point.x, y: this.y + point.y }) });
        });
        this._points.forEach(function (point, i)
        {
            if (i < self._points.length - 1)
            {
                self._lines.push(() => { return [point, self._points[i + 1]]; });
            }
        });
        this._lines.push(() => { return [this._points[this._points.length - 1], this._points[0]]; });

        this.rOriginX = (this.#dimensions.maxX - this.#dimensions.minX) / 2;
        this.rOriginY = (this.#dimensions.maxY - this.#dimensions.minY) / 2;
    }

    contains(point)
    {
        let context = document.getElementById('Infinite').getContext("2d");
        context.save();

        this.draw(context);
        let val = context.isPointInPath(point.x, point.y);

        context.restore();
        return val;
    }

    intersects(shape)
    {
        
        if (shape instanceof Sprite) shape = shape.getHitbox();

        if (shape instanceof Rectangle)
        {
            if (isPolygonConvex(this._points))
            {
                return Intersects.polygonPolygon(Util.objArrayToArray(this._points), Util.objArrayToArray(shape._points));
            }
            else
            {
                if (shape.contains(this._points[0]()) || this.contains(shape._points[0]())) return true;
                for (let i = 0; i < this._lines.length; i++)
                {
                    for (let j = 0; j < shape._lines.length; j++)
                    {
                        if (shape.intersectLines(this._lines[i], shape._lines[j]))
                        {
                            return true;
                        }
                    };
                };
            }
        }
        else if (shape instanceof Polygon)
        {
            if (isPolygonConvex(this._points) && isPolygonConvex(shape._points))
            {
                return Intersects.polygonPolygon(Util.objArrayToArray(this._points), Util.objArrayToArray(shape._points));
            }
            else
            {
                if (shape.contains(this._points[0]()) || this.contains(shape._points[0]())) return true;
                for (let i = 0; i < this._lines.length; i++)
                {
                    for (let j = 0; j < shape._lines.length; j++)
                    {
                        if (shape.intersectLines(this._lines[i], shape._lines[j]))
                        {
                            return true;
                        }
                    };
                };
            }
        }
        else if (shape instanceof Circle)
        {
            return Intersects.polygonCircle(Util.objArrayToArray(this._points), shape.x + shape.radius, shape.y + shape.radius, shape.radius, 0.0001);
        }
        return null;
    }

    intersectLines()
    {
        let p1, p2, p3, p4;
        if (arguments.length == 2)
        {
            p1 = arguments[0]()[0]();
            p2 = arguments[0]()[1]();
            p3 = arguments[1]()[0]();
            p4 = arguments[1]()[1]();
        }

        var det, gamma, lambda;
        det = (p2.x - p1.x) * (p4.y - p3.y) - (p4.x - p3.x) * (p2.y - p1.y);
        if (det === 0)
        {
            return false;
        } else
        {
            lambda = ((p4.y - p3.y) * (p4.x - p1.x) + (p3.x - p4.x) * (p4.y - p1.y)) / det;
            gamma = ((p1.y - p2.y) * (p4.x - p1.x) + (p2.x - p1.x) * (p4.y - p1.y)) / det;
            return (0 <= lambda && lambda <= 1) && (0 <= gamma && gamma <= 1);
        }
    }

    rotatePoint(pt)
    {
        if (this._direction != 0)
        {
            let angle = this._direction * (Math.PI / 180); // Convert to radians

            let ox = this.x + this.rOriginX;
            let oy = this.y + this.rOriginY;
            let tempX = pt.x - ox;
            let tempY = pt.y - oy;

            let rotatedX = Math.cos(angle) * tempX - Math.sin(angle) * tempY + ox;

            let rotatedY = Math.sin(angle) * tempX + Math.cos(angle) * tempY + oy;

            return { x: rotatedX, y: rotatedY };
        }
        else return pt;
    }

    getWidth() { return this.#dimensions.maxX - this.#dimensions.minX; }
    getHeight() { return this.#dimensions.maxY - this.#dimensions.minY; }

    draw(ctx)
    {
        ctx.save();
        ctx.beginPath();

        ctx.fillStyle = this.colour;
        ctx.moveTo(this._points[0]().x, this._points[0]().y);
        this._points.forEach(function (point, i)
        {
            if (i != 0)
                ctx.lineTo(point().x, point().y);
        });
        if (this._points.length < 3 || (arguments.length == 2 && arguments[1] == "mask")) ctx.stroke();
        else ctx.fill();

        ctx.restore();
    }
}


class Rectangle extends Polygon
{
    #width = 0;
    #height = 0;
    constructor(width, height, x, y)
    {
        super([{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }]);
        this.#width = width;
        this.#height = height;
        if (arguments.length == 4)
        {
            this.x = x;
            this.y = y;
        }

        this.rOriginX = this.#width / 2;
        this.rOriginY = this.#height / 2;
    }

    getSize()
    {
        return { width: this.#width, height: this.#height }
    }

    setSize(width, height)
    {
        this.#width = width;
        this.#height = height;
        this.setPoints([{ x: 0, y: 0 }, { x: this.#width, y: 0 }, { x: this.#width, y: this.#height }, { x: 0, y: this.#height }]);
    }

    setWidth(width)
    {
        this.#width = width;
        this.setPoints([{ x: 0, y: 0 }, { x: this.#width, y: 0 }, { x: this.#width, y: this.#height }, { x: 0, y: this.#height }]);
    }

    setHeight(height)
    {
        this.#height = height;
        this.setPoints([{ x: 0, y: 0 }, { x: this.#width, y: 0 }, { x: this.#width, y: this.#height }, { x: 0, y: this.#height }]);
    }

    contains(point)
    {
        let context = document.getElementById('Infinite').getContext("2d");
        let cx = this.x + 0.5 * this.#width;
        let cy = this.y + 0.5 * this.#height;

        context.save();

        context.translate(cx, cy);
        context.rotate(this._direction * (Math.PI / 180));
        context.translate(-cx, -cy);

        context.beginPath();
        context.rect(this.x, this.y, this.#width, this.#height);
        let val = context.isPointInPath(point.x, point.y);

        context.restore();
        return val;
    }

    draw(context)
    {
        let cx = this.x + 0.5 * this.#width;
        let cy = this.y + 0.5 * this.#height;

        context.save();

        context.translate(cx, cy);
        context.rotate(this._direction * (Math.PI / 180));
        context.translate(-cx, -cy);

        context.beginPath();
        context.fillStyle = this.colour;
        if (arguments.length == 2 && arguments[1] == "mask") context.rect(this.x, this.y, this.#width, this.#height);
        else context.fillRect(this.x, this.y, this.#width, this.#height);

        context.restore();
    }
}



class Circle extends Shape
{
    constructor(radius)
    {
        super();
        this.radius = radius;
    }

    getBounds()
    {
        return { top: this.y, right: this.x + this.radius * 2, bottom: this.y + this.radius * 2, left: this.x }
    }

    // TODO implement circle intersects for concave polygons and re-look at circle intersects in general
    intersects(shape)
    {
        if (shape instanceof Sprite) shape = shape.getHitbox();

        if (shape instanceof Rectangle)
        {
            return Intersects.polygonCircle(Util.objArrayToArray(shape._points), this.x + this.radius, this.y + this.radius, this.radius, 0.0001);
        }
        else if (shape instanceof Polygon)
        {
            if (isPolygonConvex(shape._points))
                return Intersects.polygonCircle(Util.objArrayToArray(shape._points), this.x + this.radius, this.y + this.radius, this.radius, 0.0001);
            else throw "Circle and Concave-Polygon intersects are not yet finished";
        }
        else if (shape instanceof Circle)
        {
            return Intersects.circleCircle(this.x + this.radius, this.y + this.radius, this.radius, shape.x + shape.radius, shape.y + shape.radius, shape.radius);
        }
        return null;
    }

    contains(point)
    {
        let context = document.getElementById('Infinite').getContext("2d");
        context.save();

        context.beginPath();
        context.arc(this.x + this.radius, this.y + this.radius, this.radius, 0, 2 * Math.PI);
        let val = context.isPointInPath(point.x, point.y);

        context.restore();
        return val;
    }

    draw(context)
    {
        context.fillStyle = this.colour;
        context.beginPath();
        context.arc(this.x + this.radius, this.y + this.radius, this.radius, 0, 2 * Math.PI);
        context.fill();
    }
}



class Sprite extends Shape
{
    #img = new Image();
    #hitbox;
    #imageArea;

    constructor(src, width, height)
    {
        super();
        this.#img.src = src;
        this.showHitbox = false;
        this.doesHitboxScale = true;

        if (arguments.length >= 3)
        {
            this.width = width;
            this.height = height;
        }
        else
        {
            this.width = this.#img.width;
            this.height = this.#img.height;
        }
        

        this.#hitbox = new Rectangle(this.width, this.height, 0 ,0);
        this.#hitbox.colour = 'rgba(255, 0, 0, 0.4)';

        this.#imageArea = new Rectangle(this.width, this.height);
        this.#imageArea.colour = 'rgba(0, 0, 0, 0.0)';
        this.setImageDimensions(0, 0, this.width, this.height);
    }

    setImageDimensions(x, y, width, height)
    {
        this.sourceX = x;
        this.sourceY = y;
        this.sourceWidth = width;
        this.sourceHeight = height;
    }

    setHitbox(shape)
    {
        if (shape instanceof Shape && shape.constructor.name != "Shape")
        {
            this.#hitbox = shape;
            if (this.#hitbox.colour.toLowerCase() == "black")
                this.#hitbox.colour = 'rgba(255, 0, 0, 0.4)';
            return true;
        }
        else return false;
    }

    getHitbox()
    {
        return this.#hitbox;
    }

    setImageArea(shape)
    {
        if (shape instanceof Shape && shape.constructor.name != "Shape")
        {
            this.#imageArea = shape;
            return true;
        }
        else return false;
    }

    getImageArea()
    {
        return this.#imageArea;
    }

    getSize()
    {
        return { width: this.width, height: this.height }
    }

    setSize(width, height)
    {
        if (this.doesHitboxScale)
        {
            this.#hitbox.width *= (width / this.width);
            this.#hitbox.height *= (height / this.height);
        }
        this.width = width;
        this.height = height;
        this.#hitbox = new Rectangle(this.width, this.height, 0 ,0);
    }

    setWidth(width)
    {
        if (this.doesHitboxScale)
        {
            this.#hitbox.width *= (width / this.width);
        }
        this.width = width;
        this.#hitbox = new Rectangle(this.width, this.height, 0 ,0);
    }

    setHeight(height)
    {
        if (this.doesHitboxScale)
        {
            this.#hitbox.height *= (height / this.height);
        }
        this.height = height;
        this.#hitbox = new Rectangle(this.width, this.height, 0 ,0);
    }

    setImage(img)
    {
        if (typeof img == "string") this.#img.src = img;
        else if (typeof img == "object" && img.constructor.name == "HTMLImageElement") this.#img = img;
        else return false;
        return true;
    }

    intersects(shape)
    {
        return this.#hitbox.intersects(shape);
    }

    draw(context)
    {
        // Update hitbox information
        this.#hitbox.x += this.x;
        this.#hitbox.y += this.y;

        context.save();

        context.translate(-this.#imageArea._points[0]().x, -this.#imageArea._points[0]().y);
        this.#imageArea.draw(context, "mask");
        context.clip();
        context.drawImage(this.#img, this.x, this.y, this.#img.width, this.#img.height);
        // context.drawImage(this.#img, this.sourceX, this.sourceY, this.sourceWidth, this.sourceHeight, this.x, this.y, this.#img.width, this.#img.height);

        context.restore();

        // Check if hitbox is shown
        if (this.showHitbox) this.#hitbox.draw(context);

        // Update hitbox information
        this.#hitbox.x -= this.x;
        this.#hitbox.y -= this.y;
    }
}



class DisplayText
{
    constructor()
    {
        if (arguments == 0) this.value = "";
        else this.value = arguments[0];

        this.size = 30;
        this.font = "Arial";
        this.colour = "black";
        this.setPosition(0, 0);
    }

    setPosition(x, y)
    {
        this.x = x;
        this.y = y + this.size;
    }

    draw(context)
    {
        context.font = this.size + "px " + this.font;
        context.fillStyle = this.colour;
        context.fillText(this.value, this.x, this.y);
    }
}

// context.save();
// context.beginPath();
// context.arc(25, 25, 25, 0, Math.PI * 2, true);
// context.closePath();
// context.clip();

// context.drawImage(this.#img, this.sourceX, this.sourceY, this.sourceWidth, this.sourceHeight, this.x, this.y, this.#img.width, this.#img.height);

// context.beginPath();
// context.arc(0, 0, 25, 0, Math.PI * 2, true);
// context.clip();
// context.closePath();
// context.restore();
window.Canvas = Canvas;
window.Events = Events;
window.Sprite = Sprite;
export { Canvas, Events, Sprite };