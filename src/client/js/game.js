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

const below_world = 2400;
const start_pos = {
    x: 115,
    x_offset: 235,
    y: 1260
}

const moveSpd = 5;
const jumpSpd = [-3, -8, -14, -18, -12];



var localActorId;
actors = {}

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

    this.matter.world.convertTilemapLayer(backgroundLayer);
    this.matter.world.convertTilemapLayer(foregroundLayer);

    this.matter.world.createDebugGraphic();

    let self = this;

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
            console.log(players[id]);

            if (players[id].playerId === self.socket.id) {
                console.log('add local player');

                addLocalPlayer(self, players[id]);
            } else {
                addRemotePlayer(self, players[id]);
            }
        });
    });

    this.socket.on('newPlayer', function (playerInfo) {
        console.log(playerInfo);

        addRemotePlayer(self, playerInfo);
    });

    this.socket.on('playerMoved', function (moveData) {
        if (actors[moveData.playerId]) {

            actors[moveData.playerId].setPosition(moveData.px, moveData.py);
            actors[moveData.playerId].setVelocity(moveData.vx, moveData.vy);

            if (moveData.vx <= -moveSpd)
                actors[moveData.playerId].setFlipX(true)
            else if (moveData.vx >= moveSpd)
                actors[moveData.playerId].setFlipX(false)
        }
    });

    this.socket.on('resetPlayer', function (moveData) {
        if (actors[moveData.playerId]) {
            if (moveData.py >= below_world) {
                ResetPosition(actors[moveData.playerId]);
                return;
            }
        }
    })

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

    this.socket.on('prep', () => {
        console.log("prep");

        for (const key in actors) {
            ResetPosition(actors[key]);
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
    console.log("\n\nAdd Local Player:\n\n");
    actors[playerInfo.playerId] = self.matter.add.image(Math.floor(playerInfo.order * start_pos.x_offset) + start_pos.x, start_pos.y, 'player').setOrigin(0.5, 0.5).setDisplaySize(64, 64);
    actors[playerInfo.playerId].setCircle(32);
    actors[playerInfo.playerId].setFixedRotation();

    actors[playerInfo.playerId].order = playerInfo.order;

    self.cameras.main.startFollow(actors[playerInfo.playerId], lerpX = 0.5, lerpY = 0.5);

    actors[playerInfo.playerId].jumpTick = 0;
    actors[playerInfo.playerId].ground = [];

    actors[playerInfo.playerId].body.label = playerInfo.playerId;

    actors[playerInfo.playerId].setOnCollide(OnEnterCollision);
    actors[playerInfo.playerId].setOnCollideEnd(OnExitCollision);

    localActorId = actors[playerInfo.playerId].body.id;
    self.player = actors[playerInfo.playerId];

    //console.log("actor " + playerInfo.playerId + "start pos: " + playerInfo.x + ", " + playerInfo.y);

    //for (var property in self.player) {
    //    var value = self.player[property];
    //    console.log(property, value);
    //}
    //console.log("\n\n");
}

function addRemotePlayer(self, playerInfo) {
    console.log("\n\nAdd remote player\n\n");
    const otherPlayer = self.matter.add.image(Math.floor(playerInfo.order * start_pos.x_offset) + start_pos.x, start_pos.y, 'newPlayer').setDisplaySize(64, 64);
    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.setCircle(32);
    otherPlayer.setFixedRotation();
    self.matter.world.add(otherPlayer);

    otherPlayer.order = playerInfo.order;

    otherPlayer.jumpTick = 0;
    otherPlayer.ground = [];

    otherPlayer.body.label = playerInfo.playerId;

    otherPlayer.setOnCollide(OnEnterCollision);
    otherPlayer.setOnCollideEnd(OnExitCollision);

    actors[playerInfo.playerId] = otherPlayer;

    //console.log("actor " + playerInfo.playerId + "start pos: " + playerInfo.x + ", " + playerInfo.y);
    //for (var property in self.player) {
    //    var value = self.player[property];
    //    console.log(property, value);
    //}
    //console.log("\n\n");
}

function update() {
    if (this.player) {
        if (this.player.ground.length > 0)
            groundUpdate(this);
        else if (this.player.ground.length == 0)
            airUpdate(this);
    }
}

function groundUpdate(self) {
    let moveData = {
        px: self.player.x,
        py: self.player.y,
        vx: self.player.body.velocity.x,
        vy: self.player.body.velocity.y
    };

    if (self.cursors.left.isDown) {
        this.move(self, self.socket.id, -moveSpd);
        moveData.vx = -moveSpd;
    }

    if (self.cursors.right.isDown) {
        this.move(self, self.socket.id, moveSpd);
        moveData.vx = moveSpd;
    }

    if (self.cursors.space.isDown) {
        this.jump(self, self.socket.id, jumpSpd[jumpTick = 0]);
        moveData.vy = jumpSpd[jumpTick];
    }

    self.socket.emit('playerMovement', moveData);
}

function airUpdate(self) {
    let moveData = {
        px: self.player.x,
        py: self.player.y,
        vx: self.player.body.velocity.x,
        vy: self.player.body.velocity.y
    };

    if (self.cursors.left.isDown) {
        this.move(self, self.socket.id, -moveSpd);
        moveData.vx = -moveSpd;
    }

    if (self.cursors.right.isDown) {
        this.move(self, self.socket.id, moveSpd);
        moveData.vx = moveSpd;  
    }

    if (self.cursors.space.isDown && jumpTick < jumpSpd.length) {
        this.jump(self, self.socket.id, jumpSpd[jumpTick]);
        moveData.vy = jumpSpd[jumpTick++];
    }
    else if (self.cursors.space.isUp) {
        jumpTick = jumpSpd.length;
    }

    self.socket.emit('playerMovement', moveData);
}

function move(self, playerId, spd) {

    if (spd <= -moveSpd)
        actors[playerId].setFlipX(true);
    else if (spd >= moveSpd)
        actors[playerId].setFlipX(false);

    actors[playerId].setVelocityX(spd);
}

function jump(self, playerId, spd) {
    actors[playerId].setVelocityY(spd);
}

function OnEnterCollision(collisionData)
{
    //console.log("enter collision");
    //for(var property in collisionData)
    //{
    //    var value = collisionData[property];
    //    console.log(property, value);
    //}

    if (collisionData.bodyA.label && actors[collisionData.bodyA.label]) {
        if (collisionData.collision.normal.y < 0) {
            collisionData.bodyA.parent.gameObject.ground.push(collisionData.bodyB.id);
            collisionData.bodyA.friction = 1;
        }
    }

    if (collisionData.bodyB.label && actors[collisionData.bodyB.label]) {
        if (collisionData.collision.normal.y > 0) {
            collisionData.bodyB.parent.gameObject.ground.push(collisionData.bodyA.id);
            collisionData.bodyB.friction = 1;
        }
    }
}

function OnExitCollision(collisionData) {
    if (collisionData.bodyA.label && actors[collisionData.bodyA.label]) {
        if (actors[collisionData.bodyA.label].ground.length == 0)
            return;

        actors[collisionData.bodyA.label].ground = actors[collisionData.bodyA.label].ground.filter(function (value, index, arr) { return value != collisionData.bodyB.id; });

        if (actors[collisionData.bodyA.label].ground.length == 0)
            actors[collisionData.bodyA.label].friction = 0;
    }

    if (collisionData.bodyB.label && actors[collisionData.bodyB.label]) {
        if (actors[collisionData.bodyB.label].ground.length == 0)
            return;

        actors[collisionData.bodyB.label].ground = actors[collisionData.bodyB.label].ground.filter(function (value, index, arr) { return value != collisionData.bodyA.id; });

        if (actors[collisionData.bodyB.label].ground.length == 0)
            actors[collisionData.bodyB.label].friction = 0;
    }
}

function ResetPosition(_actor) {
    _actor.setPosition(Math.floor(_actor.order * start_pos.x_offset) + start_pos.x, start_pos.y);
    _actor.setVelocity(0, 0);
}