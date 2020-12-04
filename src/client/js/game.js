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
const jumpSpd = [-3, -8, -14, -18, -12];
const below_world = 2400;

const player_size = {
    x: 66,
    y: 92
}


const start_pos = {
    x: 115,
    x_offset: 235,
    y: 1260
}

var localActorId;
actors = {}

function preload() {
    //#region Player 1 sprites
    this.load.image('p0_idle', 'assets/BasePack/Player/p1_stand.png');
    this.load.image('p0_duck', 'assets/BasePack/Player/p1_duck.png');
    this.load.image('p0_jump', 'assets/BasePack/Player/p1_jump.png');

    this.load.image('p0_walk1', 'assets/BasePack/Player/p1_walk/PNG/p1_walk01.png');
    this.load.image('p0_walk2', 'assets/BasePack/Player/p1_walk/PNG/p1_walk02.png');
    this.load.image('p0_walk3', 'assets/BasePack/Player/p1_walk/PNG/p1_walk03.png');
    this.load.image('p0_walk4', 'assets/BasePack/Player/p1_walk/PNG/p1_walk04.png');
    this.load.image('p0_walk5', 'assets/BasePack/Player/p1_walk/PNG/p1_walk05.png');
    this.load.image('p0_walk6', 'assets/BasePack/Player/p1_walk/PNG/p1_walk06.png');
    this.load.image('p0_walk7', 'assets/BasePack/Player/p1_walk/PNG/p1_walk07.png');
    this.load.image('p0_walk8', 'assets/BasePack/Player/p1_walk/PNG/p1_walk08.png');
    this.load.image('p0_walk9', 'assets/BasePack/Player/p1_walk/PNG/p1_walk09.png');
    this.load.image('p0_walk10', 'assets/BasePack/Player/p1_walk/PNG/p1_walk10.png');
    this.load.image('p0_walk11', 'assets/BasePack/Player/p1_walk/PNG/p1_walk11.png');

    //#endregion

    //#region Player 2 sprites
    this.load.image('p1_idle', 'assets/BasePack/Player/p2_stand.png');
    this.load.image('p1_duck', 'assets/BasePack/Player/p2_duck.png');
    this.load.image('p1_jump', 'assets/BasePack/Player/p2_jump.png');

    this.load.image('p1_walk1', 'assets/BasePack/Player/p2_walk/PNG/p2_walk01.png');
    this.load.image('p1_walk2', 'assets/BasePack/Player/p2_walk/PNG/p2_walk02.png');
    this.load.image('p1_walk3', 'assets/BasePack/Player/p2_walk/PNG/p2_walk03.png');
    this.load.image('p1_walk4', 'assets/BasePack/Player/p2_walk/PNG/p2_walk04.png');
    this.load.image('p1_walk5', 'assets/BasePack/Player/p2_walk/PNG/p2_walk05.png');
    this.load.image('p1_walk6', 'assets/BasePack/Player/p2_walk/PNG/p2_walk06.png');
    this.load.image('p1_walk7', 'assets/BasePack/Player/p2_walk/PNG/p2_walk07.png');
    this.load.image('p1_walk8', 'assets/BasePack/Player/p2_walk/PNG/p2_walk08.png');
    this.load.image('p1_walk9', 'assets/BasePack/Player/p2_walk/PNG/p2_walk09.png');
    this.load.image('p1_walk10', 'assets/BasePack/Player/p2_walk/PNG/p2_walk10.png');
    this.load.image('p1_walk11', 'assets/BasePack/Player/p2_walk/PNG/p2_walk11.png');
    //#endregion

    //#region Player 3 sprites
    this.load.image('p2_idle', 'assets/BasePack/Player/p2_stand.png');
    this.load.image('p2_duck', 'assets/BasePack/Player/p2_duck.png');
    this.load.image('p2_jump', 'assets/BasePack/Player/p2_jump.png');

    this.load.image('p2_walk1', 'assets/BasePack/Player/p3_walk/PNG/p3_walk01.png');
    this.load.image('p2_walk2', 'assets/BasePack/Player/p3_walk/PNG/p3_walk02.png');
    this.load.image('p2_walk3', 'assets/BasePack/Player/p3_walk/PNG/p3_walk03.png');
    this.load.image('p2_walk4', 'assets/BasePack/Player/p3_walk/PNG/p3_walk04.png');
    this.load.image('p2_walk5', 'assets/BasePack/Player/p3_walk/PNG/p3_walk05.png');
    this.load.image('p2_walk6', 'assets/BasePack/Player/p3_walk/PNG/p3_walk06.png');
    this.load.image('p2_walk7', 'assets/BasePack/Player/p3_walk/PNG/p3_walk07.png');
    this.load.image('p2_walk8', 'assets/BasePack/Player/p3_walk/PNG/p3_walk08.png');
    this.load.image('p2_walk9', 'assets/BasePack/Player/p3_walk/PNG/p3_walk09.png');
    this.load.image('p2_walk10', 'assets/BasePack/Player/p3_walk/PNG/p3_walk10.png');
    this.load.image('p2_walk11', 'assets/BasePack/Player/p3_walk/PNG/p3_walk11.png');
    //#endregion

    //#region Load Map
    this.load.tilemapTiledJSON('map', 'assets/test_map3.json')
    this.load.image('tiles', 'assets/tileset.png');
    //#endregion
}

function create() {
    this.socket = io();
    this.cursors = this.input.keyboard.createCursorKeys();

    //#region Create Map
    const map = this.make.tilemap({ key: 'map' });
    const terrain = map.addTilesetImage('tileset', 'tiles', 70, 70, 0, 0);

    let backgroundLayer = map.createStaticLayer('Background', terrain, 0, 0);
    let foregroundLayer = map.createStaticLayer('Foreground', terrain, 0, 0);
    foregroundLayer.setCollisionByProperty({ Collides: true });

    this.matter.world.convertTilemapLayer(backgroundLayer);
    this.matter.world.convertTilemapLayer(foregroundLayer);

    //DEBUG
    this.matter.world.createDebugGraphic();

    this.cameras.main.setBackgroundColor('rgb(0, 200, 255)');
    //#endregion

    //#region Create Anims

        //#region p0
    this.anims.create({
        key: 'p0_idle',
        frames: [
            {
                key: 'p0_idle',
                frame: 0,
                duration: 0,
                visible: true
            }
        ],
        skipMissedFrames: true,
        defaultTextureKey: null,
        startFrame: 0,

        // time
        delay: 0,
        frameRate: null,
        duration: null,
        timeScale: 1,

        // repeat
        repeat: 0, 
        repeatDelay: 0,
        yoyo: false,

        // visible
        showOnStart: false,
        hideOnComplete: false
    });

        //#endregion

        //#region p1

        //#endregion

        //#region p2

        //#endregion

    //#endregion

    let self = this;

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

            if (moveData.vx < 0)
                actors[moveData.playerId].setFlipX(true)
            else if (moveData.vx > 0)
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
    console.log("Add local player");
    actors[playerInfo.playerId] = self.matter.add.image(Math.floor(playerInfo.order * start_pos.x_offset) + start_pos.x, start_pos.y, 'p0_idle').setOrigin(0.5, 0.5).setDisplaySize(player_size.x, player_size.y);
    actors[playerInfo.playerId].setCircle(player_size.x, player_size.y);
    actors[playerInfo.playerId].setFixedRotation();

    actors[playerInfo.playerId].order = playerInfo.order;

    self.cameras.main.startFollow(actors[playerInfo.playerId], lerpX = 0.5, lerpY = 0.5);

    actors[playerInfo.playerId].jumpTick = 0;
    actors[playerInfo.playerId].ground = [];
    actors[playerInfo.playerId].wall = [];
    actors[playerInfo.playerId].wallNormal = 0;
    actors[playerInfo.playerId].wallJump = false;
    actors[playerInfo.playerId].jumped = false;

    actors[playerInfo.playerId].body.label = playerInfo.playerId;

    actors[playerInfo.playerId].setOnCollide(OnEnterCollision);
    actors[playerInfo.playerId].setOnCollideEnd(OnExitCollision);

    localActorId = actors[playerInfo.playerId].body.id;
    self.player = actors[playerInfo.playerId];

    //console.log("actor " + playerInfo.playerId + "start pos: " + playerInfo.x + ", " + playerInfo.y);

    for (var property in self.player) {
        var value = self.player[property];
        console.log(property, value);
    }
}

function addRemotePlayer(self, playerInfo) {
    console.log("Add remote player");
    const otherPlayer = self.matter.add.image(Math.floor(playerInfo.order * start_pos.x_offset) + start_pos.x, start_pos.y, 'p2_idle').setDisplaySize(player_size.x, player_size.y);
    otherPlayer.playerId = playerInfo.playerId;
    otherPlayer.setCircle(player_size.x, player_size.y);
    otherPlayer.setFixedRotation();
    self.matter.world.add(otherPlayer);

    otherPlayer.order = playerInfo.order;

    otherPlayer.jumpTick = 0;
    otherPlayer.ground = [];
    otherPlayer.wall = [];
    otherPlayer.wallNormal = 0;
    otherPlayer.wallJump = false;
    otherPlayer.jumpHeld = false;

    otherPlayer.body.label = playerInfo.playerId;

    otherPlayer.setOnCollide(OnEnterCollision);
    otherPlayer.setOnCollideEnd(OnExitCollision);

    actors[playerInfo.playerId] = otherPlayer;

    //console.log("actor " + playerInfo.playerId + "start pos: " + playerInfo.x + ", " + playerInfo.y);
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
        this.move(self, self.socket.id, -5);
        moveData.vx = -5;
    }

    if (self.cursors.right.isDown) {
        this.move(self, self.socket.id, 5);
        moveData.vx = 5;
    }

    if (self.cursors.space.isDown && self.player.jumpHeld == false) {
        self.player.jumpHeld = true;
        //Jump_OnEnter(self, self.socket.id);

        this.jump(self, self.socket.id, jumpSpd[self.player.jumpTick = 0]);
        moveData.vy = jumpSpd[self.player.jumpTick++];
    }
    else if (self.cursors.space.isUp)
        self.player.jumpHeld = false;

    self.socket.emit('playerMovement', moveData);
}

function airUpdate(self) {
    let moveData = {
        px: self.player.x,
        py: self.player.y,
        vx: self.player.body.velocity.x,
        vy: self.player.body.velocity.y
    };

    if (self.cursors.left.isDown && self.player.wallJump == false) {
        this.move(self, self.socket.id, -5);
        moveData.vx = -5;
    }

    if (self.cursors.right.isDown && self.player.wallJump == false) {
        this.move(self, self.socket.id, 5);
        moveData.vx = 5;  
    }

    if (self.cursors.space.isDown) {
        if (self.player.wallJump == false && self.player.wall.length > 0 && self.player.jumpHeld == false) {
            console.log("wall jump");

            self.player.wall.length = 0;
            self.player.wallJump = true;
            self.player.jumpTick = 0;
            self.player.setVelocityY(0);

            moveData.vx = self.player.wallNormal * 5;
            moveData.vy = jumpSpd[self.player.jumpTick];

            this.move(self, self.socket.id, moveData.vx);
            this.jump(self, self.socket.id, jumpSpd[self.player.jumpTick++]);
            self.player.jumpHeld = true;
        }
        else if (self.player.jumpTick < jumpSpd.length) {
            console.log("continue jump");
            moveData.vy = jumpSpd[self.player.jumpTick];
            this.jump(self, self.socket.id, jumpSpd[self.player.jumpTick++]);
        }
    }
    else if (self.player.jumpTick == jumpSpd.length)
    {
        console.log("jump expired");

        self.player.jumpTick = jumpSpd.length + 1;
        self.player.wallJump = false;

        if (self.cursors.space.isUp)
            self.player.jumpHeld = false;
    }
    else if (self.cursors.space.isUp) {
        console.log("space up");
        self.player.jumpTick = jumpSpd.length + 1;
        self.player.wallJump = false;
        self.player.jumpHeld = false;
    }

    self.socket.emit('playerMovement', moveData);
}

function move(self, playerId, spd) {
    actors[playerId].setVelocityX(spd);

    if (spd < -Number.EPSILON)
        actors[playerId].setFlipX(true)
    else if (spd > Number.EPSILON)
        actors[playerId].setFlipX(false)
}

function jump(self, playerId, spd) {
    actors[playerId].setVelocityY(spd);
}

function ResetPosition(_actor) {
    _actor.setPosition(Math.floor(_actor.order * start_pos.x_offset) + start_pos.x, start_pos.y);
    _actor.setVelocity(0, 0);
}

// #region Player

// #region Collision Callbacks
function OnEnterCollision(collisionData) {
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
        else if (collisionData.collision.normal.y == 0) {
            console.log("touching wall " + collisionData.bodyB.label);
            collisionData.bodyA.parent.gameObject.wall.push(collisionData.bodyB.id);
            collisionData.bodyA.parent.gameObject.wallNormal = -collisionData.collision.normal.x;
        }
    }
    else if (collisionData.bodyB.label && actors[collisionData.bodyB.label]) {
        if (collisionData.collision.normal.y > 0) {
            collisionData.bodyB.parent.gameObject.ground.push(collisionData.bodyA.id);
            collisionData.bodyB.friction = 1;
        }
        else if (collisionData.collision.normal.y == 0) {
            console.log("touching wall " + collisionData.bodyA.label);
            collisionData.bodyB.parent.gameObject.wall.push(collisionData.bodyA.id);
            collisionData.bodyB.parent.gameObject.wallNormal = -collisionData.collision.normal.x;
        }
    }
}

function OnExitCollision(collisionData) {
    if (collisionData.bodyA.label && actors[collisionData.bodyA.label]) {
        actors[collisionData.bodyA.label].ground = actors[collisionData.bodyA.label].ground.filter(function (value, index, arr) { return value != collisionData.bodyB.id; });
        actors[collisionData.bodyA.label].wall = actors[collisionData.bodyA.label].wall.filter(function (value, index, arr) { return value != collisionData.bodyB.id; });

        if (actors[collisionData.bodyA.label].ground.length == 0)
            actors[collisionData.bodyA.label].friction = 0;
    }
    else if (collisionData.bodyB.label && actors[collisionData.bodyB.label]) {
        actors[collisionData.bodyB.label].ground = actors[collisionData.bodyB.label].ground.filter(function (value, index, arr) { return value != collisionData.bodyA.id; });
        actors[collisionData.bodyB.label].wall = actors[collisionData.bodyB.label].wall.filter(function (value, index, arr) { return value != collisionData.bodyA.id; });

        if (actors[collisionData.bodyB.label].ground.length == 0)
            actors[collisionData.bodyB.label].friction = 0;
    }
}

// #endregion

function ChangeSprite(key, socketId) {
    console.log("Change sprite " + key);

    actors[socketId].setTexture(key);
    actors[socketId].setDisplaySize(player_size.x, player_size.y);
    actors[socketId].setCircle(player_size.x, player_size.y);
    actors[socketId].setFixedRotation();

    //actors[socketId].setOnCollide(OnEnterCollision);
    //actors[socketId].setOnCollideEnd(OnExitCollision);
}

// #region Player SM

    // #region Movement SM

const PlayerMovement = {
    IDLE: {
        ENTER: "ie",
        WHILE: "iw",
        EXIT: "ix",
    },
    MOVE: {
        ENTER: "me",
        WHILE: "mw",
        EXIT: "mx"
    },
    JUMP: {
        ENTER: "je",
        WHILE: "jw",
        EXIT: "jx"
    },
    FALL: {
        ENTER: "fe",
        WHILE: "fw",
        EXIT: "fx"
    }
}

// #region Idle
function Idle_OnEnter(self, socketId) {
    ChangeSprite('p' + actors[socketId].order + '_idle', socketId);
}

function Idle_While(self, socketId) {

}

function Idle_OnExit(self, socketId) {

}
    // #endregion

    // #region Move
function Move_OnEnter(self, socketId) {

}

function Move_While(self, socketId) {

}

function Move_OnExit(self, socketId) {

}
    // #endregion

    // #region Jump
function Jump_OnEnter(self, socketId) {
    //actors[socketId].setTexture('p' + actors[socketId].order + "_jump");
    //actors[socketId].setDisplaySize(player_size.x, player_size.y);
    //otherPlayer.setFixedRotation();
    ChangeSprite('p' + actors[socketId].order + '_jump', socketId);
}

function Jump_While(self, socketId) {

}

function Jump_OnExit(self, socketId) {

}
    // #endregion

    // #region Fall
function Fall_OnEnter(self, socketId) {

}

function Fall_While(self, socketId) {

}

function Fall_OnExit(self, socketId) {

}
    // #endregion

    // #endregion

    //#region Grounded SM
const PlayerGrounded = {
    GROUNDED: {
        ENTER: "ge",
        WHILE: "gw",
        EXIT: "gx"
    },
    UNGROUNDED: {
        ENTER: "ue",
        WHILE: "uw",
        EXIT: "ux"
    }
}

    // #region Grounded
function Grounded_OnEnter(socketId) {
    //actors[socketId].setTexture('p' + actors[socketId].order + "_duck");
    //actors[socketId].setDisplaySize(player_size.x, player_size.y);
}

function Grounded_While(socketId) {

}

function Grounded_OnExit(socketId) {

}
    // #endregion

    // #region Ungrounded
function Ungrounded_OnEnter(socketId) {
    
}

function Ungrounded_While(socketId) {

}

function Ungrounded_OnExit(socketId) {

}
    // #endregion

    // #endregion

    // #endregion

// #endregion