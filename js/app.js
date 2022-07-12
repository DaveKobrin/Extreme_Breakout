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

    update(dt) {
        let newX = this.getPosition().x + this.vel.x * dt;
        if(newX < this.getRadius()){
            newX = this.getRadius();
            this.vel.x *= -1;
        } else if (newX + this.getRadius() > vp.canvas.width) {
            newX = vp.canvas.width - this.getRadius();
            this.vel.x *= -1;
        }
        
        let newY = this.getPosition().y + this.vel.y * dt;
        if (newY < this.getRadius()) { 
            newY = this.getRadius();
            this.vel.y *= -1;
        }

        this.setPosition(newX, newY);

        if (newY > vp.canvas.height) {
            //life lost
        }
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
    vel = .5;        // movement speed per frame
    normalWidth = 0;

    constructor(posX = 0, posY = 0, width = 0, height = 0, color = '#dd1') {
        super(posX, posY, width, height, color);
        this.normalWidth = width;    
    }

    update(dt, keys) {
        if (keys.ArrowLeft) {
            let newX = this.getPosition().x - this.vel * dt;
            newX = newX > this.getWidth()/2 ? newX : this.getWidth()/2;
            this.setPosition(newX);
        } else if (keys.ArrowRight) {
            let newX = this.getPosition().x + this.vel * dt;
            newX = newX < vp.canvas.width - this.getWidth()/2 ? newX : vp.canvas.width - this.getWidth()/2;
            this.setPosition(newX);
        }
        if (keys.Space) {

        }
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
    lastUpdateTime: 0,
    level: 1,

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

        isInstructions: function() { return this.instructions; },
        isHighScores: function() { return this.highScores; },
        isGamePlay: function() { return this.gamePlay; },

        setState: function(state) {
            switch (state) {
                case 'instructions':
                    this.instructions = true;
                    this.highScores = false;
                    this.gamePlay = false;
                    break;
                case 'highScores':
                    this.instructions = false;
                    this.highScores = true;
                    this.gamePlay = false;
                    break;
                case 'gamePlay':
                    this.instructions = false;
                    this.highScores = false;
                    this.gamePlay = true;
                    break;
                default:
                    console.log(`ERROR! trying to switch gameState to ${state}!`);
                    return;
            }
            this.updateDom(state);
        },

        updateDom: function(state) {
            let domObj = null;
            switch (state) {
                case 'instructions':
                    domObj = document.querySelector('#instructions');
                    if (domObj.classList.contains('hidden'))
                        domObj.classList.remove('hidden');
                    
                    domObj = document.querySelector('#highScores');
                    if (!domObj.classList.contains('hidden'))
                        domObj.classList.add('hidden');

                    domObj = document.querySelector('#gameWindow');
                    if (!domObj.classList.contains('hidden'))
                        domObj.classList.add('hidden');
                    break;

                case 'highScores':
                    domObj = document.querySelector('#highScores');
                    if (domObj.classList.contains('hidden'))
                        domObj.classList.remove('hidden');
                    
                    domObj = document.querySelector('#instructions');
                    if (!domObj.classList.contains('hidden'))
                        domObj.classList.add('hidden');

                    domObj = document.querySelector('#gameWindow');
                    if (!domObj.classList.contains('hidden'))
                        domObj.classList.add('hidden');
                    break;
                    
                case 'gamePlay':
                    domObj = document.querySelector('#gameWindow');
                    if (domObj.classList.contains('hidden'))
                        domObj.classList.remove('hidden');
                    
                    domObj = document.querySelector('#instructions');
                    if (!domObj.classList.contains('hidden'))
                        domObj.classList.add('hidden');

                    domObj = document.querySelector('#highScores');
                    if (!domObj.classList.contains('hidden'))
                        domObj.classList.add('hidden');
                    break;
                    
                default:
                    console.log(`ERROR! trying to updateDom to ${state}!`);
                    return;
            }
        }
    },

    init: function() {
        vp.canvas = document.querySelector('#viewport');
        vp.ctx = vp.canvas.getContext('2d');

        document.querySelector('body').addEventListener('keydown', (e) => { game.keyDownEvent(e); });
        document.querySelector('body').addEventListener('keyup', (e) => { game.keyUpEvent(e); });

        shouldQuit = false;
        paused = true;
        this.lastUpdateTime = Date.now();

        this.gameState.setState('instructions');
        this.level = 1;
        while (this.entities.length > 0)
            this.entities.pop()
        this.loadLevel();
    },

    loadLevel: function() {
        const rowPad = 6;
        const colPad = 6;
        const gutterWidth = 20;
        const brickWidth = (vp.canvas.width - colPad*5 - gutterWidth*2)/6;
        const brickHeight = 25;
        let row = 100;
        const col = gutterWidth + brickWidth/2;


        for (let i=0; i<4; i++) {
            for (let j=0; j<6; j++) {
                this.entities.push(new Brick(col + brickWidth * j + colPad * j, row + brickHeight * i + rowPad * i, brickWidth, brickHeight));
            }
        }

        this.entities.push(new Ball(10,50,vp.canvas.height - 30,.2,-.2));
        this.entities.push(new Paddle(vp.canvas.width / 2, vp.canvas.height - 20, 120, 20));
    },

    update: function(dt) { 
        if (this.gameState.isInstructions()) {
            if (this.controlKeys.KeyI || this.controlKeys.KeyP) {
                this.controlKeys.KeyI = false;
                this.controlKeys.KeyP = false;
                this.gameState.setState('gamePlay');
                paused = false;
            }
        } else if (this.gameState.isHighScores()) {
            if (this.controlKeys.KeyP) {
                this.controlKeys.KeyP = false;
                this.gameState.setState('gamePlay');
                this.init();
                paused = false;
                shouldQuit = false;
            }
        } else {
            if (this.controlKeys.KeyI) {
                paused = true;
                this.controlKeys.KeyI = false;
                this.gameState.setState('instructions');
            }
            if (this.controlKeys.KeyQ) {
                shouldQuit = true;
                paused = true;
                this.gameState.setState('highScores');
            }
            if (this.controlKeys.KeyP) {
                this.controlKeys.KeyP = false;
                paused = !paused;
            }

            if (!paused) {
                for (const ent of game.entities) {
                    ent.update(dt, this.controlKeys);
                }
            }
        }
    },
    
    draw: function() {
        if(!shouldQuit && !paused) {
            //  clear to bgColor before drawing all entities
            vp.ctx.fillStyle = game.bgColor;
            vp.ctx.fillRect(0,0,vp.canvas.width,vp.canvas.height);

            for (const ent of game.entities) {
                ent.draw()
            }
        }
    },
    
    loop: function() {
        let currTime = Date.now();
        let deltaTime = currTime - this.lastUpdateTime;
        this.lastUpdateTime = currTime;

        game.update(deltaTime)
        game.draw()
        
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
