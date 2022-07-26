//==============================================================
// Extreme Breakout - original take on the classic Breakout game
//
//      By: David Kobrin
//          david_kobrin@yahoo.com
//          7/2022
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
        if(!this.active)
            return;

        let newPos = {};

        if (this.sticky) {
            newPos.x = game.paddle.getPosition().x;
            newPos.y = game.paddle.getPosition().y - game.paddle.getHalfSize().y - this.rad;
            this.vel.x = game.paddle.getAveVel();
            this.vel.y = 0;
            if (InputManager.getControlKeyDown('Space')) {
                this.vel.y = -(this.maxVelY);
                this.sticky = false;
            }
        } else {   
            newPos.x = this.getPosition().x + this.vel.x * dt;
            newPos.y = this.getPosition().y + this.vel.y * dt;
            
            newPos = this.hitBoundry(newPos);

            this.setPosition(newPos.x, newPos.y);

            let colRes = Collider.collide(this, game.paddle, true);
            newPos.x += colRes.newPosOffset.x;
            newPos.y += colRes.newPosOffset.y;
            if (colRes.hit) { //paddle hit
                this.vel = colRes.newVel;
                SfxManager.play('ballRebound');
            }

            for (const brick of game.bricks) {
                colRes = Collider.collide(this, brick, true);
                newPos.x += colRes.newPosOffset.x;
                newPos.y += colRes.newPosOffset.y;
                if (colRes.hit) {
                    this.vel = colRes.newVel;
                }
            }

            for (const alien of game.aliens) {
                colRes = Collider.collide(this, alien, true);
                newPos.x += colRes.newPosOffset.x;
                newPos.y += colRes.newPosOffset.y;
                if (colRes.hit) {
                    this.vel = colRes.newVel;
                    SfxManager.play('alienDeath');
                }
            }
        }

        this.setPosition(newPos.x, newPos.y);

        if (newPos.y > vp.canvas.height + this.rad) {
            //ball lost
            this.active = false;
            // console.log('ball lost');
        }
    }

    hitBoundry(pos) {
        let hit = false;

        if(pos.x < this.getRadius()) {
            pos.x = this.getRadius();
            this.vel.x *= -1;
            hit = true;
        } else if (pos.x + this.getRadius() > vp.canvas.width) {
            pos.x = vp.canvas.width - this.getRadius();
            this.vel.x *= -1;
            hit = true;
        }
        if (pos.y < this.getRadius()) { 
            pos.y = this.getRadius();
            this.vel.y *= -1;
            hit = true;
        }
        if (hit){ //play sfx
            SfxManager.play('ballRebound');
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

    setColor(color) { this.color = color; }

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
            this.health -= game.getBallDamage();
            this.hitThisFrame = false;
            game.setScore(this.points * game.getBallDamage());
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

    static colors = [ '#17518e',    //teal monochrome palette
                    '#1367a1',
                    '#0f7db4',
                    '#0c93c7',
                    '#08a8d9',
                    '#04beec',
                    '#00d4ff'
                ];
    // static colors = [ '#FF006F',    //fuscia to light blue palette
    //                 '#E3177F',
    //                 '#C62E8F',
    //                 '#AA459F',
    //                 '#8E5CAF',
    //                 '#7174BF',
    //                 '#558BCF',
    //                 '#39A2DF',
    //                 '#1CB9EF',
    //                 '#00D0FF'
    //             ];

    // static colors = [ '#df03a8', //fuscia to purple palette
    //                 '#ce03a0',
    //                 '#bd028a',
    //                 '#ac0291',
    //                 '#9b028a',
    //                 '#8a0182',
    //                 '#79017b',
    //                 '#680173',
    //                 '#57006c',
    //                 '#460064'
    //             ];
    // static colors = [ '#0d47a1', //blue monochromatic palette
    //             '#1565c0',
    //             '#1976d2',
    //             '#1e88e5',
    //             '#2196f3',
    //             '#42a5f5',
    //             '#64b5f6',
    //             '#90caf9',
    //             '#bbdefb',
    //             '#e3f2fd'
    //         ];
    curColor = 0;

    constructor(posX = 0, posY = 0, width = 0, height = 0, health = 1, points = 1, color = this.colors[0]) {
        super(posX, posY, width, height, health, points, color);
        this.curColor = Brick.colors.indexOf(color);
    }

    static getColor(num) { return Brick.colors[num % Brick.colors.length]; }

    update() {
        const hit = this.hitThisFrame;
        super.update();

        if (hit) {
            for (let i = 0; i < game.getBallDamage(); i++){
                this.curColor = (this.curColor - 1 < 0) ? Brick.colors.length - 1 : this.curColor - 1;
            }

            this.setColor( Brick.colors[this.curColor] ); 

            //check to spawn power-up
            if (Math.random() < game.powerUpRate) {
                PowerUp.spawnPowerUp(this);
            }

            if (this.isDestroyed()) {
                // audioElems[6].currentTime = 0;
                // audioElems[6].play();
                SfxManager.play('brickBreak');
            } else {
                // audioElems[0].currentTime = 0;
                // audioElems[0].play();
                SfxManager.play('ballRebound')
            }
        }
    }

}

//=================================================================
// Alien - enemy class extends Rect - will fire bombs down at paddle
//=================================================================
class Alien extends DestructableRect {
    image = 'assets/alien.svg';
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
            // audioElems[2].currentTime = 0;
            // audioElems[2].play();
            SfxManager.play('bombDrop');
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

    draw() {
        if (!this.destroyed){
            const myImage = new Image();
            myImage.src = this.image;
            vp.ctx.drawImage(myImage, this.ulCorner.x, this.ulCorner.y, this.w, this.h);
        }
    }
}

//=================================================================
// PowerUp - base class for power-ups to inherit from extends DestructableRect
//=================================================================
class PowerUp extends DestructableRect {
    vel = { x:0, y:.15 };
    static availablePowerUps = [
        'extraLife',
        'multiBall',
        'widePaddle',
        'stunProof',
        'heavyBall'
    ]
    constructor(rect) {
        super(rect.getPosition().x, rect.getPosition().y, rect.getWidth(), rect.getHeight(), 1, 0)
    }

    static spawnPowerUp(rect) { 
        // takes in rect to spawn new powerUp from
        // creates a new random powerUp and pushes it to the game.powerUps array
        const choice = Math.floor(Math.random() * this.availablePowerUps.length);
        let newPu = null;
        switch(this.availablePowerUps[choice]) {
            case 'extraLife':
                newPu = new ExtraLife(rect);
                break;
            case 'multiBall':
                newPu = new MultiBall(rect);
                break;
            case 'widePaddle':
                newPu = new WidePaddle(rect);
                break;
            case 'stunProof':
                newPu = new StunProof(rect);
                break;
            case 'heavyBall':
                newPu = new HeavyBall(rect);
                break;
        }
        game.powerUps.push(newPu);
    }

    applyPowerUp() {} //overload in subclass to do the thing

    update(dt) {
        let newPos = { x: this.getPosition().x + this.vel.x * dt, y: this.getPosition().y + this.vel.y * dt };
        this.setPosition(newPos.x, newPos.y);

        //check for collision
        const result = Collider.collide(this, game.paddle, false);
        
        if (result.hit) {
            this.hitThisFrame = false;
            this.destroyed = true;
            //add pu effects
            this.applyPowerUp();
            SfxManager.play('powerUp');
        }

        if( newPos.y > vp.canvas.height + this.getHeight()) {   // bombs all fall at the samee speed, so if off the field, remove first bomb
            game.powerUps.shift();
        }
    }
}

//=================================================================
// ExtraLife - extends PowerUp - grants extra ball to game
//=================================================================
class ExtraLife extends PowerUp{
    constructor(rect) {
        super(rect);
        this.setColor('#bb2');
    }
    applyPowerUp() {
        game.lives++;
    }
}

//=================================================================
// MultiBall - extends PowerUp - spawns another ball immediately
//=================================================================
class MultiBall extends PowerUp{
    constructor(rect) {
        super(rect);
        this.setColor('#aaa');
    }

    applyPowerUp() {
        game.spawnBall();
    }
}

//=================================================================
// WidePaddle - extends PowerUp - lengthens the paddle for 30s
//=================================================================
class WidePaddle extends PowerUp{
    constructor(rect) {
        super(rect);
        this.setColor('#ff0');
    }
    
    applyPowerUp() {
        game.setNewPowerUpInfo('widePaddle', 30);
        game.paddle.setWidth(game.paddle.getWidth() * 1.3);     // increase paddle width 30%
    }
}

//=================================================================
// StunProof - extends PowerUp - immune to stun bomb for 30s
//=================================================================
class StunProof extends PowerUp{
    constructor(rect) {
        super(rect);
        this.setColor('#292');
    }
    
    applyPowerUp() {
        game.setNewPowerUpInfo('stunProof', 30);
        game.paddle.setStunProof(true);
    }
}

//=================================================================
// HeavyBall - extends PowerUp - ball hits for 1 additional damage for 30s
//=================================================================
class HeavyBall extends PowerUp{
    constructor(rect) {
        super(rect);
        this.setColor('#fff');
    }

    applyPowerUp() {
        game.setNewPowerUpInfo('heavyBall', 30);
        game.setBallDamage(2);
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
    stunned = false;
    stunTimeoutID = null;
    stunProof = false;

    constructor(posX = 0, posY = 0, width = 0, height = 0, color = '#dd1') {
        super(posX, posY, width, height, color);
        this.normalWidth = width;    
    }

    getAveVel() { return this.averageVel; }

    setStunProof(value) { this.stunProof = value; }

    setWidth(width) {
        this.w = width;
        if (this.pos.x + this.getHalfSize().x > vp.canvas.width) {
            this.setPosition(vp.canvas.width - this.getHalfSize().x);
        } else if (this.pos.x - this.getHalfSize().x < 0) {
            this.setPosition(this.getHalfSize().x);
        } else {
            this.adjustCorners();
        }
    }

    update(dt) {
        // const keys = game.getControlKeys();
        let curVel = 0;

        if(!this.stunned) {
            if (InputManager.getControlKeyDown('ArrowLeft') || InputManager.getDragLeft()) {
                curVel = InputManager.getDragLeft() ? InputManager.getDragAmt() : -this.maxVel; 
                // console.log('left curVel ',curVel);
                let newX = this.getPosition().x + curVel * dt;
                newX = newX > this.getHalfSize().x ? newX : this.getHalfSize().x;
                this.setPosition(newX);
            } else if (InputManager.getControlKeyDown('ArrowRight') || InputManager.getDragRight()) {
                curVel = InputManager.getDragRight() ? InputManager.getDragAmt() : this.maxVel;
                // console.log('right curVel ',curVel);
                let newX = this.getPosition().x + curVel * dt;
                newX = newX < vp.canvas.width - this.getHalfSize().x ? newX : vp.canvas.width - this.getHalfSize().x;
                this.setPosition(newX);
            }
        }

        this.vels.push(curVel);
        if (this.vels.length > 10)
            this.vels.shift();
        this.averageVel = this.vels.reduce((acc, el) => acc + el)/this.vels.length;

        if (!this.stunProof) {
            //check collisions with bombs skip if immune
            for (const bomb of game.bombs) {
                let hit = Collider.collide( this, bomb, false).hit;
                if (hit) {
                    this.hitBomb();
                    break;  // exit early additional hits would not change anything
                }
            }
        }
    }

    hitBomb() {
        if(this.stunTimeoutID !== null) {
            clearTimeout(this.stunTimeoutID);
            // audioElems[1].currentTime = 0;
            SfxManager.stop('paddleStun');
        }

        this.stunned = true;
        // audioElems[1].play();
        SfxManager.play('paddleStun');
        this.stunTimeoutID = setTimeout( ()=> { 
            // audioElems[1].pause();
            // audioElems[1].currentTime = 0;
            SfxManager.stop('paddleStun');
            game.paddle.stunned = false;
            game.paddle.stunTimeoutID = null; }, 2000);
    }
}

//=================================================================
// Collider - static class to handle collision detection and resolulution
//          throughout, resolve should be:
//          false - no resolution just return if collision
//          true - resolve by updating the circle's position, this game only needs to resolve ball collisions
//=================================================================
class Collider {
    static collide(obj1, obj2, resolve = false){
        const result = { hit: false, newPosOffset:{x: 0, y:0}, newVel:{x:0, y:0}};
        if (obj1 instanceof Circle && obj2 instanceof Rect)     Collider.colCirclRect(obj1, obj2, result, resolve);
        if (obj1 instanceof Rect && obj2 instanceof Circle)     Collider.colCirclRect(obj2, obj1, result, resolve);
        if (obj1 instanceof Rect && obj2 instanceof Rect)       Collider.colRectRect(obj2, obj1, result, false);
        
        return result;
    }

    static colCirclRect(circle, rectangle, result, resolve=false) {
        // collision detection of a circle and an axis aligned rectangle this method does allow for resolution of the position and
        // velocity of the circle only. 
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
        
        let closestPoint = {x:cPos.x, y:cPos.y};

        if(closestPoint.x < min.x) closestPoint.x = min.x;
        if(closestPoint.y < min.y) closestPoint.y = min.y;
        if(closestPoint.x > max.x) closestPoint.x = max.x;
        if(closestPoint.y > max.y) closestPoint.y = max.y;
        
        let len2CPsq = (cPos.x-closestPoint.x)**2 + (cPos.y-closestPoint.y)**2
        if (len2CPsq <= r**2){
            // collision
            result.hit = true;
            if(!resolve)
                return;
                let minOff = { x: 0, y: 0 };
                let maxOff = { x: 0, y: 0 };
            if(closestPoint.x === cPos.x && closestPoint.y === cPos.y) {
                minOff = { x: closestPoint.x - min.x, y: closestPoint.y - min.y };
                maxOff = { x: max.x - closestPoint.x, y: max.y - closestPoint.y };
                (minOff.x < maxOff.x) ? maxOff.x = 0 : minOff.x = 0;
                (minOff.y < maxOff.y) ? maxOff.y = 0 : minOff.y = 0;
                if(minOff.x > r) minOff.x = 0;
                if(minOff.y > r) minOff.y = 0;
                if(maxOff.x > r) maxOff.x = 0;
                if(maxOff.y > r) maxOff.y = 0;
            }    
            result.newVel = circle.vel;
            // console.log(`typeof rect: ${rect instanceof Brick}`);//cp ${closestPoint.x}, ${closestPoint.y}    min ${min.x}, ${min.y}   max ${max.x}, ${max.y}`)
            if (closestPoint.x === min.x || (closestPoint.x - min.x) / rectW < .1 || minOff.x !== 0)  { // hit on or very close to left side
                // console.log(`hit brick on left ${this.vel.x} threshold : ${(closestPoint.x - min.x) / brickW}`);
                result.newVel.x = circle.vel.x > 0 ? -circle.vel.x : circle.vel.x;
                result.newPosOffset.x = -r - (min.x - cPos.x) - minOff.x;
            } else if (closestPoint.x === max.x || (max.x - closestPoint.x) / rectW < .1 || maxOff.x !== 0) { // hit on or very close to right side
                // console.log(`hit brick on right ${this.vel.x} threshold : ${(max.x - closestPoint.x) / brickW}`);
                result.newVel.x = circle.vel.x < 0 ? -circle.vel.x : circle.vel.x;
                result.newPosOffset.x = r - (cPos.x - max.x) + maxOff.x;
            }
            if (closestPoint.y === min.y || (closestPoint.y - min.y) / rectH < .1 || minOff.y !== 0) { //hit on or very close to top
                // console.log(`hit brick on top ${this.vel.y} threshold : ${(closestPoint.y - min.y) / brickH}`);
                result.newVel.y = circle.vel.y > 0 ? -circle.vel.y : circle.vel.y;
                result.newPosOffset.y = -r - (min.y - cPos.y) - minOff.y;
            } else if (closestPoint.y === max.y || (max.y - closestPoint.y) / rectH < .1 || maxOff.y !== 0) { //hit on or very close to bottom
                // console.log(`hit brick on bottom ${this.vel.y} threshold : ${(max.y - closestPoint.y) / brickH}`);
                result.newVel.y = circle.vel.y < 0 ? -circle.vel.y : circle.vel.y;
                result.newPosOffset.y = r - (cPos.y -  max.y) + maxOff.y;
            }
            if (rectangle instanceof DestructableRect)
                rectangle.setHitThisFrame();

            if (rectangle instanceof Paddle) {
                result.newVel.x += game.paddle.getAveVel();
                result.newVel.y = (result.newVel.y > 0) ? (circle.maxVelY + .02 * game.level) : -(circle.maxVelY + .02 * game.level);  
                if(result.newVel.x > .5) 
                    result.newVel.x = .5;
                if(result.newVel.x < -.5)
                    result.newVel.x = -.5;
            }
        }
        return;
    }

    static colRectRect(rect1, rect2, result, resolve = false) {
        // collision detection between two rectangles for the scope of this game I am not allowing resolution of this type
        // also this method only works for axis aligned rectangles

        if (rect1 instanceof DestructableRect) {
            if (rect1.isDestroyed()) {
                return;
            }
        }

        if (rect2 instanceof DestructableRect) {
            if (rect2.isDestroyed()) {
                return;
            }
        }

        const r1Min   = rect1.getUpperLeft();
        const r1Max   = rect1.getLowerRight();
        const r2Min   = rect2.getUpperLeft();
        const r2Max   = rect2.getLowerRight();

        if( (r1Min.x < r2Max.x) && (r1Max.x > r2Min.x) &&
            (r1Min.y < r2Max.y) && (r1Max.y > r2Min.y) ) {
            //collision
            result.hit = true;    
        }   // otherwise result.hit is already false
        return;
    }
}

//=================================================================
// Score - holds a players name and score for the leaderboard
//=================================================================
class Score {
    name = '';
    points = 0;

    constructor(name, points) {
        this.name = name;
        this.points = points;
    }

    getName() { return this.name; }
    getScore() { return this.points; }
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
                this.showHighScores();
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

    showHighScores(){
        const domElem = document.querySelector('#scoresUL');
        let str = '';
        for (const score of game.scores)
            str += `<li class="flexContainer shadow${score === game.currentScore?' current':''}"><span class="initials justLeft">${score.getName()}</span><span class="scores justRight">${score.getScore()}</span></li>`;
        domElem.innerHTML = str;
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
    scores = [];
    powerUps = [];
    powerUpInfo = { widePaddle: false, widePaddleTime: 0,
                    stunProof:  false, stunProofTime: 0,
                    heavyBall:  false, heavyBallTime: 0 }
    powerUpRate = .05; 
    ballDamage = 1;
    currentScore = null;
    paddle = null;
    bgColor = '#222';
    lastUpdateTime = 0;
    level = 1;
    score = 0;
    lives = 3;
    gameState = null;



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

    getBallDamage() { return this.ballDamage; }
    getScore() { return this.score; }
    setScore(amount) { this.score += amount; }
    setBallDamage(damage) { this.ballDamage = damage; }

    spawnBall() { this.balls.push(new Ball(10)); }

    setNewPowerUpInfo(item, time) {
        switch (item) {
            case 'widePaddle':
                this.powerUpInfo.widePaddle = true;
                this.powerUpInfo.widePaddleTime = time * 1000;
                break;
            case 'stunProof':
                this.powerUpInfo.stunProof = true;
                this.powerUpInfo.stunProofTime = time * 1000;
                break;
            case 'heavyBall':
                this.powerUpInfo.heavyBall = true;
                this.powerUpInfo.heavyBallTime = time * 1000;
                break;
        }
    }

    init() {
        vp.canvas = document.querySelector('#viewport');
        vp.ctx = vp.canvas.getContext('2d');

        shouldQuit = false;
        paused = true;
        this.lastUpdateTime = Date.now();

        InputManager.clearControlKeys();

        this.gameState.setState('instructions');
        this.level = 1;
        this.score = 0;
        this.lives = 3;
        this.currentScore = null;
        this.powerUps = [];

        this.loadPersistScores();

        this.balls = [];
        this.paddle = null;
        
        this.loadLevel();

        this.spawnBall();
        this.paddle = new Paddle(vp.canvas.width / 2, vp.canvas.height - 20, vp.canvas.width / 4.2, 20);   
    }

    loadPersistScores() {
        if (!localStorage.getItem('scoreBoard')) {
            this.scores = [];
        } else {
            this.scores = [];
            const tmp = JSON.parse(localStorage.getItem('scoreBoard'));
            for (const el of tmp){
                this.scores.push(new Score(el.name, el.points));
            }
        }
    }

    persistScores() {
        localStorage.setItem('scoreBoard', JSON.stringify(this.scores));
        console.log(localStorage.getItem('scoreBoard'));
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
        this.bricks = [];
        this.aliens = [];
            
        //create new bricks
        for (let i=0; i<4; i++) {
            for (let j=0; j<6; j++) {
                this.bricks.push(new Brick(col + brickWidth * j + colPad * j, row + brickHeight * i + rowPad * i, brickWidth, brickHeight, this.level,1,Brick.getColor(this.level - 1)));
            }
        }

        this.aliens.push(new Alien(vp.canvas.width/2, 50, 50, 50, 1, 100,(.001 * this.level), (.0001 * this.level)));

    }

    checkActivePowerUps(dt){
        if (this.powerUpInfo.widePaddle) {
            this.powerUpInfo.widePaddleTime -= dt;
            if (this.powerUpInfo.widePaddleTime <= 0) {
                this.paddle.setWidth(this.paddle.normalWidth);
                this.powerUpInfo.widePaddle = false;
            }
        }

        if (this.powerUpInfo.stunProof) {
            this.powerUpInfo.stunProofTime -= dt;
            if (this.powerUpInfo.stunProofTime <= 0) {
                this.paddle.setStunProof(false);
                this.powerUpInfo.stunProof = false;
            }
        }

        if (this.powerUpInfo.heavyBall) {
            this.powerUpInfo.heavyBallTime -= dt;
            if (this.powerUpInfo.heavyBallTime <= 0) {
                this.setBallDamage(1);
                this.powerUpInfo.heavyBall = false;
            }
        }
    }

    update(dt) { 
        if (this.gameState.isInstructions()) {
            if ( InputManager.getControlKeyDown('KeyI') || InputManager.getControlKeyDown('KeyP') ) {
                InputManager.setControlKeyDown('KeyI', false);
                InputManager.setControlKeyDown('KeyP', false);
                this.gameState.setState('gamePlay');
                paused = false;
            }
        } else if (this.gameState.isHighScores()) {
            if (InputManager.getControlKeyDown('KeyP')) {
                InputManager.setControlKeyDown('KeyP', false);
                this.gameState.setState('gamePlay');
                this.init();
                paused = false;
                shouldQuit = false;
            }
        } else {
            if (InputManager.getControlKeyDown('KeyI')) {
                paused = true;
                InputManager.setControlKeyDown('KeyI', false);
                this.gameState.setState('instructions');
            }
            if (InputManager.getControlKeyDown('KeyQ')) {
                InputManager.setControlKeyDown('KeyQ', false);
                shouldQuit = true;
                paused = true;
                this.gameState.setState('highScores');
            }
            if (InputManager.getControlKeyDown('KeyP')) {
                InputManager.setControlKeyDown('KeyP', false);
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
                    this.balls = [];
                    this.lives--;
                    if (this.lives > 0) {
                        this.spawnBall();
                    } else {
                        // game over
                        if((this.scores.length < 10) || (this.score > this.scores[this.scores.length-1].getScore())) {
                            let name = prompt('Congratulations, you set a new high score! \n Please enter your name...');
                            this.currentScore = new Score(name, this.score);
                            this.scores.push(this.currentScore);
                            this.scores.sort((a,b)=>{ return b.points - a.points });
                            if (this.scores.length > 10) this.scores.pop();
                            this.persistScores();
                        } else {
                            alert('GAME OVER! \n Why not try again?');
                        }
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

                for (const powerUp of this.powerUps) {
                    powerUp.update(dt);                    
                }

                this.checkActivePowerUps(dt);
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
            for (const powerUp of this.powerUps) {
                powerUp.draw();
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
}

//=================================================================
// SfxManager - manage playing audio sfx
//=================================================================
class SfxManager {
    static sfxAssets = {
        ballRebound:  "./assets/sounds/RetroBeeep20.wav",
        paddleStun:   "./assets/sounds/RetroElectric02.wav",
        bombDrop:     "./assets/sounds/RetroEventWrongSimple03.wav",
        brickBreak:   "./assets/sounds/RetroFootStep03.wav",
        alienDeath:   "./assets/sounds/RetroImpactMetal36.wav",
        powerUp:      "./assets/sounds/RetroWeaponReloadPlasma06.wav"
    }

    static sfxMaxVolumes = {
        ballRebound:    .6,
        paddleStun:     .6,
        bombDrop:       .6,
        brickBreak:      1,
        alienDeath:     .6,
        powerUp:        .8
    }

    static sfxVolumes = {
        ballRebound:    .6,
        paddleStun:     .6,
        bombDrop:       .6,
        brickBreak:      1,
        alienDeath:     .6,
        powerUp:        .8
    }

    static sfxSounds = {}

    static {
        for(const key of Object.keys(this.sfxAssets)) {
            this.sfxSounds[key] = new Audio(this.sfxAssets[key]);
            this.sfxSounds[key].volume = this.sfxVolumes[key];
        }
    }

    static play(target) {
        this.sfxSounds[target].currentTime = 0;
        this.sfxSounds[target].play();
    }

    static stop(target) {
        this.sfxSounds[target].pause();
        this.sfxSounds[target].currentTime = 0;
    }

    static pause(target) {
        this.sfxSounds[target].pause();
    }

    static resume(target) {
        this.sfxSounds[target].play();
    }

    static volumeUp() {
        for (const key of Object.keys(this.sfxSounds)) {
            this.sfxVolumes[key] = this.sfxVolumes[key] + .1 <= this.sfxMaxVolumes[key] ? this.sfxVolumes[key] + .1 : this.sfxMaxVolumes[key];
            this.sfxSounds[key].volume = this.sfxVolumes[key];
        }
    }

    static volumeDown() {
        for (const key of Object.keys(this.sfxSounds)) {
            this.sfxVolumes[key] = this.sfxVolumes[key] - .1 >= 0 ? this.sfxVolumes[key] - .1 : 0;
            this.sfxSounds[key].volume = this.sfxVolumes[key];
        }
    }
}

//=================================================================
// InputManager - manage playing audio sfx
//=================================================================
class InputManager {
    static controlKeys = {
        ArrowRight: false,
        ArrowLeft:  false,
        Space:      false,
        KeyP:       false,
        KeyI:       false,
        KeyQ:       false
    };

    static mouseState = {
        buttons: { left: false, middle: false, right: false },
        dragging: false,
        dragStart: { x: 0, y: 0 },
        dragLeft: false,
        dragRight: false,
        dragAmt: 0
    };

    static getControlKeys() { return InputManager.controlKeys; }
    static getControlKeyDown(key) { return InputManager.controlKeys[key]; }
    static setControlKeyDown(key, value) { InputManager.controlKeys[key] = value; }

    static getDragLeft() { return InputManager.mouseState.dragLeft; }
    static getDragRight() { return InputManager.mouseState.dragRight; }
    static getDragAmt() { return InputManager.mouseState.dragAmt; }

    static clearControlKeys() {
        for (const key of Object.keys(InputManager.controlKeys)) {
            this.controlKeys[key] = false;
        }
    }

    static keyDownEvent(e) {   
        if (e.code === 'ArrowUp')   SfxManager.volumeUp();
        if (e.code === 'ArrowDown') SfxManager.volumeDown();

        if(!Object.keys(this.controlKeys).includes(e.code))
            return;
        this.controlKeys[e.code] = true;
    }
        
    static keyUpEvent(e) {
        if(!Object.keys(this.controlKeys).includes(e.code))
            return;
        this.controlKeys[e.code] = false;
    }

    static mousedownEvent(e) {
        // console.log('mousedown ', e);
        switch (e.which) {
            case 1:
                this.mouseState.buttons.left = true;
                break;
            case 2:
                this.mouseState.buttons.middle = true;
                break;
            case 3:
                this.mouseState.buttons.right = true;
                break;
        }
    }

    static mousemoveEvent(e) {
        // console.log('mousemove ', e);
        if (!this.mouseState.dragging) {
            if ( this.mouseState.buttons.left || this.mouseState.buttons.middle || this.mouseState.buttons.right) {
                this.mouseState.dragging = true;
                this.mouseState.dragStart.x = e.clientX;
                this.mouseState.dragStart.y = e.clientY;
            }
        } else {
            if ( e.clientX < this.mouseState.dragStart.x - 10 ) { //register dragging left
                this.mouseState.dragLeft = true;
                this.mouseState.dragRight = false;
                this.mouseState.dragAmt = (e.clientX - this.mouseState.dragStart.x) / 100;
                if ( this.mouseState.dragAmt < -.5 ) 
                    this.mouseState.dragAmt = -.5;
            } else if (e.clientX > this.mouseState.dragStart.x + 10 ) { //register dragging right
                this.mouseState.dragLeft = false;
                this.mouseState.dragRight = true;
                this.mouseState.dragAmt = (e.clientX - this.mouseState.dragStart.x) / 100;
                if ( this.mouseState.dragAmt > .5 ) 
                    this.mouseState.dragAmt = .5;
            } else {    // hold steady
                this.mouseState.dragLeft = false;
                this.mouseState.dragRight = false;
                this.mouseState.dragAmt = 0;
            }
        }

    }

    static mouseupEvent(e) {
        // console.log('mouseup ', e);
        switch (e.which){
            case 1:
                this.mouseState.buttons.left = false;
                break;
            case 2:
                this.mouseState.buttons.middle = false;
                this.controlKeys['KeyP'] = !this.controlKeys['KeyP']; //  pause/resume game
                break;
            case 3:
                this.mouseState.buttons.right = false;
                break;
        }
        if ( !this.mouseState.buttons.left && !this.mouseState.buttons.middle && !this.mouseState.buttons.right) {
            this.mouseState.dragging = false;
            this.mouseState.dragLeft = false;
            this.mouseState.dragRight = false;
            this.mouseState.dragAmt = 0;
        }
    }
}

const testAudio = (step) => {

}

//-----------------------------------------------------------------
//  Global Variables
//-----------------------------------------------------------------
const vp = {}
let shouldQuit = false;
let paused = false;
const game = new Game();

//-----------------------------------------------------------------
//event listeners
//-----------------------------------------------------------------
const domBody = document.querySelector('body');
const domVP = document.querySelector('#viewport');
domBody.addEventListener('keydown', (e) => { InputManager.keyDownEvent(e); });
domBody.addEventListener('keyup', (e) => { InputManager.keyUpEvent(e); });
domBody.addEventListener('mouseup', (e) => {    // in case user stops dragging outside of the canvas
                            let evt = new MouseEvent("mouseup", { bubbles: false, cancelable: true, view: window });
                            domVP.dispatchEvent(evt);
                        });
domVP.addEventListener('mousedown', (e) => { InputManager.mousedownEvent(e); });
domVP.addEventListener('mousemove', (e) => { InputManager.mousemoveEvent(e); });
domVP.addEventListener('mouseup', (e) => { InputManager.mouseupEvent(e); });


//-----------------------------------------------------------------
//start game
//-----------------------------------------------------------------
game.init();
game.loop();
//=================================================================
//
//=================================================================