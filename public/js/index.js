var scenes = []
if(localStorage.getItem('playerNumber')) {
  scenes = [GameScene]
} else {
  scenes = [ChooseScene, GameScene]
}

var config = {
  type: Phaser.AUTO,
  parent: 'phaser-rlgl',
  width: 800,
  height: 700,
  backgroundColor: '#4488AA',
  scene: scenes
};

var game = new Phaser.Game(config);