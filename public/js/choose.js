const GREEN = 'GREEN', RED = 'RED'
const START = "START", WAITING = 'WAITING', END = 'END';
const CIRCLE = 'CIRCLE', TRIANGLE = 'TRIANGLE', SQUARE = 'SQUARE'

let playerShape = localStorage.getItem('playerShape') || ''

var ChooseScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function ChooseScene() {
    Phaser.Scene.call(this, { key: 'chooseScene' })
  },
  preload: function() {
    console.log('preload Choose')
    this.load.image('circle', 'assets/circle.png');
    this.load.image('triangle', 'assets/triangle.png');
    this.load.image('square', 'assets/square.png');

    this.load.image('eye', 'assets/eye.png');
    this.load.image('question', 'assets/question.png'); 
    this.load.image('warning', 'assets/warning.png');
  },
  create: function() {
    var xOffset = 260
    var circle = this.add.image(0 + xOffset, 0, 'circle').setInteractive()
    var triangle = this.add.image(125 + xOffset, 0, 'triangle').setInteractive()
    var square = this.add.image(260 + xOffset, 0, 'square').setInteractive()

    this.add.image(250, 0, 'eye').setAlpha(.3)
    this.add.image(390, 0, 'question').setAlpha(.3)
    this.add.image(540, 0, 'warning').setAlpha(.3)

    this.add.image(250, 700, 'eye').setAlpha(.3)
    this.add.image(390, 700, 'question').setAlpha(.3)
    this.add.image(540, 700, 'warning').setAlpha(.3)

    this.add.image(0, 200, 'eye').setAlpha(.3)
    this.add.image(0, 400, 'question').setAlpha(.3)
    this.add.image(0, 600, 'warning').setAlpha(.3)

    this.add.image(800, 200, 'eye').setAlpha(.3)
    this.add.image(800, 400, 'question').setAlpha(.3)
    this.add.image(800, 600, 'warning').setAlpha(.3)


    this.add.text(400, 200, `Pick one`, { fontSize: '80px', color: '#000000', stroke: '#ffff', strokeThickness: 2}).setOrigin(.5, .5)

    var group = this.add.group()
    group.add(circle)
    group.add(triangle)
    group.add(square)

    group.setY(350)

    var shapeSelected = ""

    // events
    var self = this
    circle.on('pointerdown', function (pointer) {
      this.setTint(0xff0000);
      if(shapeSelected == "") {
        shapeSelected = CIRCLE
      }
    });
    circle.on('pointerout', function (pointer) {
      this.clearTint();
      shapeSelected = ""
    });
    circle.on('pointerup', function (pointer) {
      this.clearTint();
      if(shapeSelected === CIRCLE) {
        playerShape = CIRCLE
        localStorage.setItem('playerShape',CIRCLE)
        self.scene.start('gameScene')
      }
    });

    triangle.on('pointerdown', function (pointer) {
      this.setTint(0xff0000);
      if(shapeSelected == "") {
        shapeSelected = TRIANGLE
      }
    });
    triangle.on('pointerout', function (pointer) {
      this.clearTint();
      shapeSelected = ""
    });
    triangle.on('pointerup', function (pointer) {
      this.clearTint();
      if(shapeSelected === TRIANGLE) {
        playerShape = TRIANGLE
        localStorage.setItem('playerShape',TRIANGLE)
        self.scene.start('gameScene')
      }
    });

    square.on('pointerdown', function (pointer) {
      this.setTint(0xff0000);
      if(shapeSelected == "") {
        shapeSelected = SQUARE
      }
    });
    square.on('pointerout', function (pointer) {
      this.clearTint();
      shapeSelected = ""
    });
    square.on('pointerup', function (pointer) {
      this.clearTint();
      if(shapeSelected === SQUARE) {
        playerShape = SQUARE
        localStorage.setItem('playerShape',SQUARE)
        self.scene.start('gameScene')
      }
    });
  }
})