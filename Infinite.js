// TODO list
// -------------------------------------------------------------------
// Current Refactor everything specifically; class constructors should be
//         given proper error detection for their argument list
//       - DONE Canvas constructor
//       - TODO Everything else

// TODO Create way to map touch controls to KBMS so code can be
//      written once and made cross platform easily 
// TODO Improve/Finish touch events/controls in Events class - current
//      support is very basic
// TODO Add touch joysticks for touch game support
// TODO Flesh out Util class with more backend functions
// TODO Rewrite/add more feature to the DisplayText class
// TODO Move isConvexPoly out of intersects and run it after shape is
//      modified to reduce calls
// TODO Look through code for ways to improve performance
// TODO Add multiple canvas support so UI can be separate
// TODO Redesign Sprite getHitbox and how a sprites hitbox data is stored
//      because it's currently inefficient and could lead to small bugs
// TODO There could be problems with shape center points and their shapes
//      intersects (Circle class). Might seperate the center property into
//      independent rotation and center points
// TODO Split Infinite.js into multiple files to improve readability

// MAYBE Add integrated network support using websockets or socket.io
// MAYBE Use OffscreenCanvas to offload rendering to worker thread for performance

import './Intersects/umd/intersects.min.js';

var styles  = document.createElement("style");
styles.id = "Infinite-Styles" ;
styles.innerHTML = "[class^='Infinite-'] { position: absolute; top: 0; left: 0; margin: 0%; padding: 0%; }\n" +
                   ".Infinite-Canvas { background-color: 'black'; }\n" +
                   ".Infinite-UI { width: 100%; height: 100%; }\n" +
                   ".Infinite-FPS { font-size: 24px; }";
document.getElementsByTagName("HEAD")[0].appendChild(styles);


class Canvas
{
    #id;
    #num;
    #infinite;
    #canvas;
    #ctx;
    #camera;
    #ui;

    #fps;
    #fpsInterval;
    #fpsTimer;
    #lastCallTime;

    static #count = 0;
    static stopAll = false;

    constructor(width = window.innerWidth, height = window.innerHeight, id = "Infinite")
    {
        if (arguments.length == 1 && typeof arguments[0] == "string")
        {
            id = arguments[0];
            width = window.innerWidth;
            height = window.innerHeight;
        }
        if (arguments.length == 3 && typeof arguments[0] == "string" && typeof arguments[1] == "number" && typeof arguments[2] == "number")
        {
            id = arguments[0];
            width = arguments[1];
            height = arguments[2];
        }

        this.#num = ++Canvas.#count;
        if (id == "Infinite") this.#id = "Infinite-" + this.#num;
        else this.#id = id;

        this.#infinite = document.getElementById(id);
        if (this.#infinite !== null)
        {
            // Find/Fix wrapper
            this.#infinite.id = this.#id;
            if (this.#infinite.tagName != "DIV")
            {
                let temp = document.createElement("div");
                temp.id = this.#infinite.id;
                temp.innerHTML = this.#infinite.innerHTML;
                this.#infinite.replaceWith(temp);
                this.#infinite = temp;
            }

            // Create/Find canvas
            this.#canvas = this.#infinite.getElementsByTagName("canvas")[0];
            if (this.#canvas === null || this.#canvas === undefined)
            {
                this.#canvas = document.createElement("canvas");
                this.#canvas.className = "Infinite-Canvas";
                this.#infinite.prepend(this.#canvas);
            }
            else if (!this.#canvas.classList.contains("Infinite-Canvas"))
            {
                this.#canvas.className = "Infinite-Canvas " + this.#canvas.className; 
            }

            // Create/Find canvas
            this.#ui = this.#infinite.getElementsByClassName("Infinite-UI")[0];
        }
        else
        {
            this.#infinite = document.createElement("div");
            this.#infinite.id = this.#id;

            this.#canvas = document.createElement("canvas");
            this.#canvas.className = "Infinite-Canvas";
            this.#infinite.appendChild(this.#canvas);

            document.body.appendChild(this.#infinite);
        }

        // Finish Infinite elements
        this.#canvas.tabIndex = '1';
        this.#ctx = this.#canvas.getContext("2d", { alpha: false });

        // FPS 
        this.#fpsTimer = document.createElement("div");
        this.#fpsTimer.className = "Infinite-FPS";
        this.#infinite.appendChild(this.#fpsTimer);

        // Canvas properties
        this.colour = 'black';

        this.setSize(width, height);

        if (arguments.length < 2)
        {
            let self = this;
            window.onresize = function (event)
            {
                self.setSize(window.innerWidth, window.innerHeight);
            };
        }
        this.fpsVisible(true);
        this.hide();

        this.#camera = new Camera(this.width, this.height);
    }

    clear()
    {
        this.#ctx.setTransform(1, 0, 0, 1, 0, 0);

        this.#ctx.beginPath();
        this.#ctx.clearRect(0, 0, this.width, this.height);
        if (this.#ctx.fillStyle != this.colour)
        {
            this.#ctx.rect(0, 0, this.width, this.height);
            this.#ctx.fillStyle = this.colour;
            this.#ctx.fill();
        }

        let cPos = this.#camera.getPosition();
        let cRot = this.#camera.getRotation();
        let cSize = this.#camera.getSize();

        this.#ctx.translate(-cPos.x, -cPos.y);
        this.#ctx.scale(this.width / cSize.width, this.height / cSize.height);
        this.#ctx.rotate(cRot * Math.PI / 180);
    }

    draw(shape)
    {
        shape.draw(this.#ctx);
    }

    run()
    {
        Canvas.stopAll = false;
        this.running = true;
        this.show();
        this.#start();
        this.#lastCallTime = performance.now();
        this.#fps = 0;
        this.#loop();
    }

    #loop()
    {
        if (this.running && !Canvas.stopAll)
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

    getCamera()
    {
        return this.#camera;
    }

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
        this.#infinite.style.top = y;
        this.#infinite.style.left = x;
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
            }, 200);
        }
        else
        {
            this.#fpsTimer.style.display = "none";

            clearInterval(this.#fpsInterval);
        }
    }

    hide()
    {
        this.#canvas.style.display = "none";
        this.#fpsTimer.style.display = "none";
    }

    show()
    {
        this.#canvas.style.display = "block"; 
        this.#fpsTimer.style.display = "block";
    }

    getUI()
    {
        return this.#ui;
    }
}



class Events 
{
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
    #touch = {
        isTouch: false,
        position: {
            x: null,
            y: null
        },
        change: {
            x: null,
            y: null
        }
    };

    #interval = 50;
    #lastCall = 0;

    #lastKeyDown;
    #lastKeyPress = 'p';

    constructor(canvas, options)
    {
        this.pressedKeys = {};
        var self = this;
        let HTMLCanvas = canvas.getHTMLCanvas();

        if (options['keyboard'])
        {
            window.onkeydown = function (e)
            {
                self.pressedKeys[e.key.toLowerCase()] = true;
                self.#lastKeyDown = e.key.toLowerCase();
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
            window.ontouchstart = function (evt)
            {
                let e = evt.changedTouches[0];

                var rect = HTMLCanvas.getBoundingClientRect();
                let x = Math.round((e.clientX - rect.left) / (rect.right - rect.left) * HTMLCanvas.width);
                let y = Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * HTMLCanvas.height);
                if (x <= 0) x = 0;
                if (y <= 0) y = 0;
                self.#touch.isTouch = true;
                self.#touch.change = {
                    x: x - self.#touch.position.x,
                    y: y - self.#touch.position.y
                };
                self.#touch.position = {
                    x: x,
                    y: y
                };
            }
            window.ontouchend = function (evt)
            {
                let e = evt.changedTouches[0];

                var rect = HTMLCanvas.getBoundingClientRect();
                let x = Math.round((e.clientX - rect.left) / (rect.right - rect.left) * HTMLCanvas.width);
                let y = Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * HTMLCanvas.height);
                if (x <= 0) x = 0;
                if (y <= 0) y = 0;

                if (evt.targetTouches.length == 0) self.#touch.isTouch = false;
                self.#touch.change = {
                    x: x - self.#touch.position.x,
                    y: y - self.#touch.position.y
                };
                self.#touch.position = {
                    x: x,
                    y: y
                };
            }
            window.ontouchmove = function (evt)
            {
                let e = evt.changedTouches[0];

                var rect = HTMLCanvas.getBoundingClientRect();
                let x = Math.round((e.clientX - rect.left) / (rect.right - rect.left) * HTMLCanvas.width);
                let y = Math.round((e.clientY - rect.top) / (rect.bottom - rect.top) * HTMLCanvas.height);
                if (x <= 0) x = 0;
                if (y <= 0) y = 0;

                self.#touch.isTouch = true;
                self.#touch.change = {
                    x: x - self.#touch.position.x,
                    y: y - self.#touch.position.y
                };
                self.#touch.position = {
                    x: x,
                    y: y
                };
            }
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
        return this.#lastKeyDown;
    }

    getKeyboard()
    {
        return this.pressedKeys;
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



class Camera
{
    #width; #height;
    #x; #y;
    #rotation;
    #shape = null;

    constructor(width = window.innerWidth, height = window.innerHeight)
    {
        this.setSize(width, height);
        this.setPosition(0, 0);
        this.setRotation(0);
    }

    setPosition(x, y)
    {
        this.#x = x;
        this.#y = y;
    }

    track(shape)
    {
        this.#shape = shape;
    }

    getPosition()
    {
        if (this.#shape != null) return {
            x: this.#shape.x - this.#width / 2 + this.#shape.getWidth() * this.#shape._scale.x / 2,
            y: this.#shape.y - this.#height / 2 + this.#shape.getHeight() * this.#shape._scale.y / 2
        };
        return { x: this.#x, y: this.#y };
    }

    setSize(width, height)
    {
        this.#width = width;
        this.#height = height;
    }

    move(x = 0, y = 0)
    {
        this.#x += x;
        this.#y += y;
    }

    getSize()
    {
        return { width: this.#width, height: this.#height };
    }

    setRotation(rotation)
    {
        this.#rotation = rotation % 360;
    }

    getRotation()
    {
        return this.#rotation;
    }
}



class Util
{
    static delay(func, ms)
    {
        setTimeout(func, ms);
    }

    static repeat(func, ms = 100, condition)
    {
        if (arguments.length < 3)
        {
            return setInterval(func, ms);
        }
        else
        {
            if (typeof condition == "number")
            {
                var num = 0;
                var val = setInterval(() =>
                {
                    func();
                    if (++num == condition) clearInterval(val);
                }, ms);
                return val;
            }
            else if (typeof condition == "function")
            {
                var val = setInterval(() =>
                {
                    func();
                    if (condition()) 
                    {
                        clearInterval(val);
                    }
                }, ms);
                return val;
            }
            return setInterval(func, ms);
        }
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

    static calculateAllCrossProduct(points)
    {
        var lastSign = null;
        for (var i = 2; i < points.length; i++)
        {
            // Calculate crossproduct from 3 consecutive points
            var crossproduct = Util.calculateCrossProduct(points[i - 2](), points[i - 1](), points[i]());
            var currentSign = Math.sign(crossproduct);
            if (lastSign == null)
            {
                // Last sign init
                lastSign = currentSign;
            }

            if (lastSign !== currentSign)
            {
                // Different sign in cross products,no need to check the remaining points --> concave polygon --> return function
                return false;
            }
            lastSign = currentSign;
        }

        // First point must check between second and last point, this is the last 3 points that can break convexity
        var crossproductFirstPoint = Util.calculateCrossProduct(points[points.length - 2](), points[0](), points[1]());

        // I changed this because when a straight line had 3 points in it instead of the typical 2 it would return not a convex polygon
        return lastSign >= 0 && Math.sign(crossproductFirstPoint) >= 0;
        // return checkCrossProductSign(lastSign, Math.sign(crossproductFirstPoint));
    }

    static calculateCrossProduct(p1, p2, p3)
    {
        var dx1 = p2.x - p1.x;
        var dy1 = p2.y - p1.y;
        var dx2 = p3.x - p2.x;
        var dy2 = p3.y - p2.y;

        var zcrossproduct = dx1 * dy2 - dy1 * dx2;
        return zcrossproduct;
    }

    static isPolygonConvex(points)
    {
        // Added this because it doesn't check the first and last points angle
        points.push(points[0]);
        let val = Util.calculateAllCrossProduct(points);
        points.pop();
        return val;
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

        this._scale = { x: 1.0, y: 1.0 };

        this._center = { x: 0, y: 0 };
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
        return this._direction % 360;
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

    getScale()
    {
        return this._scale;
    }

    setScale(scaleX, scaleY)
    {
        this._scale.x = scaleX;
        this._scale.y = scaleY;
    }

    getCenter()
    {
        return { x: this._center.x + this.x, y: this._center.y + this.y };
    }

    setCenter(x, y)
    {
        this._center = { x: x, y: y };
    }
}



class Line
{
    constructor(x1 = 0, y1 = 0, x2 = 0, y2 = 0, colour = 'black')
    {
        this.x1 = x1;
        this.y1 = y1;
        this.x2 = x2;
        this.y2 = y2;
        this.colour = colour;
    }

    intersects(shape)
    {
        if (shape instanceof Sprite) shape = shape.getHitbox();

        if (shape instanceof Polygon)
        {
            if (Util.isPolygonConvex(shape._points))
            {
                return Intersects.linePolygon(this.x1, this.y1, this.x2, this.y2, Util.objArrayToArray(shape._points), 0.0001);
            }
            else
            {
                if (shape.contains({ x: this.x1, y: this.y1 }) || shape.contains({ x: this.x2, y: this.y2 })) return true;
                for (let i = 0; i < shape._lines.length; i++)
                {
                    let p1 = shape._lines[i]()[0]();
                    let p2 = shape._lines[i]()[1]();
                    if (Intersects.lineLine(this.x1, this.y1, this.x2, this.y2, p1.x, p1.y, p2.x, p2.y, 1, 1))
                    {
                        return true;
                    }
                };
                return false;
            }
        }
        else if (shape instanceof Circle)
        {
            return Intersects.lineCircle(this.x1, this.y1, this.x2, this.y2, shape.x + shape.radius, shape.y + shape.radius, shape.radius);
        }
        else if (shape instanceof Line)
        {
            return Intersects.lineLine(this.x1, this.y1, this.x2, this.y2, shape.x1, shape.y1, shape.x2, shape.y2, 1, 1)
        }
        return null;
    }

    draw(ctx)
    {
        ctx.beginPath();
        ctx.lineWidth = this.width;
        ctx.strokeStyle = this.colour;
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
    }
}



class Polygon extends Shape
{
    #dimensions = { minX: null, maxX: null, minY: null, maxY: null };
    constructor(json = [], x = 0, y = 0)
    {
        super();

        this._points = [];
        this._lines = [];

        this.x = x;
        this.y = y;
        this.setPoints(json);
    }

    addPoint(x, y)
    {
        if (this.#dimensions.minX == null)
        {
            this.#dimensions.maxX = x;
            this.#dimensions.minX = x;
            this.#dimensions.maxY = y;
            this.#dimensions.minY = y;
        }
        else
        {
            if (x > this.#dimensions.maxX) this.#dimensions.maxX = x;
            else if (x < this.#dimensions.minX) this.#dimensions.minX = x;
            if (y > this.#dimensions.maxY) this.#dimensions.maxY = y;
            else if (y < this.#dimensions.minY) this.#dimensions.minY = y;
        }

        this._center.x = (this.#dimensions.maxX - this.#dimensions.minX) / 2 * Math.abs(this._scale.x);
        this._center.y = (this.#dimensions.maxY - this.#dimensions.minY) / 2 * Math.abs(this._scale.y);

        if (arguments.length == 2)
        {
            this._points.push(() => { return this.#rotatePoint({ x: this.x + (x * Math.abs(this._scale.x)), y: this.y + (y * Math.abs(this._scale.y)) }) });
            return true;
        }
        return false;
    }

    setPoints(json)
    {
        if (Array.isArray(json) && json.length > 2)
        {
            this.json = json;
            this._points = [];
            this._lines = [];

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

                this._points.push(() => { return this.#rotatePoint({ x: this.x + (point.x * Math.abs(this._scale.x)), y: this.y + (point.y * Math.abs(this._scale.y)) }) });
            });

            if (this._points.length < 3)
            {
                this._points.forEach(function (point, i)
                {
                    if (i < self._points.length - 1)
                    {
                        self._lines.push(() => { return [point, self._points[i + 1]]; });
                    }
                });
                this._lines.push(() => { return [this._points[this._points.length - 1], this._points[0]]; });

                this._center.x = (this.#dimensions.maxX - this.#dimensions.minX) / 2 * Math.abs(this._scale.x);
                this._center.y = (this.#dimensions.maxY - this.#dimensions.minY) / 2 * Math.abs(this._scale.y);
            }
            return true;
        }
        return false;
    }

    contains(point)
    {
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");

        this.draw(context);
        let val = context.isPointInPath(point.x, point.y);

        return val;
    }

    intersects(shape)
    {
        if (shape instanceof Sprite) 
        {
            shape = shape.getHitbox();
        }

        if (shape instanceof Polygon)
        {
            if (Util.isPolygonConvex(this._points) && Util.isPolygonConvex(shape._points))
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
                        let p1 = this._lines[i]()[0]();
                        let p2 = this._lines[i]()[1]();
                        let p3 = shape._lines[j]()[0]();
                        let p4 = shape._lines[j]()[1]();

                        if (Intersects.lineLine(p1.x, p1.y, p2.x, p2.y, p3.x, p3.y, p4.x, p4.y, 1, 1))
                        {
                            return true;
                        }
                    };
                };
                return false;
            }
        }
        else if (shape instanceof Circle)
        {
            if (Util.isPolygonConvex(this._points))
            {
                return Intersects.polygonCircle(Util.objArrayToArray(this._points), shape.x + shape.radius, shape.y + shape.radius, shape.radius, 0.0001);
            }
            else
            {
                if (shape.contains(this._points[0]()) || this.contains(shape.getCenter())) return true;
                for (let i = 0; i < this._lines.length; i++)
                {
                    let p1 = this._lines[i]()[0]();
                    let p2 = this._lines[i]()[1]();
                    if (Intersects.lineCircle(p1.x, p1.y, p2.x, p2.y, shape.x + shape.radius, shape.y + shape.radius, shape.radius)) return true;
                }
                return false;
            }
        }
        else if (shape instanceof Line)
        {
            if (Util.isPolygonConvex(this._points))
            {
                return Intersects.polygonLine(Util.objArrayToArray(this._points), shape.x1, shape.y1, shape.x2, shape.y2, 0.0001);
            }
            else
            {
                if (this.contains({ x: shape.x1, y: shape.y1 }) || this.contains({ x: shape.x2, y: shape.y2 })) return true;
                for (let i = 0; i < this._lines.length; i++)
                {
                    let p1 = this._lines[i]()[0]();
                    let p2 = this._lines[i]()[1]();
                    if (Intersects.lineLine(p1.x, p1.y, p2.x, p2.y, shape.x1, shape.y1, shape.x2, shape.y2, 1, 1))
                    {
                        return true;
                    }
                };
                return false;
            }
        }
        return null;
    }

    #rotatePoint(pt)
    {
        if (this.getDirection() != 0)
        {
            let angle = this._direction * (Math.PI / 180); // Convert to radians

            let o = this.getCenter();
            let tempX = pt.x - o.x;
            let tempY = pt.y - o.y;

            let rotatedX = Math.cos(angle) * tempX - Math.sin(angle) * tempY + o.x;
            let rotatedY = Math.sin(angle) * tempX + Math.cos(angle) * tempY + o.y;

            return { x: rotatedX, y: rotatedY };
        }
        else return pt;
    }

    getWidth() { return (this.#dimensions.maxX - this.#dimensions.minX); }
    getHeight() { return (this.#dimensions.maxY - this.#dimensions.minY); }

    draw(ctx)
    {
        if (arguments.length == 2 && arguments[1] == "mask")
        {
            ctx.moveTo(this._points[0]().x, this._points[0]().y);
            this._points.forEach(function (point, i)
            {
                if (i != 0)
                    ctx.lineTo(point().x, point().y);
            });
            ctx.closePath();
        }
        else
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
            if (this._points.length < 3) ctx.stroke();
            else ctx.fill();

            ctx.restore();
        }
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

        this._center.x = this.#width / 2;
        this._center.y = this.#height / 2;
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
        this.setSize(width, this.#height);
    }

    setHeight(height)
    {
        this.setSize(this.#width, height);
    }
    
    // getWidth() { return this.#width * this._scale.x; }
    // getHeight() { return this.#height * this._scale.y; }

    // setScale(scaleX, scaleY)
    // {
    //     super.setScale(scaleX, scaleY);
        
    // }

    draw(context)
    {
        if (arguments.length == 2 && arguments[1] == "mask") super.draw(context, arguments[1]);
        else super.draw(context);
    }
}



class Circle extends Shape
{
    constructor(radius, x, y)
    {
        super();
        this.radius = radius;
        this.setCenter(radius, radius);

        if (arguments.length > 2)
        {
            this.x = x;
            this.y = y;
        }
    }

    getBounds()
    {
        return { top: this.y, right: this.x + this.radius * 2, bottom: this.y + this.radius * 2, left: this.x }
    }

    intersects(shape)
    {
        if (shape instanceof Sprite) shape = shape.getHitbox();

        if (shape instanceof Polygon)
        {
            if (Util.isPolygonConvex(shape._points))
            {
                return Intersects.circlePolygon(this.x + this.radius, this.y + this.radius, this.radius, Util.objArrayToArray(shape._points));
            }
            else
            {
                if (this.contains(shape._points[0]()) || shape.contains(this.getCenter())) return true;
                for (let i = 0; i < shape._lines.length; i++)
                {
                    let p1 = shape._lines[i]()[0]();
                    let p2 = shape._lines[i]()[1]();
                    if (Intersects.lineCircle(p1.x, p1.y, p2.x, p2.y, this.x + this.radius, this.y + this.radius, this.radius)) return true;
                }
                return false;
            }
        }
        else if (shape instanceof Circle)
        {
            return Intersects.circleCircle(this.x + this.radius, this.y + this.radius, this.radius, shape.x + shape.radius, shape.y + shape.radius, shape.radius);
        }
        else if (shape instanceof Line)
        {
            return Intersects.circleLine(this.x + this.radius, this.y + this.radius, this.radius, shape.x1, shape.y1, shape.x2, shape.y2);
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



class Texture
{
    #img = new Image();
    #area;

    constructor(src)
    {
        if (src instanceof String || typeof src == "string")
        {
            return (async () =>
            {
                this.#img = await this.loadTexture(src);

                return this;
            })();
        }
        else if (src instanceof Image) this.#img = src;
        else if (src instanceof Texture) this.#img = src.getImage();
    }

    loadTexture(src)
    {
        if (src instanceof String || typeof src == "string")
        {
            return new Promise((resolve, reject) =>
            {
                let img = new Image();
                img.onload = () => resolve(img);
                img.onerror = () => reject(new Error("loadTexture couldn't find the source file"));
                img.src = src;
            })
        }
        else
        {
            throw new Error("Invalid source in loadTexture");
        }
    }

    setImage(image)
    {
        this.#img = image;
    }

    getImage()
    {
        return this.#img;
    }

    setArea(shape)
    {
        this.#area = shape;
    }

    getArea(shape)
    {
        if (arguments.length == 0)
        {
            let canvas = document.createElement("canvas");
            let context = canvas.getContext("2d");

            canvas.width = this.#area.getWidth();
            canvas.height = this.#area.getHeight();
    
            context.translate(-this.#area.x,-this.#area.y);
            this.#area.draw(context);
            context.clip();
            context.drawImage(this.#img, 0,0);
    
            return canvas;
        }
        else
        {
            let canvas = document.createElement("canvas");
            let context = canvas.getContext("2d");

            canvas.width = this.#area.getWidth();
            canvas.height = this.#area.getHeight();
    
            context.translate(-shape.x,-shape.y);
            shape.draw(context);
            context.clip();
            context.drawImage(this.#img, 0, 0);
    
            return canvas;
        }
    }
}



class Sprite extends Shape
{
    #texture = new Texture();
    #area;
    #showHitbox = false;

    constructor(texture, area)
    {
        super();
        var args = arguments;

        if (texture instanceof String || typeof texture == "string")
        {
            return (async () =>
            {
                this.#texture = await new Texture(texture);

                if (args.length > 1) 
                {
                    this.#area = area;
                }
                else
                {
                    this.#area = new Rectangle(this.#texture.getImage().width, this.#texture.getImage().height);
                }
                this.#texture.setArea(this.#area);
                return this;
            })();
        }
        else if (texture instanceof Texture)
        {
            this.#texture = texture;
            if (arguments.length > 1) 
            {
                this.#area = area;
            }
            else
            {
                this.#area = new Rectangle(this.#texture.getImage().width, this.#texture.getImage().height);
            }
            this.#texture.setArea(this.#area);
        }
    }

    showHitbox(value = true)
    {
        this.#showHitbox = value;
    }

    getHitbox()
    {
        if (this.#area instanceof Polygon)
        {
            let clone = new Polygon(this.#area.json, this.x, this.y);
            clone._direction = this._direction;
            clone._center = this._center;
            clone._scale = this._scale;
            return clone;
        }
        else if (this.#area instanceof Circle)
        {
            let clone = new Circle(this.#area.radius, this.x, this.y);
            clone._direction = this._direction;
            clone._center = this.#area._center;
            clone._scale = this._scale;
            return clone;
        }
    }

    getWidth()
    {
        return this.getHitbox().getWidth();
    }

    getHeight()
    {
        return this.getHitbox().getHeight();
    }

    setTextureArea(area)
    {
        if (area instanceof Shape)
        {
            this.#area = area;
            return this.#area;
        }
        return null
    }

    flip(horizontal = false, vertical = false)
    {
        if (horizontal) this._scale.x = -this._scale.x;
        if (vertical) this._scale.y = -this._scale.y;
    }

    draw(context)
    {
        context.save();

        context.beginPath();

        // Sprite Rotation
        this.setCenter(this.#area._center.x, this.#area._center.y);
        let o = this.getCenter();
        context.translate(o.x, o.y);
        context.rotate(this._direction * Math.PI / 180);
        context.translate(-o.x, -o.y);

        // Sprite Rotation
        if (this._scale.x == -1) context.translate(this.#area.getWidth() * this.#area._scale.x, 0);
        if (this._scale.y == -1) context.translate(0, this.#area.getHeight() * this.#area._scale.y);
        context.translate(-(this.x * (this._scale.x - 1)), -(this.y * (this._scale.y - 1)));
        context.scale(this._scale.x, this._scale.y);

        if (this.#showHitbox) 
        {
            context.drawImage(this.#texture.getArea(), this.x, this.y);
        }
        else 
        {
            let temp = this.#area.colour;
            this.#area.colour = 'rgba(0, 0, 0, 0.0)';
            context.drawImage(this.#texture.getArea(), this.x, this.y);
            this.#area.colour = temp;
        }

        context.restore();
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

export { Canvas, Events, Camera, Util };
export { Line, Polygon, Rectangle, Circle, Sprite };
export { DisplayText, Texture };