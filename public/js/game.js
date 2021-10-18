var move = ""
var redLight, greenLight;
var light = ''
var deadList = [];
var deadText;
var question

var boardConfig = {
  size: 32,
  horizontal: 20,
  vertical: 20,
  xPos: (32 * 20) / 2,
  yPos: (32 * 20) / 2,
  xOffset: 80,
  yOffset: 50,
  bombs: [],
  status: START,
  waitingYLimit: 18
}

var yLimit = boardConfig.waitingYLimit

var startingPoint = {
  x: boardConfig.xOffset + 16,
  y: (32 * 20) + (50 - 16)
}

var timerText;
var bombViewed = []

function preload() {
  this.load.image('board', 'assets/board.png');
  this.load.image('player', 'assets/player.png');
  this.load.image('red-light', 'assets/red-light.png');
  this.load.image('green-light', 'assets/green-light.png');
  this.load.image('explosion', 'assets/explosion.png');
  this.load.image('eks', 'assets/eks.png');
}

function create() {
  this.socket = io();
  this.otherPlayers = this.add.group()
  var self = this;

  this.add.image(boardConfig.xPos + boardConfig.xOffset, boardConfig.yPos + boardConfig.yOffset, 'board');
  greenLight = this.add.image(40, 80, 'green-light');
  redLight = this.add.image(40, 140, 'red-light');

  redLight.setAlpha(.6);
  redLight.setScale(1.5)

  greenLight.setAlpha(.6);
  greenLight.setScale(1.5)

  timerText = self.add.text(15, 20, '3:00', { fontSize: '22px', color: '#ffffff', stroke: '#000000', strokeThickness: 2})

  this.socket.on('connect', () => {
    var playerNumber = localStorage.getItem('playerNumber')
    this.socket.emit('register', playerNumber)
  })

  this.socket.on('currentPlayers', function (players) {
    Object.keys(players).forEach(function (id) {
      if (players[id].playerId === self.socket.id) {
        const playerInfo = players[id]
        addPlayer(self, playerInfo);
      } else {
        addOtherPlayers(self, players[id]);
      }
    });
  });

  this.socket.on('newPlayer', function (playerInfo) {
    addOtherPlayers(self, playerInfo);
  });

  this.socket.on('dc', function (playerId) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerId === otherPlayer.playerId) {
        otherPlayer.destroy();
      }
    });
  });

  this.socket.on('playerMoved', function (playerInfo) {
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if (playerInfo.playerId === otherPlayer.playerId) {
        var otherX = playerInfo.x
        var otherY = playerInfo.y

        if(playerInfo.die && !deadList.includes(playerInfo.playerId)) {
          deadList.push(playerInfo.playerId)
          otherX = 30;
          otherY = deadList.length * 35 + 170
          var eks = self.add.image(0, 0, 'eks')
          eks.setScale(.7,.7)
          eks.setAlpha(.3)
          otherPlayer.add(eks)

          if(playerInfo.reason == 'red') {
            laser(self, playerInfo.x, playerInfo.y)
          } else if(playerInfo.reason == 'bomb' && self.me.shape === CIRCLE) {
            var explode = self.add.image(playerInfo.x, playerInfo.y, 'explosion')
            explode.setScale(.5, .5)
            setTimeout(() => {
              explode.destroy()
            }, 3000)
          }
        }
        otherPlayer.setPosition(otherX, otherY);
      }
    });
  });

  this.socket.on('statusChanged', function(stat) {
    console.log('statusChanged:' + stat)
    if(stat === START) {
      boardConfig.status = stat
      yLimit = 0,
      light = GREEN
      toggleLight(self, GREEN)
    } else {
      console.log(stat)
    }

  })

  this.socket.on('lightChanged', function(lightStat) {
    light = lightStat
    console.log(lightStat)
    toggleLight(self);
  })

  this.socket.on('youAreDead', function(reason) {
    if(reason == 'red') {
      laser(self, self.me.x, self.me.y)
    }
    die(self)
  })

  this.socket.on('timer', function(countdown) {
    timerText.setText(secsToMins(countdown))
  })

  this.socket.on('timeout', function() {
    die(self)
    self.add.text(80, 18, 'Timeout!', { fontSize: '22px', color: '#ff0000', stroke: '#ffec00', strokeThickness: 2})
    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      var eks = self.add.image(0, 0, 'eks')
      eks.setScale(.7,.7)
      eks.setAlpha(.3)
      otherPlayer.add(eks)
    })
  })

  // fake start
  // boardConfig.status = START
  // yLimit = 0,
  // light = GREEN

  this.socket.on('winner', function(winnerId) {
    console.log(`winnerid: ${winnerId}`)
    console.log(`self.me.playerId: ${self.me.playerId}`)
    if(winnerId != self.me.playerId) {
      die(self)
    } else {
      const winMessage = self.add.text(400, 300, `You Win!`, { fontSize: '80px', color: '#ff0000', stroke: '#ffec00', strokeThickness: 2})
      winMessage.setOrigin(.5, .5)
    }

    self.otherPlayers.getChildren().forEach(function (otherPlayer) {
      if(otherPlayer.playerId != winnerId) {
        var eks = self.add.image(0, 0, 'eks')
        eks.setScale(.7,.7)
        eks.setAlpha(.3)
        otherPlayer.add(eks)
      }
    })
  })
  this.cursors = this.input.keyboard.createCursorKeys();
}

function update() {
  // var self = this
  if(this.me && !this.me.die) {
    // trigger movement
    if(this.me.boardY > yLimit && this.cursors.up.isDown) {
      move = "up"
    } else if(this.me.boardY < 20 && this.cursors.down.isDown) {
      move = "down"
    } else if(this.me.boardX > 0 && this.cursors.left.isDown) {
      move = "left"
    } else if(this.me.boardX < 19 && this.cursors.right.isDown) {
      move = "right"
    }

    // do movement
    if(move == "up" && this.cursors.up.isUp) {
      move=""
      this.me.y -=32
      this.me.boardY -=1;
    } else if(move == "down" && this.cursors.down.isUp) {
      move = ""

      this.me.y +=32
      this.me.boardY +=1;
    } else if(move == "left" && this.cursors.left.isUp) {
      move = ""
      this.me.x -=32
      this.me.boardX -=1;
    } else if(move == "right" && this.cursors.right.isUp) {
      move = ""
      this.me.x +=32
      this.me.boardX +=1;
    }

    var moveStr = `${this.me.boardX},${this.me.boardY}`

    if(boardConfig.bombs.includes(moveStr)) {
      console.log('die')
      var explode = this.add.image(this.me.x, this.me.y, 'explosion')
      explode.setScale(.5, .5)
    }
    // emit player movement
    var x = this.me.x;
    var y = this.me.y;
    if (this.me.oldPosition && (x !== this.me.oldPosition.x || y !== this.me.oldPosition.y)) {
      this.socket.emit('playerMovement', { x: this.me.x, y: this.me.y, boardX: this.me.boardX, boardY: this.me.boardY });
    }

    if(this.me.shape === TRIANGLE) {
      var top = `${this.me.boardX},${this.me.boardY-1}`
      var left = `${this.me.boardX-1},${this.me.boardY}`
      var right = `${this.me.boardX+1},${this.me.boardY}`
      if(boardConfig.bombs.includes(top) || boardConfig.bombs.includes(left) || boardConfig.bombs.includes(right)) {
        question.setAlpha(1)
      } else {
        question.setAlpha(0)
      }
    } else if(this.me.shape === SQUARE) {
      var bX = this.me.boardX
      var bY = this.me.boardY
      var topLeft = `${bX-1},${bY-1}`
      displayBomb(this, topLeft, x, y, -32, -32)
      var topRight = `${bX+1},${bY-1}`
      displayBomb(this, topRight, x, y, 32, -32)
  
      // var topRight = `${this.me.boardX+1},${this.me.boardY-1}`
      // if(boardConfig.bombs.includes(topRight) && !bombViewed.includes(topRight)) {
      //   var exclamation = this.add.text(x+32, y-32, '!', {color: "#ff0000", fontSize: '20px'})
      //   exclamation.setOrigin(.5,.5)
      //   bombViewed.push(topRight)
      //   exclamation.destroy()
      //   // setTimeout(()=> {
      //   //   console.log('destroy excl')
      //   //   exclamation.destroy()
      //   // }, 1)
      // }
    }

    // save old position data
    this.me.oldPosition = {
      x: this.me.x,
      y: this.me.y,
      boardX: this.me.boardX,
      boardY: this.me.boardY
    };
  }
}

function displayBomb(self, coordString, x, y, xAdd, yAdd) {
  if(boardConfig.bombs.includes(coordString) && !bombViewed.includes(coordString)) {
    var exclamation = self.add.text(x+xAdd, y+yAdd, '!', {color: "#ff0000", fontSize: '20px'})
    exclamation.setOrigin(.5,.5)
    bombViewed.push(coordString)
    setTimeout(()=> {
      console.log('destroy excl')
      exclamation.destroy()
    }, 10)
  }
}

function addPlayer(self, playerInfo) {
  console.log('addPlayer')
  self.me = self.add.container(playerInfo.x, playerInfo.y);
  var player = self.add.image(0, 0, 'player');
  var num = self.add.text(0, 0, playerInfo.number);
  self.me.boardX = playerInfo.boardX;
  self.me.boardY = playerInfo.boardY;

  self.me.playerId = playerInfo.playerId
  self.me.number = playerInfo.number

  self.me.shape = playerShape
  console.log('self.me.shape', self.me.shape)
  localStorage.setItem('playerNumber', playerInfo.number)

  question = self.add.text(0,-20,'???', {color: "#ff0000"})
  question.setAlpha(0)
  num.setOrigin(0.5, 0.5);
  self.me.add(player);
  self.me.add(num);
  self.me.add(question)
  self.me.setDepth(1000);
  


  // board status
  boardConfig.bombs = playerInfo.bombs;
  boardConfig.status = playerInfo.gameStatus
  light = playerInfo.gameLight
  if(boardConfig.status === START) {
    yLimit = 0
    toggleLight(self, light)
  }
}

function addOtherPlayers(self, playerInfo) {
  console.log('addOtherPlayers')
  const otherPlayer = self.add.container(playerInfo.x, playerInfo.y);

  var player = self.add.image(0, 0, 'player');
  var num = self.add.text(0, 0, playerInfo.number);
  num.setOrigin(0.5, 0.5);
  otherPlayer.add(player)
  otherPlayer.add(num)
  otherPlayer.playerId = playerInfo.playerId;

  otherPlayer.playerId.boardX = playerInfo.boardX;
  otherPlayer.playerId.boardY = playerInfo.boardY;

  self.otherPlayers.add(otherPlayer);
}

function toggleLight(self, forceLight) {
  console.log(self)
  if(light === GREEN || forceLight === GREEN) {
    blinkLight(self, greenLight, 'green-light')
    redLight.setAlpha(.6)
    greenLight.setAlpha(1)
  } else if(light === RED || forceLight === RED) {
    blinkLight(self, redLight, 'red-light')
    redLight.setAlpha(1)
    greenLight.setAlpha(.6)
  }
}

function blinkLight(self,light, lightName) {
  let graphics = self.add.graphics({
    x: light.x - light.width / 2,
    y: light.y - light.height / 2
  })
  .fillStyle(0xffff00, 0.75)
  .generateTexture(lightName)
  .fillCircle(light.width / 2, light.width / 2, 20)

  self.tweens.add({
    targets: graphics,
    alpha: 0,
    ease: 'Cubic.easeOut',  
    duration: 200,
    repeat: 3,
    yoyo: false
  })
}

function die(self) {
  self.me.die = true
  self.me.x = 30
  deadList.push(self.me.playerId)
  var eks = self.add.image(0, 0, 'eks')
  eks.setScale(.7,.7)
  eks.setAlpha(.3)
  self.me.add(eks)
  self.me.y = deadList.length * 35 + 170
  deadText = self.add.text(400, 300, `You're Dead!`, { fontSize: '80px', color: '#ff0000', stroke: '#ffec00', strokeThickness: 2})
  deadText.setOrigin(.5, .5)
}

function secsToMins(countdown) {
  const min = Math.floor(countdown / 60)
  const sec = countdown % 60
  const secsDisplay = sec < 10 ? `0${sec}` : sec
  return `${min}:${secsDisplay}`
}

function laser(self, x, y) {
  var graphics = self.add.graphics();

  graphics.lineStyle(5, 0xff0000)

  graphics.beginPath()
  graphics.moveTo(400, 30)
  graphics.lineTo(x,y)

  graphics.closePath();
  graphics.strokePath();

  setTimeout(() => {
    graphics.destroy()
  }, 1500)
}

var GameScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function GameScene() {
    Phaser.Scene.call(this, { key: 'gameScene' })
  },
  preload: preload,
  create: create,
  update: update
})