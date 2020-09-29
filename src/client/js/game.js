let config = {
  type: Phaser.AUTO,
  parent: 'Tower-Climber',
  width: 800,
  height: 600,
  physics: {
      default: 'matter',
      matter: {
          debug: true
      }
  },
  scene: {
      preload: preload,
      create: create,
      update: update
  }
};

let game = new Phaser.Game(config);

function preload() {}

function create() {
    this.socket = io();
}

function update() {}
