/** @type {import("phaser")} */
/** @type {import("matter")} */

let config = {
    type: Phaser.AUTO,
    parent: 'Tower-Climber',
    width: 800,
    height: 600,
    physics: {
        default: 'matter',
        matter: {
            debug: true,
            gravity: { y: 1 }
        }
    },
    render: {
        roundPixels: true
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

let game = new Phaser.Game(config);
const groundedFriction = 1;
const wallSlideFriction = 0.2;
const airFriction = 0;
var ground = [];
var localActorId;

var jumpSpd = [ -20, -15];
var jumpTickMax = 6;
var jumpTick = 0;

function preload() {
    this.load.image('player', 'assets/BasePack/Player/p1_stand.png');
    this.load.image('newPlayer', 'assets/BasePack/Player/p2_stand.png');

    this.load.tilemapTiledJSON('map', 'assets/test_map3.json')
    this.load.image('tiles', 'assets/tileset.png');
}

function create() {
    this.socket = io();
    this.cursors = this.input.keyboard.createCursorKeys();

    const map = this.make.tilemap({ key: 'map' });
    const terrain = map.addTilesetImage('tileset', 'tiles', 70, 70, 0, 0);

    let backgroundLayer = map.createStaticLayer('Background', terrain, 0, 0);
    let foregroundLayer = map.createStaticLayer('Foreground', terrain, 0, 0);
    foregroundLayer.setCollisionByProperty({ Collides: true });

    //map.setCollisionBetween(0, 6);

    this.matter.world.convertTilemapLayer(backgroundLayer);
    this.matter.world.convertTilemapLayer(foregroundLayer);
    //this.matter.world.setBounds(width = map.width, height = map.height);

    this.matter.world.createDebugGraphic();

    let self = this;
    self.actors = {}

    this.cameras.main.setBackgroundColor('rgb(0, 200, 255)');

    /*** Cheeky garbage UI ***/
    let waiting = document.createElement("span");
    waiting.setAttribute("id", "waiting");
    waiting.innerText = "Waiting for other players...";
    waiting.style.display = "block";
    document.body.appendChild(waiting);
    /*** End of cheeky garbage UI ***/

    this.socket.on('currentPlayers', function (players) {
        Object.keys(players).forEach(function (id) {
            if (players[id].playerId === self.socket.id) {
                addLocalPlayer(self, players[id]);
            } else {
                addRemotePlayer(self, players[id]);
            }
        });
    });

    this.socket.on('newPlayer', function (playerInfo) {
        addRemotePlayer(self, playerInfo);
    });

    this.socket.on('playerMoved', function (playerInfo) {
        if (playerInfo.playerId !== self.socket.id) {
            for (let i = self.matter.world.localWorld.bodies.length - 1; i >= 0; --i) {
                let tempObj = self.matter.world.localWorld.bodies[i];
                if (('playerId' in tempObj.gameObject) && (playerInfo.playerId === tempObj.gameObject.playerId)) {
                    tempObj.position.x = playerInfo.x;
                    tempObj.position.y = playerInfo.y;
                    break;
                }
            }
        } else {
            console.log("Trying to update self position.");
        }
    });

    this.socket.on('disconnectPlayer', (playerId) => {
        if (playerId !== this.socket.id) {
            for (let i = this.matter.world.localWorld.bodies.length - 1; i >= 0; --i) {
                let tempObj = this.matter.world.localWorld.bodies[i];

                if (tempObj == null)
                    continue;

                if (('playerId' in tempObj.gameObject) && (playerId === tempObj.gameObject.playerId)) {
                    this.matter.world.remove(tempObj);
                    tempObj.gameObject.active = false;
                    tempObj.gameObject.visible = false;
                    break;
                }
            }
        } else {
            console.log("Trying to disconnect self.");
        }
    });

    /**** Listeners are required but the UI is just garbage to visualize the game state client side, actual UI will be needed. ****/

    this.socket.on('readyUp', () => { // Ready state, room is full and countdown to begin game will start in <5s>.
        console.log("Setting up game...");
        document.getElementById("waiting").style.display = "none";
        let readyUp = document.createElement("span");
        readyUp.setAttribute("id", "ready-up");
        readyUp.innerText = "Setting up game...";
        readyUp.style.display = "block";
        document.body.appendChild(readyUp);
    })

    this.socket.on('currentCountdown', (count) => { // Countdown, displayed to all players, counts down the time until game start <10s>
        console.log(`Count: ${count}`);
        document.getElementById("ready-up").style.display = "none";
        let countdown = document.getElementById("countdown")
        if(countdown) {
            countdown.innerText = `Game starting in: ${count}`;
        } else {
            countdown = document.createElement("span");
            countdown.setAttribute("id", "countdown");
            countdown.innerText = `Game starting in: ${count}`;
            countdown.style.display = "block";
            document.body.appendChild(countdown);
        }
    })

    this.socket.on('startGame', () => { // Triggered at the end of the countdown, game is starting
        console.log("start");
        document.getElementById("countdown").style.display = "none";
        let start = document.createElement("span");
        start.setAttribute("id", "start");
        start.innerText = "GO!!!";
        start.style.display = "block";
        document.body.appendChild(start);
    })

    this.socket.on('gameOver', (winnerId) => { // Triggered when a player reaches the goal
        console.log(`Winner: ${winnerId}`);
        document.getElementById("start").style.display = "none";
        let gameOver = document.createElement("span");
        gameOver.setAttribute("id", "game-over");
        gameOver.innerText = `Game Over. Player ${winnerId} Wins!!`;
        gameOver.style.display = "block";
        document.body.appendChild(gameOver);
    })

    /********* End of new listeners and garbage UI *********/

    this.cursors = this.input.keyboard.createCursorKeys();
}

function addLocalPlayer(self, playerInfo) {
    console.log("Add local player");
    self.actors[playerInfo.playerId] = self.matter.add.image(playerInfo.x, playerInfo.y, 'player').setOrigin(0.5, 0.5).setDisplaySize(64, 64);
    self.actors[playerInfo.playerId].setCircle(32);
    self.actors[playerInfo.playerId].setFixedRotation();

    localActorId = self.actors[playerInfo.playerId].body.id;
    console.log(self.localActorId);

    self.actors[playerInfo.playerId].setOnCollide(OnEnterCollision);
    self.actors[playerInfo.playerId].setOnCollideEnd(OnExitCollision);

    self.cameras.main.startFollow(self.actors[playerInfo.playerId], lerpX = 0.5, lerpY = 0.5);

    self.player = self.actors[playerInfo.playerId];
    console.log(self.actors[self.localActorId]);
}

function addRemotePlayer(self, playerInfo) {
    console.log("Add remote player");
    const otherPlayer = self.matter.add.image(playerInfo.x, playerInfo.y, 'newPlayer').setDisplaySize(64, 64);
    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.setCircle(32);
    otherPlayer.setFixedRotation();
    self.matter.world.add(otherPlayer);
    self.actors[playerInfo.playerId] = otherPlayer;
}

function update() {
    if (this.player) {
        if (ground.length > 0)
            groundUpdate(this);
        else if (ground.length == 0)
            airUpdate(this);

        let xMov = this.player.x;
        let yMov = this.player.y;

        let xMovRounded = Math.round((xMov + Number.EPSILON) * 10) / 10;
        let yMovRounded = Math.round((yMov + Number.EPSILON) * 10) / 10;
        let oldXMovRounded = this.player.oldPosition ? Math.round((this.player.oldPosition.x + Number.EPSILON) * 10) / 10 : 0;
        let oldYMovRounded = this.player.oldPosition ? Math.round((this.player.oldPosition.y + Number.EPSILON) * 10) / 10 : 0;

        if (this.player.oldPosition && (xMovRounded !== oldXMovRounded || yMovRounded !== oldYMovRounded)) {
            console.log(xMovRounded + ":" + oldXMovRounded);
            this.socket.emit('playerMovement', { x: xMov, y: yMov });
        }
        this.player.oldPosition = {
            x: xMov,
            y: yMov
        };
    }
    else
        console.log("no local actor");
}

function groundUpdate(self) {
    if (self.cursors.left.isDown) {
        //console.log("left held down");
        //self.socket.emit('move', 'left');
        //self.actors[self.socket.id].applyForce(-0.5, 0);
        move(self, -5, 'left');
    }
    else if (self.cursors.right.isDown) {
        //console.log("right held down");
        //self.socket.emit('move', 'right');
        //self.actors[self.socket.id].applyForce(0.5, 0);
        move(self, 5, 'right');
    }

    if (self.cursors.space.isDown) {
        //console.log("jump held down");

        self.socket.emit('move', 'jump');
        //self.actors[self.socket.id].applyForce((0, jumpSpd[jumpTick = 0]));
        console.log("jumpSpd: " + jumpSpd[jumpTick = 0]);
        jump(self, jumpSpd[jumpTick = 0]);
    }

}

function airUpdate(self) {
    if (self.cursors.left.isDown) {
        //console.log("left held down");
        //self.socket.emit('move', 'left');
        //self.actors[self.socket.id].applyForce(-0.5, 0);
        move(self, -5, 'left');
    }
    else if (self.cursors.right.isDown) {
        //console.log("right held down");
        //self.socket.emit('move', 'right');
        //self.actors[self.socket.id].applyForce(0.5, 0);
        //self.actors[self.socket.id].setVelocityX(5);
        move(self, 5, 'right');
    }

    if (self.cursors.space.isDown && jumpTick < jumpSpd.length) {
        //console.log("jump held down");
        //self.actors[self.socket.id].applyForce((0, jumpSpd[jumpTick++]));

        console.log("jumpSpd: " + jumpSpd[jumpTick++]);
        jump(self, jumpSpd[jumpTick++]);
    }
    else if (self.cursors.space.isUp) {
        jumpTick = jumpSpd.length;
    }
    else if (jumpTick >= jumpSpd.length) {
        console.log("jumpTick > length: " + jumpTick + " > " + jumpSpd.length);
    }
}

function move(self, spd, direction) {
    self.socket.emit('move', direction);
    self.player.setVelocityX(spd);
}

function jump(self, spd) {
    self.player.setVelocityY(spd);
}

function OnEnterCollision(collisionData)
{
    //console.log("enter collision");
    //for(var property in collisionData)
    //{
    //    var value = collisionData[property];
    //    console.log(property, value);
    //}

    if (collisionData.bodyA.id == localActorId) {
        if (collisionData.collision.normal.y < 0) {
            ground.push(collisionData.bodyB.id);
            collisionData.bodyA.friction = 1;
        }
    }
    else if (collisionData.bodyB.id == localActorId) {
        if (collisionData.collision.normal.y > 0) {
            ground.push(collisionData.bodyA.id);
            collisionData.bodyB.friction = 1;
        }
    }

    console.log("enter " + ground);
}

function OnExitCollision(collisionData) {
    if (ground.length == 0)
        return;

    var playerBody;
    var groundBody;

    if (collisionData.bodyA.id == localActorId) {
        playerBody = collisionData.bodyA;
        groundBody = collisionData.bodyB;
    }
    else if (collisionData.bodyB.id == localActorId) {
        groundBody = collisionData.bodyA;
        playerBody = collisionData.bodyB;
    }

    ground = ground.filter(function (value, index, arr) { return value != groundBody.id; });

    //console.log("exit: " + ground);

    if (ground.length == 0)
        playerBody.friction = 0;
}
