// TODO list
// -------------------------------------------------------------------
// WARNING - Sprite class is currently broken and needs reworked for the new polygon class

// Current Refactor everything specifically; class constructors should be
//         given proper error detection for their argument list
//       - DONE Canvas constructor
//       - TODO Everything else

// TODO Add JSDoc comments to document and improve code readability
// TODO Create way to map touch controls to KBMS so code can be
//      written once and made cross platform easily 
// TODO Improve/Finish touch events/controls in Events class - current
//      support is very basic
// TODO Add touch joysticks for touch game support
// TODO Flesh out Util class with more backend functions
// TODO Rewrite/add more features to the DisplayText class
// TODO Move isConvexPoly out of intersects and run it after shape is
//      modified to reduce calls
// TODO Look through code for ways to improve performance
// TODO Add multiple canvas support so UI can be separate
// TODO Redesign Sprite getHitbox and how a sprites hitbox data is stored
//      because it's currently inefficient and could lead to small bugs
// TODO There could be problems with shape center points and their shapes
//      intersects (Circle class). Might seperate the center property into
//      independent rotation and center points
// TODO Split Infinite.js into multiple files to improve readability & modularity

// MAYBE Add integrated network support using websockets or socket.io
// MAYBE Use OffscreenCanvas to offload rendering to worker thread for performance

import './Intersects/umd/intersects.min.js';

var styles = document.createElement("style");
styles.id = "Infinite-Styles";
styles.innerHTML = "[class^='Infinite-'] { position: absolute; top: 0; left: 0; margin: 0%; padding: 0%; }\n" +
    ".Infinite-Canvas { background-color: 'black'; }\n" +
    ".Infinite-UI { width: 100%; height: 100%; }\n" +
    ".Infinite-FPS { font-size: 24px; }";
document.getElementsByTagName("HEAD")[0].appendChild(styles);

class Canvas
{
    static _containCanvas = document.createElement('canvas');
    static _containContext = Canvas._containCanvas.getContext("2d");
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
    static debug = false;

    constructor(width = window.innerWidth, height = window.innerHeight, id = "Infinite")
    {
        if (arguments.length == 1)
        {
            if (typeof arguments[0] == "string")
            {
                id = arguments[0];
                width = window.innerWidth;
                height = window.innerHeight;
            }
            else if (typeof arguments[0] == "number")
            {
                height = width * window.innerHeight / window.innerWidth;
            }
        }
        else if (arguments.length == 3 && typeof arguments[0] == "string" && typeof arguments[1] == "number" && typeof arguments[2] == "number")
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
        this.#canvas.oncontextmenu = function (e) { e.preventDefault(); e.stopPropagation(); }
        this.#ctx = this.#canvas.getContext("2d", { alpha: false });

        // FPS 
        this.#fpsTimer = document.createElement("div");
        this.#fpsTimer.className = "Infinite-FPS";
        this.#infinite.appendChild(this.#fpsTimer);

        // Canvas properties
        this.colour = 'black';

        this.setSize(width, height);

        this.fpsVisible(true);
        this.hide();

        this.#camera = new Camera(this.width, this.height);
    }

    clear()
    {
        // Reset Transform and clear
        this.#ctx.setTransform(1, 0, 0, 1, 0, 0);
        this.#ctx.clearRect(0, 0, this.width, this.height);

        // Draw background
        this.#ctx.beginPath();
        this.#ctx.rect(0, 0, this.width, this.height);
        this.#ctx.fillStyle = this.colour;
        this.#ctx.fill();

        // Apply global transforms
        let cPos = this.#camera.getPosition();
        let cRot = this.#camera.getRotation();
        let cSize = this.#camera.getSize();

        this.#ctx.setTransform(this.width / cSize.width, 0, 0, this.height / cSize.height, -cPos.x, -cPos.y);
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
        this.#canvas.style.top = y;
        this.#canvas.style.left = x;
    }

    setFullscreen(stretch = false)
    {
        if (stretch == false) window.addEventListener('resize', () => 
        {
            this.setSize(window.innerWidth, window.innerHeight);

            this.#canvas.style.width = window.innerWidth;
            this.#canvas.style.height = window.innerHeight;
            this.getCamera().setSize(window.innerWidth, window.innerHeight);
        }, false);
        else window.addEventListener('resize', () => 
        {
            this.#canvas.style.width = window.innerWidth;
            this.#canvas.style.height = window.innerHeight;
            this.getCamera().setSize(this.width, this.height);
        }, false);
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


class Input 
{
    /** create(name, func) allows you to create/store crossplatform conditional statements that
     * can be run using, Input.{name}() */
    static create(name, func)
    {
        if (name != "getTouch")
        {
            Input[name] = function ()
            {
                if (arguments.length > 0) return func(...arguments);
                else return func();
            };
        }
    }
}


class Keyboard
{
    // Static Keyboard - Looks for keypresses in the entire window

    static #isEnabled = false;
    static #globalPressedKeys = {};
    static #globalLastKeyDown = '';
    static #globalLastKeyUp = '';

    static #globalDownHandler;
    static #globalUpHandler;
    static #globalBlurHandler;

    static #onGlobalKeyDown(e)
    {
        Keyboard.#globalPressedKeys[e.key.toLowerCase()] = true;
        Keyboard.#globalLastKeyDown = e.key.toLowerCase();
    }
    static #onGlobalKeyUp(e)
    {
        Keyboard.#globalPressedKeys[e.key.toLowerCase()] = false;
        Keyboard.#globalLastKeyUp = e.key;
    }
    static #onGlobalBlur(e)
    {
        Keyboard.#globalPressedKeys = {};
    }

    static #init()
    {
        if (!this.#isEnabled)
        {
            Keyboard.#globalDownHandler = Keyboard.#onGlobalKeyDown.bind(this);
            Keyboard.#globalUpHandler = Keyboard.#onGlobalKeyUp.bind(this);
            Keyboard.#globalBlurHandler = Keyboard.#onGlobalBlur.bind(this);

            window.addEventListener('keydown', Keyboard.#globalDownHandler);
            window.addEventListener("keyup", Keyboard.#globalUpHandler);
            window.addEventListener("blur", Keyboard.#globalBlurHandler);

            this.#isEnabled = true;
        }
    }

    static isKeyDown(key)
    {
        Keyboard.#init();
        return Keyboard.#globalPressedKeys[key.toLowerCase()];
    }

    static getLastKeyDown()
    {
        Keyboard.#init();
        return Keyboard.#globalLastKeyDown;
    }

    static getLastKeyPressed()
    {
        Keyboard.#init();
        return Keyboard.#globalLastKeyUp;
    }




    // Non-Static Keyboard - Looks for keypresses in a HTML element

    #pressedKeys = {};
    #lastKeyDown = '';
    #lastKeyUp = '';
    #element = null;

    #downHandler;
    #upHandler;
    #blurHandler;

    constructor(HTML_Element)
    {
        if (arguments.length > 0) this.setTarget(HTML_Element);
        else console.warn("This Keyboard instance is missing a HTML element parameter");
    }

    #onKeyDown(e)
    {
        this.#pressedKeys[e.key.toLowerCase()] = true;
        this.#lastKeyDown = e.key.toLowerCase();
    }
    #onKeyUp(e)
    {
        this.#pressedKeys[e.key.toLowerCase()] = false;
        this.#lastKeyUp = e.key;
    }
    #onBlur(e)
    {
        this.#pressedKeys = {};
    }

    setTarget(element)
    {
        this.destroy();

        if (element instanceof Canvas) element = element.getHTMLCanvas();
        if (element instanceof Element)
        {
            this.#downHandler = this.#onKeyDown.bind(this);
            this.#upHandler = this.#onKeyUp.bind(this);
            this.#blurHandler = this.#onBlur.bind(this);

            element.addEventListener('keydown', this.#downHandler);
            element.addEventListener("keyup", this.#upHandler);
            element.addEventListener("blur", this.#blurHandler);

            this.#element = element;
        }
        else console.warn("This Keyboard instance is not linked to a HTML element");
    }

    isKeyDown(key)
    {
        return this.#pressedKeys[key.toLowerCase()];
    }

    getLastKeyDown()
    {
        return this.#lastKeyDown;
    }

    getLastKeyPressed()
    {
        return this.#lastKeyUp;
    }

    destroy()
    {
        if (this.#element != null)
        {
            this.#element.removeEventListener('keydown', this.#downHandler);
            this.#element.removeEventListener("keyup", this.#upHandler);
            this.#element.removeEventListener("blur", this.#blurHandler);
            this.#element = null;
        }
    }
}


class Mouse
{
    // Static Mouse - Looks for mouse information in the entire window

    static #isEnabled = false;

    static #globalState = {
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

    static #globalInterval = 50;
    static #globalLastCall = Date.now();

    static #globalMoveHandler;
    static #globalButtonHandler;

    static #onGlobalMouseMove(e)
    {
        if (Date.now() - Mouse.#globalLastCall > Mouse.#globalInterval)
        {
            Mouse.#globalState.position = {
                x: e.clientX,
                y: e.clientY
            };
            Mouse.#globalState.change = { x: e.movementX, y: e.movementY };
            Mouse.#globalLastCall = Date.now();
        }
    }
    static #onGlobalUpdateButton(e)
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
        Mouse.#globalState.button.left = Boolean(arr[0]);
        Mouse.#globalState.button.right = Boolean(arr[1]);
        Mouse.#globalState.button.middle = Boolean(arr[2]);
        Mouse.#globalState.button.other = Boolean(arr[3]);
    }

    static #init()
    {
        if (!this.#isEnabled)
        {
            Mouse.#globalMoveHandler = Mouse.#onGlobalMouseMove.bind(this);
            Mouse.#globalButtonHandler = Mouse.#onGlobalUpdateButton.bind(this);

            window.addEventListener('mousemove', Mouse.#globalMoveHandler);
            window.addEventListener("mousedown", Mouse.#globalButtonHandler);
            window.addEventListener("mouseup", Mouse.#globalButtonHandler);

            this.#isEnabled = true;
        }
    }

    static getPosition()
    {
        Mouse.#init();
        return Mouse.#globalState.position;
    }

    static getButtons()
    {
        Mouse.#init();
        return Mouse.#globalState.button;
    }

    static getChange()
    {
        Mouse.#init();
        return Mouse.#globalState.change;
    }

    static getState()
    {
        Mouse.#init();
        return Mouse.#globalState;
    }

    static setUpdatesPerSecond(number)
    {
        Mouse.#init();
        Mouse.#globalInterval = 1000.0 / number;
    }




    // Non-Static Mouse - Looks for mouse information within a paticular element

    #state = {
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

    #interval = 50;
    #lastCall = 0;
    #element;

    #moveHandler;
    #buttonHandler;

    constructor(HTML_element)
    {
        if (arguments.length > 0) this.setTarget(HTML_element);
        else console.warn("This Mouse instance is missing a HTML element parameter");
    }

    #onMouseMove(e)
    {
        if (Date.now() - this.#lastCall > this.#interval)
        {
            // Get the bounding rectangle of target
            let rect = this.#element.getBoundingClientRect();

            this.#state.position = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            this.#state.change = { x: e.movementX, y: e.movementY };
            this.#lastCall = Date.now();
        }
    }
    #onUpdateButton(e)
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
        this.#state.button.left = Boolean(arr[0]);
        this.#state.button.right = Boolean(arr[1]);
        this.#state.button.middle = Boolean(arr[2]);
        this.#state.button.other = Boolean(arr[3]);
    }

    setTarget(element)
    {
        this.destroy();

        if (element instanceof Canvas) element = element.getHTMLCanvas();
        if (element instanceof Element)
        {
            this.#moveHandler = this.#onMouseMove.bind(this);
            this.#buttonHandler = this.#onUpdateButton.bind(this);

            element.addEventListener('mousemove', this.#moveHandler);
            element.addEventListener("mousedown", this.#buttonHandler);
            element.addEventListener("mouseup", this.#buttonHandler);

            this.#element = element;
        }
        else console.warn("This Mouse instance is not linked to a HTML element");
    }

    getPosition()
    {
        return this.#state.position;
    }

    getButtons()
    {
        return this.#state.button;
    }

    getChange()
    {
        return this.#state.change;
    }

    getState()
    {
        return this.#state;
    }

    setCallsPerSecond(number)
    {
        this.#interval = 1000.0 / number;
    }

    destroy()
    {
        if (this.#element != null)
        {
            this.#element.removeEventListener('mousemove', this.#moveHandler);
            this.#element.removeEventListener("mousedown", this.#buttonHandler);
            this.#element.removeEventListener("mouseup", this.#buttonHandler);
            this.#element = null;
        }
    }
}


class Touchscreen
{
    // Static Touch - Looks for mouse information in the entire window

    static #isEnabled = false;

    static #globalState = {
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

    static #globalStartHandler;
    static #globalEndHandler;
    static #globalMoveHandler;

    static #onGlobalTouchStart(evt)
    {
        let e = evt.changedTouches[0];

        let x = e.clientX;
        let y = e.clientY;
        if (x <= 0) x = 0;
        if (y <= 0) y = 0;

        Touchscreen.#globalState.isTouch = true;
        Touchscreen.#globalState.change = {
            x: x - Touchscreen.#globalState.position.x,
            y: y - Touchscreen.#globalState.position.y
        };
        Touchscreen.#globalState.position = {
            x: x,
            y: y
        };
    }
    static #onGlobalTouchEnd(evt)
    {
        let e = evt.changedTouches[0];

        let x = e.clientX;
        let y = e.clientY;
        if (x <= 0) x = 0;
        if (y <= 0) y = 0;

        Touchscreen.#globalState.isTouch = false;
        Touchscreen.#globalState.change = {
            x: x - Touchscreen.#globalState.position.x,
            y: y - Touchscreen.#globalState.position.y
        };
        Touchscreen.#globalState.position = {
            x: x,
            y: y
        };
    }
    static #onGlobalTouchMove(evt)
    {
        let e = evt.changedTouches[0];

        let x = e.clientX;
        let y = e.clientY;
        if (x <= 0) x = 0;
        if (y <= 0) y = 0;

        Touchscreen.#globalState.isTouch = true;
        Touchscreen.#globalState.change = {
            x: x - Touchscreen.#globalState.position.x,
            y: y - Touchscreen.#globalState.position.y
        };
        Touchscreen.#globalState.position = {
            x: x,
            y: y
        };
    }

    static #init()
    {
        if (!this.#isEnabled)
        {
            Touchscreen.#globalStartHandler = Touchscreen.#onGlobalTouchStart.bind(this);
            Touchscreen.#globalEndHandler = Touchscreen.#onGlobalTouchEnd.bind(this);
            Touchscreen.#globalMoveHandler = Touchscreen.#onGlobalTouchMove.bind(this);

            window.addEventListener('touchstart', Touchscreen.#globalStartHandler);
            window.addEventListener("touchend", Touchscreen.#globalEndHandler);
            window.addEventListener("touchmove", Touchscreen.#globalMoveHandler);

            this.#isEnabled = true;
        }
    }

    static getPosition()
    {
        Touchscreen.#init();
        return { x: Touchscreen.#globalState.position.x, y: Touchscreen.#globalState.position.y };
    }

    static isTouching()
    {
        Touchscreen.#init();
        return Touchscreen.#globalState.isTouch;
    }

    static getChange()
    {
        Touchscreen.#init();
        return { x: Touchscreen.#globalState.change.x, y: Touchscreen.#globalState.change.y };
    }

    static getState()
    {
        Touchscreen.#init();
        return JSON.parse(JSON.stringify(Touchscreen.#globalState));
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

    // TODO When redoing the shape and canvas scaling make sure it's implemented here if need be
    getPosition()
    {
        if (this.#shape != null) return {
            x: this.#shape.x + this.#shape.getWidth() / 2 - this.#width / 2,
            y: this.#shape.y + this.#shape.getHeight() / 2 - this.#height / 2
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
            let temp = objArr[i]();
            arr.push(temp.x);
            arr.push(temp.y);
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
    _dimensions = {
        local: {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0
        },
        global: {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0
        }
    };

    constructor()
    {
        this.x = 0;
        this.y = 0;
        this._lastX = 0;
        this._lastY = 0;

        this.colour = "black";

        this._rotation = 0;
        this._scale = { x: 1.0, y: 1.0 };
        this._origin = { x: 0, y: 0 };
        this._isTransform = false;

        this.path = new Path2D();
    }

    onTransform()
    {
        this._isTransform = true;
    }

    contains(point)
    {
        return Canvas._containContext.isPointInPath(this.path, point.x, point.y);
    }

    setPosition(x, y)
    {
        if (arguments.length > 1)
        {
            this.x = x;
            this.y = y;
        }
        else if (Canvas.debug) console.warn("setPosition missing arguments");
    }

    getPosition()
    {
        return { x: this.x, y: this.y };
    }

    setRotation(degrees = this.getRotation())
    {
        if (Canvas.debug && degrees == this.getRotation()) console.warn(new Error("setRotation() not changed"));

        this._rotation = degrees % 360;
        this.onTransform();
    }

    getRotation()
    {
        return this._rotation % 360;
    }

    rotate(degrees = 0)
    {
        this._rotation = (this._rotation + degrees) % 360;
        this.onTransform();
    }

    move(distance = 1, angle = this.getRotation())
    {
        let rads = (angle % 360) * (Math.PI / 180);
        this.x += Math.round(distance * Math.sin(rads));
        this.y -= Math.round(distance * Math.cos(rads));
    }

    scale(scaleX, scaleY)
    {
        if (arguments.length > 1)
        {
            this._scale.x = Math.min(this._scale.x * scaleX, 1000000);
            this._scale.y = Math.min(this._scale.y * scaleY, 1000000);
            this.onTransform();
        }
        else if (arguments.length == 1)
        {
            this._scale.x = Math.min(this._scale.x * scaleX, 1000000);
            this._scale.y = Math.min(this._scale.y * scaleX, 1000000);
            this.onTransform();
        }
        else if (Canvas.debug) console.warn(new Error("scale missing arguments"));
    }

    setScale(scaleX, scaleY)
    {
        if (arguments.length > 1)
        {

            this._scale = { x: Math.min(scaleX, 1000000), y: Math.min(scaleY, 1000000) };
            this.onTransform();
        }
        else if (arguments.length == 1)
        {
            this._scale = { x: Math.min(scaleX, 1000000), y: Math.min(scaleX, 1000000) };
            this.onTransform();
        }
        else if (Canvas.debug) console.warn(new Error("setScale missing arguments"));
    }

    getScale()
    {
        return { x: this._scale.x, y: this._scale.y };
    }

    setOrigin(x, y)
    {
        if (arguments.length > 1)
        {
            this._origin = { x: x, y: y };
            this.onTransform();
        }
        else if (Canvas.debug) console.warn(new Error("setCenter missing arguments"));
    }

    getOrigin()
    {
        return { x: this._origin.x, y: this._origin.y };
    }

    getSize(global = true)
    {
        if (global) return { width: this._dimensions.global.maxX - this._dimensions.global.minX, height: this._dimensions.global.maxY - this._dimensions.global.minY };
        else return { width: this._dimensions.local.maxX - this._dimensions.local.minX, height: this._dimensions.local.maxY - this._dimensions.local.minY };
    }

    getWidth(global = true)
    {
        return this.getSize(global).width;
    }

    getHeight(global = true)
    {
        return this.getSize(global).height;
    }

    draw()
    {
        this._lastX = this.x;
        this._lastY = this.y;
    }

    hasMoved()
    {
        return !(this._lastX == this.x && this._lastY == this.y);
    }

    resetTransforms()
    {
        this._origin = { x: 0, y: 0 };
        this._rotation = 0;
        this._scale = { x: 1, y: 1 };
        this.onTransform();
    }

    /** This method with no arguments will return a deep copy of the shape.
     * 
     *  If it has a shape argument it will convert the shape into a replica of the argument shape 
     */
    clone(shape)
    {
        if (arguments.length == 0)
        {
            let temp = new Shape();
            temp._dimensions = JSON.parse(JSON.stringify(this._dimensions));
            temp._rotation = this.getRotation();
            temp._scale = this.getScale();
            temp._origin = this.getOrigin();
            temp.x = this.x; temp.y = this.y;
            return temp;
        }
        else if (shape instanceof Shape)
        {
            this._dimensions = JSON.parse(JSON.stringify(shape._dimensions));
            this._rotation = shape.getRotation();
            this._scale = shape.getScale();
            this._origin = shape.getOrigin();
            this.x = shape.x; this.y = shape.y;
            return true;
        }
        else return null;
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
            if (shape.isConvex())
            {
                return Intersects.linePolygon(this.x1, this.y1, this.x2, this.y2, Util.objArrayToArray(shape._points), 0.0001);
            }
            else
            {
                if (shape.contains({ x: this.x1, y: this.y1 }) || shape.contains({ x: this.x2, y: this.y2 })) return true;
                for (let i = 0; i < shape._lines.length; i++)
                {
                    let p1 = shape._lines[i]()[0];
                    let p2 = shape._lines[i]()[1];
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

    getAngle()
    {
        return (Math.atan2(this.y2 - this.y1, this.x2 - this.x1) * 180 / Math.PI + 90) % 360;
    }

    getLength()
    {
        return Math.hypot(this.x2 - this.x1, this.y2 - this.y1);
    }

    getComponets()
    {
        let length = this.getLength();
        let angle = this.getAngle() * Math.PI / 180;
        return { vertical: length * -Math.cos(angle), horizontal: length * Math.sin(angle) };
    }

    draw(ctx)
    {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = this.colour;
        ctx.moveTo(this.x1, this.y1);
        ctx.lineTo(this.x2, this.y2);
        ctx.stroke();
    }
}


class Polygon extends Shape
{
    #convex;

    constructor(json = [], x = 0, y = 0)
    {
        super();
        this._json = [];
        this._points = [];
        this._lines = [];

        this.x = x;
        this.y = y;
        this.setPoints(json);
    }

    isTransform()
    {
        this._dimensions.global = {
            minX: 0,
            maxX: 0,
            minY: 0,
            maxY: 0
        };

        this._points.forEach((point, i) =>
        {
            let p = point();
            if (p.x > this._dimensions.global.maxX) this._dimensions.global.maxX = p.x;
            else if (p.x < this._dimensions.global.minX) this._dimensions.global.minX = p.x;
            if (p.y > this._dimensions.global.maxY) this._dimensions.global.maxY = p.y;
            else if (p.y < this._dimensions.global.minY) this._dimensions.global.minY = p.y;

            if (i != 0) this.path.lineTo(p.x, p.y);
            else 
            {
                this.path = new Path2D();
                this.path.moveTo(p.x, p.y);
            }
        });
        this._isTransform = false;
    }

    setPoints(json)
    {
        if (Array.isArray(json) && json.length > 2 && json[0].x != undefined && json[0].y != undefined)
        {
            this._json = JSON.parse(JSON.stringify(json));
            this._points = JSON.parse(JSON.stringify(json));

            this._dimensions.local.minX = this._json[0].x;
            this._dimensions.local.maxX = this._json[0].x;
            this._dimensions.local.minY = this._json[0].y;
            this._dimensions.local.maxY = this._json[0].y;

            this.path = new Path2D();
            this._points = this._points.map((point, i) =>
            {
                if (point.x > this._dimensions.local.maxX) this._dimensions.local.maxX = point.x;
                else if (point.x < this._dimensions.local.minX) this._dimensions.local.minX = point.x;
                if (point.y > this._dimensions.local.maxY) this._dimensions.local.maxY = point.y;
                else if (point.y < this._dimensions.local.minY) this._dimensions.local.minY = point.y;

                return () =>
                {
                    return this.#rotatePoint(
                        {
                            x: this.x + (point.x * this._scale.x) - this._origin.x,
                            y: this.y + (point.y * this._scale.y) - this._origin.y
                        });
                };
            });

            this._points.forEach((point, i) =>
            {
                if (i < this._points.length - 1)
                {
                    this._lines.push(() => { return [point(), this._points[i + 1]()]; });
                }

                if (i != 0) this.path.lineTo(point().x, point().y);
                else this.path.moveTo(this.x + point().x, this.y + point().y);
            })
            this._lines.push(() => { return [this._points[this._points.length - 1](), this._points[0]()]; });

            this._dimensions.global = JSON.parse(JSON.stringify(this._dimensions.local));
            this.#convex = Util.isPolygonConvex(this._points);

            return true;
        }
        return false;
    }

    #rotatePoint(pt)
    {
        if (this.getRotation() != 0)
        {
            let angle = this._rotation * (Math.PI / 180); // Convert to radians

            var o = { x: this.x + this._origin.x, y: this.y + this._origin.y };

            let tempX = pt.x - o.x;
            let tempY = pt.y - o.y;

            let rotatedX = Math.cos(angle) * tempX - Math.sin(angle) * tempY + o.x;
            let rotatedY = Math.sin(angle) * tempX + Math.cos(angle) * tempY + o.y;

            return { x: rotatedX, y: rotatedY };
        }
        else return pt;
    }

    intersects(shape)
    {
        if (shape instanceof Sprite) 
        {
            shape = shape.getHitbox();
        }

        if (shape instanceof Polygon)
        {
            if (this.isConvex() && shape.isConvex())
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
                        let p1 = this._lines[i]()[0];
                        let p2 = this._lines[i]()[1];
                        let p3 = shape._lines[j]()[0]
                        let p4 = shape._lines[j]()[1];

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
            if (this.isConvex())
            {
                return Intersects.polygonCircle(Util.objArrayToArray(this._points), shape.x + shape.radius, shape.y + shape.radius, shape.radius, 0.0001);
            }
            else
            {
                if (shape.contains(this._points[0]()) || this.contains(shape.getOrigin())) return true;
                for (let i = 0; i < this._lines.length; i++)
                {
                    let p1 = this._lines[i]()[0];
                    let p2 = this._lines[i]()[1];
                    if (Intersects.lineCircle(p1.x, p1.y, p2.x, p2.y, shape.x + shape.radius, shape.y + shape.radius, shape.radius)) return true;
                }
                return false;
            }
        }
        else if (shape instanceof Line)
        {
            if (this.isConvex())
            {
                return Intersects.polygonLine(Util.objArrayToArray(this._points), shape.x1, shape.y1, shape.x2, shape.y2, 0.0001);
            }
            else
            {
                if (this.contains({ x: shape.x1, y: shape.y1 }) || this.contains({ x: shape.x2, y: shape.y2 })) return true;
                for (let i = 0; i < this._lines.length; i++)
                {
                    let p1 = this._lines[i]()[0];
                    let p2 = this._lines[i]()[1];
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

    getSize(global = true)
    {
        if (global) return { width: this._dimensions.global.maxX - this._dimensions.global.minX, height: this._dimensions.global.maxY - this._dimensions.global.minY };
        else return { width: this._dimensions.local.maxX - this._dimensions.local.minX, height: this._dimensions.local.maxY - this._dimensions.local.minY };
    }

    isConvex()
    {
        return this.#convex;
    }

    draw(ctx)
    {
        ctx.beginPath();
        ctx.fillStyle = this.colour;

        if (this._isTransform || this.hasMoved()) this.isTransform();
        super.draw();

        if (this._points.length < 3) ctx.stroke(this.path);
        else ctx.fill(this.path);
    }

    clone(shape)
    {
        if (arguments.length == 0)
        {
            let temp = new Polygon(JSON.parse(JSON.stringify(this._json)), this.x, this.y);
            temp._dimensions = JSON.parse(JSON.stringify(this._dimensions));
            temp._rotation = this.getRotation();
            temp._scale = this.getScale();
            temp._origin = this.getOrigin();
            temp.x = this.x; temp.y = this.y;
            return temp;
        }
        else if (shape instanceof Polygon)
        {
            this.setPoints(JSON.parse(JSON.stringify(shape._json)));
            this._dimensions = JSON.parse(JSON.stringify(shape._dimensions));
            this._rotation = shape.getRotation();
            this._scale = shape.getScale();
            this._origin = shape.getOrigin();
            this.x = shape.x; this.y = shape.y;
            return true;
        }
        else return null;
    }
}


class Rectangle extends Polygon
{
    #width = 0;
    #height = 0;

    constructor(width, height, x = 0, y = 0)
    {
        super([{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }], x, y);

        this.#width = width;
        this.#height = height;
    }

    setSize(width, height)
    {
        if (arguments.length > 1)
        {
            this.#width = width;
            this.#height = height;
            this.setPoints([{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }]);
        }
        else if (Canvas.debug) console.warn(new Error("setSize missing arguments"));
    }

    setWidth(width)
    {
        if (arguments.length > 0) this.setSize(width, this.#height);
        else if (Canvas.debug) console.warn(new Error("setWidth missing arguments"));
    }

    setHeight(height)
    {
        if (arguments.length > 0) this.setSize(this.#width, height);
        else if (Canvas.debug) console.warn(new Error("setHeight missing arguments"));
    }
}


class Circle extends Shape
{
    constructor(radius, x, y)
    {
        super();
        this.radius = radius;

        if (arguments.length > 2)
        {
            this.x = x;
            this.y = y;
        }
        this.path.arc(this.x + this.radius, this.y + this.radius, this.radius, 0, 2 * Math.PI);
    }

    isTransform()
    {
        // TODO global should conatin proper min and max values
        this._dimensions = {
            global: {
                minX: this.x,
                maxX: this.x + this.radius * 2,
                minY: this.y,
                maxY: this.y + this.radius * 2
            },
            local: {
                minX: 0,
                maxX: this.radius * 2,
                minY: 0,
                maxY: this.radius * 2
            }
        };

        this.path = new Path2D();
        this.path.arc(this.x + this.radius, this.y + this.radius, this.radius, 0, 2 * Math.PI);

        this._isTransform = false;
    }

    intersects(shape)
    {
        if (shape instanceof Sprite) shape = shape.getHitbox();

        if (shape instanceof Polygon)
        {
            if (shape.isConvex())
            {
                return Intersects.circlePolygon(this.x + this.radius, this.y + this.radius, this.radius, Util.objArrayToArray(shape._points));
            }
            else
            {
                if (this.contains(shape._points[0]()) || shape.contains(this.getOrigin())) return true;
                for (let i = 0; i < shape._lines.length; i++)
                {
                    let p1 = shape._lines[i]()[0];
                    let p2 = shape._lines[i]()[1];
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

    draw(ctx)
    {
        ctx.beginPath();
        ctx.fillStyle = this.colour;

        if (this._isTransform || this.hasMoved()) this.isTransform();
        super.draw();

        ctx.fill(this.path);
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
        let canvas = document.createElement("canvas");
        let context = canvas.getContext("2d");

        if (arguments.length == 0)
        {
            canvas.width = this.#area.getWidth();
            canvas.height = this.#area.getHeight();

            context.translate(-this.#area.x, -this.#area.y);
            this.#area.colour = 'rgba(0,0,0,0)';
            this.#area.draw(context);
        }
        else
        {
            canvas.width = shape.getWidth();
            canvas.height = shape.getHeight();

            context.translate(-shape.x, -shape.y);
            shape.draw(context);
        }
        context.clip();
        context.drawImage(this.#img, 0, 0);

        return canvas;
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
                this.setTextureArea(this.#area);
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
            this.setTextureArea(this.#area);
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
            clone._rotation = this._rotation;
            clone._origin = this._origin;
            clone._scale = this._scale;
            return clone;
        }
        else if (this.#area instanceof Circle)
        {
            let clone = new Circle(this.#area.radius, this.x, this.y);
            clone._rotation = this._rotation;
            clone._origin = this.#area._origin;
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
            this.#area = area.clone();
            this.#area.clone(this);
            this.#texture.setArea(area);
            return true;
        }
        return false;
    }

    flip(horizontal = false, vertical = false)
    {
        if (horizontal) this._scale.x = -this._scale.x;
        if (vertical) this._scale.y = -this._scale.y;
    }

    draw(context)
    {
        this.#area.clone(this);

        context.save();

        context.beginPath();

        // Sprite Rotation
        let o = {
            x: this.x + Math.abs(this.getWidth() * this._scale.x) / 2,
            y: this.y + Math.abs(this.getHeight() * this._scale.y) / 2
        };
        context.translate(o.x, o.y);
        context.rotate(this._rotation * Math.PI / 180);
        context.translate(-o.x, -o.y);

        // Sprite Rotation
        if (this._scale.x < 0) context.translate(-this.#area.getWidth() * this._scale.x, 0);
        if (this._scale.y < 0) context.translate(0, -this.#area.getHeight() * this._scale.y);
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


/** @deprecated */
class OldPolygon extends Shape
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

        this._origin.x = (this.#dimensions.maxX - this.#dimensions.minX) / 2;
        this._origin.y = (this.#dimensions.maxY - this.#dimensions.minY) / 2;

        if (arguments.length == 2)
        {
            this._points.push(() =>
            {
                return this.#rotatePoint(
                    {
                        x: this.x + (x * this._scale.x) + ((this._scale.x < 0) ? this._origin.x * 2 * -this._scale.x : 0),
                        y: this.y + (y * this._scale.y) + ((this._scale.y < 0) ? this._origin.y * 2 * -this._scale.y : 0)
                    });
            });
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

            this.json.forEach(point =>
            {
                if (point.x > this.#dimensions.maxX) this.#dimensions.maxX = point.x;
                else if (point.x < this.#dimensions.minX) this.#dimensions.minX = point.x;
                if (point.y > this.#dimensions.maxY) this.#dimensions.maxY = point.y;
                else if (point.y < this.#dimensions.minY) this.#dimensions.minY = point.y;

                this._points.push(() =>
                {
                    return this.#rotatePoint(
                        {
                            x: this.x + (point.x * this._scale.x) + ((this._scale.x < 0) ? this._dimensions.x * -this._scale.x : 0),
                            y: this.y + (point.y * this._scale.y) + ((this._scale.y < 0) ? this._dimensions.y * -this._scale.y : 0)
                        });
                });
            });

            this._dimensions.x = this.#dimensions.maxX - this.#dimensions.minX;
            this._dimensions.y = this.#dimensions.maxY - this.#dimensions.minY;

            if (this._points.length > 2)
            {
                this._points.forEach(function (point, i)
                {
                    if (i < self._points.length - 1)
                    {
                        self._lines.push(() => { return [point, self._points[i + 1]]; });
                    }
                });
                this._lines.push(() => { return [this._points[this._points.length - 1], this._points[0]]; });
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
                if (shape.contains(this._points[0]()) || this.contains(shape.getOrigin())) return true;
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
        if (this.getRotation() != 0)
        {
            let angle = this._rotation * (Math.PI / 180); // Convert to radians

            var o = { x: 0, y: 0 };
            o.x = this.x + Math.abs(this._dimensions.x * this._scale.x) / 2;
            o.y = this.y + Math.abs(this._dimensions.y * this._scale.y) / 2;

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

    // TODO Solution to getWidth if the shape is rotated or scaled but find a better way to implement it
    getState() { return; }

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
        if (this._points.length < 3) ctx.stroke();
        else ctx.fill();

        ctx.restore();
    }
}

// TODO Re-add this into canvas class somehow
// if (options['debug'])
// {
//     window.onerror = function (msg, url, linenumber)
//     {
//         alert('Error: ' + msg + '\nFile: ' + url.split('/')[url.split('/').length - 1] + '\nLine: ' + linenumber);
//         return true;
//     };
// }

// Standard
export { Canvas, Camera, Util };

// Inputs
export { Keyboard, Mouse, Touchscreen, Input };

// Shapes
export { Line, Polygon, OldPolygon, Rectangle, Circle, Sprite, Shape };

// Other
export { DisplayText, Texture };