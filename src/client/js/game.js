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
const ungroundedFriction = 0.1;
const airFriction = 0;
var ground = [];
var localActorId;

function preload() {
    this.load.image('player', '../assets/BasePack/Player/p1_stand.png');
    this.load.image('newPlayer', 'assets/BasePack/Player/p2_stand.png');

    this.load.tilemapTiledJSON('map', 'assets/test_map3.json')
    this.load.image('tiles', 'assets/tileset.png');
}

function create() {
    this.socket = io();

    const map = this.make.tilemap({ key: 'map' });
    const terrain = map.addTilesetImage('tileset', 'tiles', 70, 70, 0, 0);

    let backgroundLayer = map.createStaticLayer('Background', terrain, 0, 0);
    let foregroundLayer = map.createStaticLayer('Foreground', terrain, 0, 0);
    foregroundLayer.setCollisionByProperty({ Collides: true });

    //map.setCollisionBetween(0, 6);

    this.matter.world.convertTilemapLayer(backgroundLayer);
    this.matter.world.convertTilemapLayer(foregroundLayer);
    this.matter.world.setBounds(width = map.width, height = map.height);

    this.matter.world.createDebugGraphic();

    let self = this;

    this.cameras.main.setBackgroundColor('rgb(0, 200, 255)');

    self.actors = {}

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

    this.socket.on('disconnect', function (playerId) {
        if (playerId !== self.socket.id) {
            for (let i = self.matter.world.localWorld.bodies.length - 1; i >= 0; --i) {
                let tempObj = self.matter.world.localWorld.bodies[i];
                if (('playerId' in tempObj.gameObject) && (playerId === tempObj.gameObject.playerId)) {
                    self.matter.world.remove(tempObj);
                    tempObj.gameObject.active = false;
                    tempObj.gameObject.visible = false;
                    break;
                }
            }
        } else {
            console.log("Trying to disconnect self.");
        }
    });

    this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
    if (this.player) {
        if (this.cursors.left.isDown) {
            //console.log("left held down");
            this.socket.emit('move', 'left');
            this.actors[this.socket.id].setVelocityX(-5);
        }
        else if (this.cursors.right.isDown) {
            //console.log("right held down");
            this.socket.emit('move', 'right');
            this.actors[this.socket.id].setVelocityX(5);
        }

        if (this.cursors.space.isDown && ground.length > 0) {
            //console.log("jump held down");
            this.socket.emit('move', 'jump');
            this.actors[this.socket.id].setVelocityY(-6);
        }

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
}

function addLocalPlayer(self, playerInfo) {
    self.actors[playerInfo.playerId] = self.matter.add.image(playerInfo.x, playerInfo.y, 'actor').setOrigin(0.5, 0.5).setDisplaySize(64, 64);
    self.actors[playerInfo.playerId].setCircle(32);
    self.actors[playerInfo.playerId].setFixedRotation();

    this.localActorId = self.actors[playerInfo.playerId].body.id;
    console.log(this.localActorId);

    self.actors[playerInfo.playerId].setOnCollide(OnEnterCollision);
    self.actors[playerInfo.playerId].setOnCollideEnd(OnExitCollision);

    self.cameras.main.startFollow(self.actors[playerInfo.playerId], lerpX = 0.5, lerpY = 0.5);
}

function addRemotePlayer(self, playerInfo) {
    const otherPlayer = self.matter.add.image(playerData.x, playerData.y, 'newPlayer').setDisplaySize(64, 64);
    otherPlayer.playerId = playerData.playerId;
    self.matter.world.add(otherPlayer);
    self.actors[playerInfo.playerId].setFixedRotation();
}

function OnEnterCollision(collisionData) {
    console.log("enter collision");

    //for(var property in collisionData)
    //{
    //    var value = collisionData[property];
    //    console.log(property, value);
    //}

    if (collisionData.bodyA.id == localActorId) {
        if (collisionData.collision.normal.y < 0) {
            ground.push(collisionData.bodyB.id);
        }
    }
    else if (collisionData.bodyB.id == localActorId) {
        if (collisionData.collision.normal.y > 0) {
            ground.push(collisionData.bodyA.id);
        }
    }

    console.log(ground);
}

function OnExitCollision(collisionData) {
    if (ground.length == 0)
        return;

    if (collisionData.bodyA.id == localActorId) {
        ground = ground.filter(function (value, index, arr) { return value != collisionData.bodyB.id; });
    }
    else if (collisionData.bodyB.id == localActorId) {
        ground = ground.filter(function (value, index, arr) { return value != collisionData.bodyA.id; });
    }
}