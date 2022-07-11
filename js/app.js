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
// Ball - 2d filled circle
//================================================================
class Ball extends Entity {
    pos = {x:0, y:0};
    rad = 0;
    color = '#ddd';
    vel = {x:0, y:0}

    constructor(rad = 0, posX = 0, posY = 0, velX = 0, velY = 0, color = '#ddd') {
        super();
        this.rad = rad;
        this.pos.x = posX;
        this.pos.y = posY;
        this.vel.x = velX;
        this.vel.y = velY;
        this.color = color;
    }

    draw() {
        console.log('here')
        vp.ctx.fillStyle = this.color;
        vp.ctx.beginPath();
        vp.ctx.arc(this.pos.x, this.pos.y, this.rad, 0, Math.PI*2, true);
        vp.ctx.fill();


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

    init: function() {
        vp.canvas = document.querySelector('#viewport');
        vp.ctx = vp.canvas.getContext('2d');

        shouldQuit = false;
        paused = false;

        this.entities.push(new Ball(10,50,50))
        
    },

    update: function() {            
        for (const ent of game.entities) {
            ent.update()
        }
    },
    
    draw: function() {
        vp.ctx.fillStyle = '#000';
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
    }
}


game.init();

game.loop();
