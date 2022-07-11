//==============================================================
// Extreme Breakout - original take on the classic Breakout game
//
//      By: David Kobrin
//          david_kobrin@yahoo.com
//==============================================================


//==============================================================
// Entity - abstract class for game world objects to inherit from
//==============================================================
class Entity {
    constructor(){
        if (this.constructor === Entity)
            throw new Error('Abstract class cannot be instantiated.');
    }
    draw() {}
    update() {}
    getPosition() {}
    setPosition() {}
}

//================================================================
// Circle - 2d filled circle
//================================================================
class Circle extends Entity {
    rad = 0;
    pos = {x:0, y:0};
    color = '#ddd';

    constructor(rad = 0, posX = 0, posY = 0, color = '#ddd') {
        super();
        this.rad = rad;
        this.pos.x = posX;
        this.pos.y = posY;
        this.color = color;
    }

    draw() {
        vp.ctx.fillStyle = this.color;
        vp.ctx.beginPath();
        vp.ctx.arc(this.pos.x, this.pos.y, this.rad, 0, Math.PI*2, true);
        vp.ctx.fill();
    }

    getPosition() { return this.pos; }
    getRadius() { return this.rad; }

    setPosition(posX, posY) {
        this.pos.x = posX;
        this.pos.y = posY;
    }
}

//================================================================
// Ball - 2d filled circle
//================================================================
class Ball extends Circle {
    vel = {x:0, y:0}

    constructor(rad = 0, posX = 0, posY = 0, velX = 0, velY = 0, color = '#ddd') {
        super(rad, posX, posY, color);
        this.vel.x = velX;
        this.vel.y = velY;
    }

}

//================================================================
// Rect - 2d rectangle
//================================================================
class Rect extends Entity {
    pos = {x:0, y:0};       // center
    w = 0;
    h = 0;
    ulCorner = {};
    brCorner = {};
    color = '#00d';

    constructor(posX = 0, posY = 0, width = 0, height = 0, color = '#00d') {
        super();
        this.pos.x = posX;
        this.pos.y = posY;
        this.w = width;
        this.h = height;
        this.adjustCorners();
        this.color = color;
    }

    draw() {
        vp.ctx.fillStyle = this.color;
        vp.ctx.fillRect(this.ulCorner.x, this.ulCorner.y, this.w, this.h);
    }

    getPosition() { return this.pos; }
    getWidth() { return this.w; }
    getHeight() { return this.h; }
    getUpperLeft() { return this.ulCorner; }
    getLowerRight() { return this.brCorner; }
    

    setPosition(posX, posY = this.pos.y) {
        this.pos.x = posX;
        this.pos.y = posY;
        this.adjustCorners();
    }

    adjustCorners() {
        this.ulCorner.x = this.pos.x - this.w / 2;
        this.ulCorner.y = this.pos.y - this.h / 2;
        this.brCorner.x = this.pos.x + this.w / 2;
        this.brCorner.y = this.pos.y + this.h / 2;
    }
}

//================================================================
// Brick - Destroyable block rectangle
//================================================================
class Brick extends Rect {
    health = 1;     //number of hits required to break
    points = 1;     //number of points to add to player's score when broken
    destroyed = false;

    constructor(posX = 0, posY = 0, width = 0, height = 0, health = 1, points = 1, color = '#00d') {
        super(posX, posY, width, height, color);
        this.health = health;
        this.points = points;
        this.destroyed = false;
    }

    draw() {
        if (!this.destroyed)
            super.draw();
    }
}

//================================================================
// Paddle - Player controlable rectangle
//================================================================
class Paddle extends Rect {
    vel = 5;        // movement speed per frame
    normalWidth = 0;

    constructor(posX = 0, posY = 0, width = 0, height = 0, color = '#dd1') {
        super(posX, posY, width, height, color);
        this.normalWidth = width;    
    }
}

//-----------------------------------------------------------------
//  Global Variables
//-----------------------------------------------------------------
const vp = {}
let shouldQuit = false;
let paused = false;
const game = {
    entities: [],
    bgColor: '#222',
    controlKeys: {
            ArrowRight: false,
            ArrowLeft:  false,
            Space:      false,
            KeyP:       false,
            KeyI:       false,
            KeyQ:       false
    },

    gameState: {
        instructions:   true,
        highScores:     false,
        gamePlay:       false,
    },

    init: function() {
        vp.canvas = document.querySelector('#viewport');
        vp.ctx = vp.canvas.getContext('2d');

        document.querySelector('body').addEventListener('keydown', (e) => { game.keyDownEvent(e); });
        document.querySelector('body').addEventListener('keyup', (e) => { game.keyUpEvent(e); });

        shouldQuit = false;
        paused = false;

        this.entities.push(new Ball(10,50,50));
        this.entities.push(new Brick(60, 100, 80, 30));
        this.entities.push(new Paddle(vp.canvas.width / 2, vp.canvas.height - 20, 120, 20));
    },

    update: function() { 
             
        for (const ent of game.entities) {
            ent.update()
        }
    },
    
    draw: function() {
        //  clear to bgColor before drawing all entities
        vp.ctx.fillStyle = game.bgColor;
        vp.ctx.fillRect(0,0,vp.canvas.width,vp.canvas.height);

        for (const ent of game.entities) {
            ent.draw()
        }
    },
    
    loop: function() {
        if(!shouldQuit && !paused) { 
            game.update()
            game.draw()
        }
        requestAnimationFrame(game.loop);    // keep game loop running while on page
    },

    keyDownEvent: function(e) {
        if(!Object.keys(this.controlKeys).includes(e.code))
            return;
        this.controlKeys[e.code] = true;
    },

    keyUpEvent: function(e) {
        if(!Object.keys(this.controlKeys).includes(e.code))
            return;
        this.controlKeys[e.code] = false;
    }

}


game.init();
game.loop();
