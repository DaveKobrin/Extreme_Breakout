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
    vel = {x:0, y:0};
    active = true;

    constructor(rad = 0, posX = 0, posY = 0, velX = 0, velY = 0, color = '#ddd') {
        super(rad, posX, posY, color);
        this.vel.x = velX;
        this.vel.y = velY;
    }

    update(dt) {
        if(!this.active)
            return;
        let newPos = {};
        newPos.x = this.getPosition().x + this.vel.x * dt;
        newPos.y = this.getPosition().y + this.vel.y * dt;
        
        newPos = this.hitBoundry(newPos);
        newPos = this.hitPaddle(newPos);
        for (const brick of game.bricks) {
            newPos = this.hitBrick(newPos, brick);
        }
console.log(`update ball vel ${this.vel.x}, ${this.vel.y}`)
        this.setPosition(newPos.x, newPos.y);

        if (newPos.y > vp.canvas.height + this.rad) {
            //life lost
            this.active = false;
            console.log('life lost');
        }
    }

    hitBoundry(pos) {
        if(pos.x < this.getRadius()) {
            pos.x = this.getRadius();
            this.vel.x *= -1;
        } else if (pos.x + this.getRadius() > vp.canvas.width) {
            pos.x = vp.canvas.width - this.getRadius();
            this.vel.x *= -1;
        }
        if (pos.y < this.getRadius()) { 
            pos.y = this.getRadius();
            this.vel.y *= -1;
        }
        return pos;
    }

    hitPaddle(pos) {
            
        return this.hitRect(pos, game.paddle);
    }

    hitBrick(pos, brick) {
        if (brick.isDestroyed() )
            return pos;

        return this.hitRect(pos, brick);
    }

    hitRect(pos, rect) {
        const r     = this.getRadius();
        const rectW = rect.getWidth();
        const rectH = rect.getHeight(); 
        const min   = rect.getUpperLeft();
        const max   = rect.getLowerRight();
        
        let closestPoint = {x:pos.x, y:pos.y};

        if(closestPoint.x < min.x) closestPoint.x = min.x;
        if(closestPoint.y < min.y) closestPoint.y = min.y;
        if(closestPoint.x > max.x) closestPoint.x = max.x;
        if(closestPoint.y > min.y) closestPoint.y = max.y;
        
        let len2CPsq = (pos.x-closestPoint.x)**2 + (pos.y-closestPoint.y)**2
        if (len2CPsq <= r**2){
            // collision
            // console.log(`typeof rect: ${rect instanceof Brick}`);//cp ${closestPoint.x}, ${closestPoint.y}    min ${min.x}, ${min.y}   max ${max.x}, ${max.y}`)
            if (closestPoint.x === min.x || (closestPoint.x - min.x) / rectW < .1) { // hit on or very close to left side
                // console.log(`hit brick on left ${this.vel.x} threshold : ${(closestPoint.x - min.x) / brickW}`);
                this.vel.x = this.vel.x > 0 ? this.vel.x *= -1: this.vel.x;
                pos.x = min.x - r;
            } else if (closestPoint.x === max.x || (max.x - closestPoint.x) / rectW < .1) { // hit on or very close to right side
                // console.log(`hit brick on right ${this.vel.x} threshold : ${(max.x - closestPoint.x) / brickW}`);
                this.vel.x = this.vel.x < 0 ? this.vel.x *= -1: this.vel.x;
                pos.x = max.x + r;
            }
            if (closestPoint.y === min.y || (closestPoint.y - min.y) / rectH < .1) { //hit on or very close to top
                // console.log(`hit brick on top ${this.vel.y} threshold : ${(closestPoint.y - min.y) / brickH}`);
                this.vel.y = this.vel.y > 0 ? this.vel.y *= -1: this.vel.y;
                pos.y = min.y - r;
            } else if (closestPoint.y === max.y || (max.y - closestPoint.y) / rectH < .1) { //hit on or very close to bottom
                // console.log(`hit brick on bottom ${this.vel.y} threshold : ${(max.y - closestPoint.y) / brickH}`);
                this.vel.y = this.vel.y < 0 ? this.vel.y *= -1: this.vel.y;
                pos.y = max.y + r;
            }
            if (rect instanceof Brick)
                rect.setHitThisFrame();

            if (rect instanceof Paddle) {
                this.vel.x += game.paddle.getAveVel();
                if(this.vel.x > .5) 
                    this.vel.x = .5;
                if(this.vel.x < -.5)
                    this.vel.x = -.5;
            }
        }
        return pos;
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
    getHalfSize() { return { x: this.w/2, y: this.h/2}; }
    getUpperLeft() { return this.ulCorner; }
    getLowerRight() { return this.brCorner; }
    getUpperRight() { return { x: this.brCorner.x, y: this.ulCorner.y}; }
    getLowerLeft() { return { x: this.ulCorner.x, y: this.brCorner.y}; }

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
    hitThisFrame = false;

    constructor(posX = 0, posY = 0, width = 0, height = 0, health = 1, points = 1, color = '#00d') {
        super(posX, posY, width, height, color);
        this.health = health;
        this.points = points;
        this.destroyed = false;
    }

    setHitThisFrame() { this.hitThisFrame=true; }

    isDestroyed() { return this.destroyed; }
    isHitThisFrame() { return this.hitThisFrame; }

    update() {
        if (this.hitThisFrame) {
            this.health--;
            this.hitThisFrame = false;
            game.setScore(this.points);
            if(this.health <= 0)
                this.destroyed = true;
        }
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
    maxVel = .5;        // movement speed per frame
    normalWidth = 0;
    averageVel = 0;
    vels = [];

    constructor(posX = 0, posY = 0, width = 0, height = 0, color = '#dd1') {
        super(posX, posY, width, height, color);
        this.normalWidth = width;    
    }

    getAveVel() { return this.averageVel; }

    update(dt, keys) {
        let curVel = 0;
        if (keys.ArrowLeft) {
            curVel -= this.maxVel; 
            let newX = this.getPosition().x - this.maxVel * dt;
            newX = newX > this.getWidth()/2 ? newX : this.getWidth()/2;
            this.setPosition(newX);
        } else if (keys.ArrowRight) {
            curVel += this.maxVel;
            let newX = this.getPosition().x + this.maxVel * dt;
            newX = newX < vp.canvas.width - this.getWidth()/2 ? newX : vp.canvas.width - this.getWidth()/2;
            this.setPosition(newX);
        }
        if (keys.Space) {

        }
        this.vels.push(curVel);
        if (this.vels.length > 10)
            this.vels.shift();
        this.averageVel = this.vels.reduce((acc, el) => acc + el)/this.vels.length;
    }
}

//-----------------------------------------------------------------
//  Global Variables
//-----------------------------------------------------------------
const vp = {}
let shouldQuit = false;
let paused = false;
const game = {
    bricks: [],
    balls: [],
    paddle: null,
    bgColor: '#222',
    lastUpdateTime: 0,
    level: 1,
    score: 0,
    lives: 3,

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
            let domObj = null;
            switch (state) {
                case 'instructions':
                    this.instructions = true;
                    this.highScores = false;
                    this.gamePlay = false;

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
                    this.instructions = false;
                    this.highScores = true;
                    this.gamePlay = false;
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
                    this.instructions = false;
                    this.highScores = false;
                    this.gamePlay = true;
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
                    console.log(`ERROR! trying to switch gameState to ${state}!`);
                    return;
            }
        }
    },

    getScore() { return this.score; },
    setScore(amount) { this.score += amount; },

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
        this.score = 0;

        while (this.balls.length > 0)
            this.balls.pop();
        this.paddle = null;
        
        this.loadLevel();

        this.balls.push(new Ball(10,50,vp.canvas.height - 30,.2,-.2));
        this.paddle = new Paddle(vp.canvas.width / 2, vp.canvas.height - 20, 120, 20);
        // this.bricks.push(new Brick( 250, 250, 100, 40));
    },

    loadLevel: function() {
        const rowPad = 6;
        const colPad = 6;
        const gutterWidth = 20;
        const brickWidth = (vp.canvas.width - colPad*5 - gutterWidth*2)/6;
        const brickHeight = 25;
        const row = 100;
        const col = gutterWidth + brickWidth/2;

        //clear any bricks from the array
        while (this.bricks.length > 0)
            this.bricks.pop();

        //create new bricks
        for (let i=0; i<4; i++) {
            for (let j=0; j<6; j++) {
                this.bricks.push(new Brick(col + brickWidth * j + colPad * j, row + brickHeight * i + rowPad * i, brickWidth, brickHeight, this.level));
            }
        }
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
                this.paddle.update(dt, this.controlKeys);
                for (const ball of game.balls) {
                    ball.update(dt);
                }
                let numBricksDestroyed = 0;
                for (const brick of this.bricks) {
                    brick.update(dt);
                    if (brick.isDestroyed())
                        numBricksDestroyed++;
                }

                if(numBricksDestroyed === this.bricks.length) {
                    // level cleared
                    this.level++
                    this.loadLevel();
                }
            }
        }
    },
    
    updateStatusBar() {
        //score level lives
        let domObj = document.querySelector('#score')
        domObj.innerText = this.score;

        domObj = document.querySelector('#level')
        domObj.innerText = this.level;
        
        domObj = document.querySelector('#lives')
        domObj.innerText = this.lives;
    },

    draw: function() {
        if(!shouldQuit && !paused) {
            //  clear to bgColor before drawing all entities
            vp.ctx.fillStyle = game.bgColor;
            vp.ctx.fillRect(0,0,vp.canvas.width,vp.canvas.height);

            this.updateStatusBar();

            for (const brick of game.bricks) {
                brick.draw();
            }
            for (const ball of this.balls) {
                ball.draw();
            }
            this.paddle.draw();
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
