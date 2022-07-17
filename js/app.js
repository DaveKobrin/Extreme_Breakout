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

//=================================================================
// Bomb - projectile class extends Circle - dropped at paddle
//=================================================================
class Bomb extends Circle {
    vel = { x: 0, y: .2 };

    update(dt) {
        let newPos = { x: this.getPosition().x + this.vel.x * dt, y: this.getPosition().y + this.vel.y * dt };

        if( newPos.y > vp.canvas.height + this.getRadius()) {   // bombs all fall at the samee speed, so if off the field, remove first bomb
            game.bombs.shift();
        }

        this.setPosition(newPos.x, newPos.y);
    }

}

//================================================================
// Ball - 2d filled circle
//================================================================
class Ball extends Circle {
    vel = {x:0, y:0};
    maxVelY = .2;
    maxVelX = .5;
    active = true;
    sticky = true;

    constructor(rad = 0, posX = 0, posY = 0, velX = 0, velY = 0, color = '#ddd') {
        super(rad, posX, posY, color);
        this.vel.x = velX;
        this.vel.y = velY;
        this.sticky = true;
    }

    isActive() { return this.active; }

    update(dt) {
        const keys = game.getControlKeys();
        if(!this.active)
            return;

        let newPos = {};

        if (this.sticky) {
            newPos.x = game.paddle.getPosition().x;
            newPos.y = game.paddle.getPosition().y - game.paddle.getHalfSize().y - this.rad;
            this.vel.x = game.paddle.getAveVel();
            this.vel.y = 0;
            if (keys.Space) {
                this.vel.y = -(this.maxVelY);
                this.sticky = false;
            }
        } else {   
            newPos.x = this.getPosition().x + this.vel.x * dt;
            newPos.y = this.getPosition().y + this.vel.y * dt;
            
            newPos = this.hitBoundry(newPos);
            newPos = this.hitRect(newPos, game.paddle);
            for (const brick of game.bricks) {
                newPos = this.hitRect(newPos, brick);
            }
            for (const alien of game.aliens) {
                newPos = this.hitRect(newPos, alien);
            }
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

    hitRect(pos, rect) {
        if (rect instanceof DestructableRect)
            if (rect.isDestroyed())
                return pos;

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
            if (rect instanceof DestructableRect)
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

//=================================================================
// DestructableRect - extends Rect - adds hit tracking point value
//                    and life management
//=================================================================
class DestructableRect extends Rect {
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
// Brick - Destroyable block rectangle
//================================================================
class Brick extends DestructableRect {
    constructor(posX = 0, posY = 0, width = 0, height = 0, health = 1, points = 1, color = '#00d') {
        super(posX, posY, width, height, health, points, color);
    }

}

//=================================================================
// Alien - enemy class extends Rect - will fire bombs down at paddle
//=================================================================
class Alien extends DestructableRect {
    image = '';
    maxVel = .5;
    maxBombChance = 0;
    bombChanceStep = 0;
    bombChance = 0;
    lastVel = 0;
    
    constructor(posX = 0, posY = 0, width = 0, height = 0, health = 1, points = 1, maxBombChance = .001, bombChanceStep = .001, color = '#0d0') {
        super(posX, posY, width, height, health, points, color);
        this.maxBombChance = maxBombChance;
        this.bombChanceStep = bombChanceStep;
    }

    update(dt) {
        super.update();
        let curVel = (Math.random()*this.maxVel*2 - this.maxVel)/10 + this.lastVel // random x velocity between -maxVel and +maxVel
        curVel = curVel > this.maxVel ? this.maxVel : curVel;
        curVel = curVel < -this.maxVel ? -this.maxVel : curVel;
        this.lastVel = curVel;

        let newX = this.getPosition().x + curVel * dt;
        if (newX < this.getHalfSize().x){
            newX = this.getHalfSize().x;
            this.lastVel = -this.lastVel;
        } else if (newX > vp.canvas.width - this.getHalfSize().x) {
            newX = vp.canvas.width - this.getHalfSize().x;
            this.lastVel = -this.lastVel;
        }
            
        this.setPosition(newX);
        
        if (this.shouldAttack()) {
            game.bombs.push(new Bomb(10, this.getPosition().x, this.getPosition().y, '#ad1'));
        }
        // console.log(`curVel: ${curVel}  newX: ${newX}`);
    }

    shouldAttack() { 
        this.bombChance += this.bombChanceStep;
        this.bombChance = this.bombChance > this.maxBombChance ? this.maxBombChance : this.bombChance; 
        let bomb = Math.random() < this.bombChance;
        if (bomb) {
            this.bombChance = 0;
            return true;
        }
        return false;
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

    update(dt) {
        const keys = game.getControlKeys();
        let curVel = 0;
        if (keys.ArrowLeft) {
            curVel -= this.maxVel; 
            let newX = this.getPosition().x + curVel * dt;
            newX = newX > this.getHalfSize().x ? newX : this.getHalfSize().x;
            this.setPosition(newX);
        } else if (keys.ArrowRight) {
            curVel += this.maxVel;
            let newX = this.getPosition().x + curVel * dt;
            newX = newX < vp.canvas.width - this.getHalfSize().x ? newX : vp.canvas.width - this.getHalfSize().x;
            this.setPosition(newX);
        }

        this.vels.push(curVel);
        if (this.vels.length > 10)
            this.vels.shift();
        this.averageVel = this.vels.reduce((acc, el) => acc + el)/this.vels.length;
    }
}

//=================================================================
// Collider - static class to handle collision detection and resolulution
//          throughout, resolve should be:
//          0 - no resolution just return if collision
//          1 - resolve by updating obj1 position
//          2 - resolve by updating obj2 position
//=================================================================
class Collider {
    static collide(obj1, obj2, resolve = 0){
        const result = { hit: false, newPosOffset:{x: 0, y:0}, newVel:{x:0, y:0}};

    }

    static colCirclRect(circle, rectangle, result, resolve=0) {
        if (rectangle instanceof DestructableRect) {
            if (rectangle.isDestroyed()) {
                return;
            }
        }
        const cPos  = circle.getPosition();
        const r     = circle.getRadius();
        const rectW = rectangle.getWidth();
        const rectH = rectangle.getHeight(); 
        const min   = rectangle.getUpperLeft();
        const max   = rectangle.getLowerRight();
        
        let closestPoint = {x:pos.x, y:pos.y};

        if(closestPoint.x < min.x) closestPoint.x = min.x;
        if(closestPoint.y < min.y) closestPoint.y = min.y;
        if(closestPoint.x > max.x) closestPoint.x = max.x;
        if(closestPoint.y > min.y) closestPoint.y = max.y;
        
        let len2CPsq = (pos.x-closestPoint.x)**2 + (pos.y-closestPoint.y)**2
        if (len2CPsq <= r**2){
            // collision
            result.hit = true;
            if(resolve === 0)
                return;
            // console.log(`typeof rect: ${rect instanceof Brick}`);//cp ${closestPoint.x}, ${closestPoint.y}    min ${min.x}, ${min.y}   max ${max.x}, ${max.y}`)
            if (closestPoint.x === min.x || (closestPoint.x - min.x) / rectW < .1) { // hit on or very close to left side
                // console.log(`hit brick on left ${this.vel.x} threshold : ${(closestPoint.x - min.x) / brickW}`);
                result.newVel.x = circle.vel.x > 0 ? -circle.vel.x : circle.vel.x;
                result.newPosOffset.x = r - min.x - cPos.x;
            } else if (closestPoint.x === max.x || (max.x - closestPoint.x) / rectW < .1) { // hit on or very close to right side
                // console.log(`hit brick on right ${this.vel.x} threshold : ${(max.x - closestPoint.x) / brickW}`);
                result.newVel.x = circle.vel.x < 0 ? -circle.vel.x : circle.vel.x;
                result.newPosOffset.x = r - cPos.x - max.x;
            }
            if (closestPoint.y === min.y || (closestPoint.y - min.y) / rectH < .1) { //hit on or very close to top
                // console.log(`hit brick on top ${this.vel.y} threshold : ${(closestPoint.y - min.y) / brickH}`);
                result.newVel.y = circle.vel.y > 0 ? -circle.vel.y : circle.vel.y;
                result.newPosOffset.y = r - cPos.y - min.y;
            } else if (closestPoint.y === max.y || (max.y - closestPoint.y) / rectH < .1) { //hit on or very close to bottom
                // console.log(`hit brick on bottom ${this.vel.y} threshold : ${(max.y - closestPoint.y) / brickH}`);
                result.newVel.y = circle.vel.y < 0 ? -circle.vel.y : circle.vel.y;
                result.newPosOffset.y = r - max.y - cPos.y;
            }
            if (rectangle instanceof DestructableRect)
                rectangle.setHitThisFrame();

            if (rectangle instanceof Paddle) {
                circle.vel.x += game.paddle.getAveVel();
                if(circle.vel.x > .5) 
                    circle.vel.x = .5;
                if(circle.vel.x < -.5)
                    circle.vel.x = -.5;
            }
        }
        return pos;
    }

    static colRectRect(rect1, rect2, result, resolve = 0) {

    }
}
//=================================================================
// GameState - control what mode the game is in
//=================================================================
class GameState {
    instructions = true;
    highScores   = false;
    gamePlay     = false;

    constructor(){
        this.instructions = true;
        this.highScores   = false;
        this.gamePlay     = false;    
    }

    isInstructions() { return this.instructions; };
    isHighScores() { return this.highScores; };
    isGamePlay() { return this.gamePlay; };

    setState(state) {
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
}
//=================================================================
// Game - the main class for the game
//=================================================================
class Game {
    bricks = [];
    balls = [];
    aliens = [];
    bombs = [];
    paddle = null;
    bgColor = '#222';
    lastUpdateTime = 0;
    level = 1;
    score = 0;
    lives = 3;
    gameState = null;

    controlKeys = {
            ArrowRight: false,
            ArrowLeft:  false,
            Space:      false,
            KeyP:       false,
            KeyI:       false,
            KeyQ:       false
    };

    constructor () {
        this.bricks = [];
        this.balls = [];
        this.paddle = null;
        this.bgColor = '#222';
        this.lastUpdateTime = 0;
        this.level = 1;
        this.score = 0;
        this.lives = 3;
        this.gameState = new GameState();
    }

    getControlKeys() { return this.controlKeys; }
    getScore() { return this.score; }
    setScore(amount) { this.score += amount; }

    init() {
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
        this.lives = 3;

        while (this.balls.length > 0)
            this.balls.pop();
        this.paddle = null;
        
        this.loadLevel();

        this.balls.push(new Ball(10));
        this.paddle = new Paddle(vp.canvas.width / 2, vp.canvas.height - 20, 120, 20);
        // this.bricks.push(new Brick( 250, 250, 100, 40));
    }

    loadLevel() {
        const rowPad = 6;
        const colPad = 6;
        const gutterWidth = 20;
        const brickWidth = (vp.canvas.width - colPad*5 - gutterWidth*2)/6;
        const brickHeight = 25;
        const row = 100;
        const col = gutterWidth + brickWidth/2;

        //clear any level objects from the arrays
        while (this.bricks.length > 0)
            this.bricks.pop();
        while (this.aliens.length > 0)
            this.aliens.pop();
            
        //create new bricks
        for (let i=0; i<4; i++) {
            for (let j=0; j<6; j++) {
                this.bricks.push(new Brick(col + brickWidth * j + colPad * j, row + brickHeight * i + rowPad * i, brickWidth, brickHeight, this.level));
            }
        }

        this.aliens.push(new Alien(vp.canvas.width/2, 50, 50, 50, 1, 100,(.001 * this.level), (.0001 * this.level)));

    }

    update(dt) { 
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
                this.paddle.update(dt);

                let numActiveBalls = this.balls.length
                for (const ball of this.balls) {
                    if (ball.isActive()) {
                        ball.update(dt);
                    } else {
                        numActiveBalls--;
                    }
                }

                if (numActiveBalls === 0){
                    while (this.balls.length > 0)
                        this.balls.pop();
                    this.lives--;
                    if (this.lives > 0) {
                        this.balls.push(new Ball(10));
                    } else {
                        // game over
                        alert('GAME OVER!')
                        this.gameState.setState('highScores');
                    }
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

                for (const alien of this.aliens) {
                    if (!alien.isDestroyed())
                        alien.update(dt);
                }
                
                for (const bomb of this.bombs) {
                    bomb.update(dt);
                }
            }
        }
    }
    
    updateStatusBar() {
        //score level lives
        let domObj = document.querySelector('#score')
        domObj.innerText = this.score;

        domObj = document.querySelector('#level')
        domObj.innerText = this.level;
        
        domObj = document.querySelector('#lives')
        domObj.innerText = this.lives;
    }

    draw() {
        if(!shouldQuit && !paused) {
            //  clear to bgColor before drawing all entities
            vp.ctx.fillStyle = game.bgColor;
            vp.ctx.fillRect(0,0,vp.canvas.width,vp.canvas.height);

            this.updateStatusBar();

            for (const brick of game.bricks) {
                brick.draw();
            }
            for (const alien of this.aliens) {
                alien.draw();
            }
            for (const bomb of this.bombs) {
                bomb.draw();
            }
            for (const ball of this.balls) {
                ball.draw();
            }
            this.paddle.draw();
        }
    }
    
    loop() {
        let currTime = Date.now();
        let deltaTime = currTime - game.lastUpdateTime;
        game.lastUpdateTime = currTime;

        game.update(deltaTime)
        game.draw()
        
        requestAnimationFrame(game.loop);    // keep game loop running while on page
    }

    keyDownEvent(e) {
        if(!Object.keys(this.controlKeys).includes(e.code))
            return;
        this.controlKeys[e.code] = true;
    }

    keyUpEvent(e) {
        if(!Object.keys(this.controlKeys).includes(e.code))
            return;
        this.controlKeys[e.code] = false;
    }

}

//-----------------------------------------------------------------
//  Global Variables
//-----------------------------------------------------------------
const vp = {}
let shouldQuit = false;
let paused = false;
const game = new Game();

//-----------------------------------------------------------------
//start game
//-----------------------------------------------------------------
game.init();
game.loop();
//=================================================================
//
//=================================================================