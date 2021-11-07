let boardConfig = {
  cellSize: 32,
  horizontal: 20,
  vertical: 20,
  xPos: (32 * 20) / 2,
  yPos: (32 * 20) / 2,
  xOffset: 80,
  yOffset: 60,
  bombs: [],
  waitingYLimit: 17
}
let redLight, greenLight, rlglSound, mineSound, question
let move = ''
let yLimit = boardConfig.waitingYLimit
let playerId, roomId
const bombViewed = []

var GameScene = new Phaser.Class({
  Extends: Phaser.Scene,
  initialize: function ChooseScene() {
    Phaser.Scene.call(this, { key: 'gameScene' })
  },

  preload: function() {
    const localData = getLocalData()
    playerId = localData.playerId
    roomId = localData.roomId

    fetch(`/room/${roomId}`)
    .then(resp => resp.json())
    .then(data => {
      this.roomObj = data
      if (data && data.owner === playerId && data.status === STARTED) {
        yLimit = -1
      }
    })

    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x222222, 0.8)
    progressBox.fillRect(240, 270, 320, 50)

    const width = this.cameras.main.width
    const height = this.cameras.main.heigh
    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 -50,
      text: 'Loading...',
      style: {
        font: '20px',
        fill: '#ffffff'
      }
    })

    loadingText.setOrigin(.5, .5)

    this.load.on('progress', (value) => {
      progressBar.clear()
      progressBar.fillStyle(0xffffff, 1)
      progressBar.fillRect(250, 280, 300 * value, 30)
    })

    // this.load.on('fileprogress', (file) => {
    //   console.log(file.src)
    // })

    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
    })

    this.load.image('board', '/assets/board.png');
    this.load.image('player', '/assets/player.png');
    this.load.image('red-light', '/assets/red-light.png');
    this.load.image('green-light', '/assets/green-light.png');
    this.load.image('explosion', '/assets/explosion.png');
    this.load.image('eks', '/assets/eks.png');
    this.load.image('g', '/assets/g.png');

    this.load.image('eye', '/assets/eye.png');
    this.load.image('question', '/assets/question.png'); 
    this.load.image('warning', '/assets/warning.png');

    this.load.audio('rlgl', '/assets/rlgl.mp3')
    this.load.audio('mine', '/assets/mine.mp3')
    this.load.audio('laser', '/assets/laser.mp3')
  },

  create: function () {
    this.socket = io();
    this.otherPlayers = this.add.group()
    const self = this

    this.add.image(boardConfig.xPos + boardConfig.xOffset, boardConfig.yPos + boardConfig.yOffset, 'board');
    greenLight = this.add.image(40, 80, 'green-light')
    redLight = this.add.image(40, 120, 'red-light')
    

    this.timerText = this.add.text(20, 35, '3:00', { fontSize: '22px', color: '#ffffff', stroke: '#000000', strokeThickness: 2})
    
    this.addGuideImages()
    this.addSound()
    this.addSocketEvents()
    this.addStartButton()
    this.cursors = this.input.keyboard.createCursorKeys();

  },

  update: function() {
    if(this.me && !this.me.die && this.roomObj.status !== END) {
      if(this.me.boardY > yLimit && this.cursors.up.isDown) {
        move = 'up'
      } else if(this.me.boardY < 19 && this.cursors.down.isDown) {
        move = 'down'
      } else if(this.me.boardX > 0 && this.cursors.left.isDown) {
        move = 'left'
      } else if(this.me.boardX < 19 && this.cursors.right.isDown) {
        move = 'right'
      }

      // do movement
      if(move === 'up' && this.cursors.up.isUp) {
        move = ''
        this.me.y -= boardConfig.cellSize
        this.me.boardY -=1
      } else if(move === 'down' && this.cursors.down.isUp) {
        move = ''
        this.me.y +=boardConfig.cellSize
        this.me.boardY +=1;
      } else if(move === 'left' && this.cursors.left.isUp) {
        move = ''
        this.me.x -=boardConfig.cellSize
        this.me.boardX -=1;
      } else if(move === 'right' && this.cursors.right.isUp) {
        move = ''
        this.me.x +=boardConfig.cellSize
        this.me.boardX +=1;
      }

      const { boardX, boardY } = this.me
      const moveStr = `${boardX},${boardY}`

      if (this.me.oldPosition && (boardX !== this.me.oldPosition.boardX || boardY !== this.me.oldPosition.boardY)) {
        this.socket.emit('playerMovement', { boardX, boardY, roomId, playerId })
      }

      // console.log('move', moveStr)
      // TODO: triangle & square ability
      if (this.me.shape === TRIANGLE) {
        var top = `${this.me.boardX},${this.me.boardY-1}`
        var left = `${this.me.boardX-1},${this.me.boardY}`
        var right = `${this.me.boardX+1},${this.me.boardY}`
        if(this.roomObj.bombs.includes(top) || this.roomObj.bombs.includes(left) || this.roomObj.bombs.includes(right)) {
          question.setAlpha(1)
        } else {
          question.setAlpha(0)
        }
      } else if(this.me.shape === SQUARE) {
        var bX = this.me.boardX
        var bY = this.me.boardY
        var topLeft = `${bX-1},${bY-1}`
        this.displayBomb(topLeft, this.me.x, this.me.y, -32, -32)
        var topRight = `${bX+1},${bY-1}`
        this.displayBomb(topRight, this.me.x, this.me.y, 32, -32)
      }

      this.me.oldPosition = { boardX, boardY, roomId }
    }
  },

  addGuideImages: function() {
    // TOP
    this.add.image(250, 25, 'eye').setAlpha(.3)
    this.add.image(390, 25, 'question').setAlpha(.3)
    this.add.image(540, 25, 'warning').setAlpha(.3)
    // LEFT
    this.add.image(40, 200, 'eye').setAlpha(.3)
    this.add.image(40, 400, 'question').setAlpha(.3)
    this.add.image(40, 600, 'warning').setAlpha(.3)

    this.add.image(760, 200, 'eye').setAlpha(.3)
    this.add.image(760, 400, 'question').setAlpha(.3)
    this.add.image(760, 600, 'warning').setAlpha(.3)
  },

  addSound: function () {
    rlglSound = this.sound.add('rlgl')
    rlglSound.setVolume(.02)
    mineSound = this.sound.add('mine')
    laserSound = this.sound.add('laser')
    laserSound.setRate(2)
  }, 

  addSocketEvents: function () {
    const { playerId, roomId } = getLocalData()
    this.socket.on('connect', () => {
      this.socket.emit('register', { playerId, roomId })
    })

    this.socket.on('currentPlayers', (players) => {
      console.log('currentPlayers', players)
      players.forEach(player => {
        if(player.playerId === playerId) { // me
          this.addPlayer(player)
        } else {
          this.addOtherPlayers(player)
        }
      });
    })

    this.socket.on('newPlayer', (playerInfo) => {
      this.addOtherPlayers(playerInfo)
    })

    this.socket.on('playerMoved', playerInfo => {
      const { boardX:otherX, boardY: otherY } = playerInfo
      const { x, y } = this.getGameAxis(otherX, otherY)
      if(this.me.shape === CIRCLE) {
        var top = `${otherX},${otherY-1}`
        var bot = `${otherX},${otherY+1}`
        var left = `${otherX-1},${otherY}`
        var right = `${otherX+1},${otherY}`

        if(this.roomObj.bombs.includes(top)) {
          this.displayBomb(top, x, y, 0, -32)
        }
        if(this.roomObj.bombs.includes(bot)) {
          this.displayBomb(bot, x, y, 0, 32)
        }
        if(this.roomObj.bombs.includes(left)) {
          this.displayBomb(left, x, y, -32, 0)
        }
        if(this.roomObj.bombs.includes(right)) {
          this.displayBomb(right, x, y, 32, 0)
        }
      }

      this.otherPlayers.getChildren().forEach(otherPlayer => {
        if(playerInfo.playerId === otherPlayer.playerId) {
          otherPlayer.boardX = otherX
          otherPlayer.boardY = otherY

          // TODO: die
          if(playerInfo.die) {
            addEks(otherPlayer)

            if(playerInfo.reason === RED) {
              laser(x, y)
            } else if(playerInfo.reason === 'BOMB') {
              const explode = this.add.image(x, y, 'explosion')
              explode.setScale(.7, .7)
              mineSound.play()
              setTimeout(() => {
                explode.destroy()
                mineSound.stop()
              }, 2000)
            }
          }

          otherPlayer.setPosition(x, y)
        }

      })
    })

    this.socket.on('timer', countdown => this.timerText.setText(this.secsToMins(countdown)))
    
    this.socket.on('statusChanged', (status) => {
      if(status === STARTED) {
        yLimit = -1
      } else if(status === END) {
        this.roomObj.status = END
        this.socket.off('timer')
      }
    })

    this.socket.on('lightChanged', (lightColor) => {
      this.light = lightColor
      this.toggleLight(lightColor)
    })

    this.socket.on('youAreDead', reason => {
      if (reason === RED) {
        this.laser()
      } else if(reason === 'BOMB') {
        this.bomb()
      }
      this.die()
    })

    this.socket.on('winner', (winnerId) => {
      rlglSound.stop()
      if(winnerId === this.me.playerId) {
        const winMessage = this.add.text(400, 300, `You Win!`, { fontSize: '80px', color: '#ff0000', stroke: '#ffec00', strokeThickness: 2})
        winMessage.setOrigin(.5, .5)
      } else {
        this.laser()
        this.die()
        this.displayWinner(winnerId)
      }

      this.otherPlayers.getChildren().forEach(otherPlayer => {
        if(winnerId !== otherPlayer.playerId) {
          const { x, y } = this.getGameAxis(otherPlayer.boardX, otherPlayer.boardY)
          this.laser(x, y)
          this.addEks(otherPlayer)
        }
      })
    })
  },

  addPlayer: function (playerInfo) {
    const { boardX, boardY, number, playerId, shape, die } = playerInfo
    const { x, y } = this.getGameAxis(boardX, boardY)
    this.me = this.add.container(x, y);
    const player = this.add.image(0, 0, 'player')
    const num = this.add.text(0, 0, number)
    player.setTint(0x00ff45)

    this.me.boardX = boardX
    this.me.boardY = boardY
    this.me.playerId = playerId
    this.me.number = number
    this.me.shape = shape
    this.me.die = die

    question = this.add.text(0,-20,'???', {color: '#ff0000'})
    question.setAlpha(0)

    num.setOrigin(0.5, 0.5)
    this.me.add(player)
    this.me.add(num)
    this.me.add(question)
    this.me.setDepth(1000)
  },

  addOtherPlayers: function(playerInfo) {
    const { boardX, boardY, number, playerId, shape } = playerInfo
    const { x, y } = this.getGameAxis(boardX, boardY)
    const otherPlayer = this.add.container(x, y)

    const player = this.add.image(0, 0, 'player')
    const num = this.add.text(0, 0, number)
    num.setOrigin(.5, .5)
    
    otherPlayer.add(player)
    otherPlayer.add(num)
    otherPlayer.playerId = playerId

    otherPlayer.boardX = boardX
    otherPlayer.boardY = boardY
    otherPlayer.number = number

    this.otherPlayers.add(otherPlayer)
  },

  addStartButton: function() {
    const self = this
    fetch(`/room/${roomId}`)
      .then(resp => resp.json())
      .then(data => {
        if (data && data.owner === playerId && data.status === WAITING) {
          const g = this.add.image(760, 665, 'g').setInteractive()
          g.on('pointerdown', function () {
            this.setTint(0xff0000)
          })
          g.on('pointerout', function () {
            this.clearTint()
          })
          g.on('pointerup', function () {
            this.clearTint()
            self.socket.emit('startGame', { roomId, playerId })
            g.destroy()
          })
        }
      })
  },

  getGameAxis: function (x, y) {
    const { xOffset, yOffset, cellSize} = boardConfig
    let xAxis = xOffset + (x * cellSize) + (cellSize/2)
    let yAxis = yOffset + (y * cellSize) + (cellSize/2)

    return { x: xAxis, y: yAxis }
  },

  toggleLight: function (lightColor) {
    if(lightColor === GREEN) {
      this.blinkLight(greenLight, 'green-light')
      redLight.setAlpha(.6)
      greenLight.setAlpha(1)
      rlglSound.play()
    } else if (lightColor === RED){
      this.blinkLight(redLight, 'red-light')
      redLight.setAlpha(1)
      greenLight.setAlpha(.6)
      rlglSound.stop()
    }
  },

  blinkLight(light, lightName) {
    let graphics = this.add.graphics({
      x: light.x - light.width / 2,
      y: light.y - light.height / 2
    })
    .fillStyle(0xffff00, 0.75)
    .generateTexture(lightName)
    .fillCircle(light.width / 2, light.width / 2, 20)
  
    this.tweens.add({
      targets: graphics,
      alpha: 0,
      ease: 'Cubic.easeOut',  
      duration: 200,
      repeat: 3,
      yoyo: false
    })
  },

  secsToMins: function (countdown) {
    const min = Math.floor(countdown / 60)
    const sec = countdown % 60
    const secsDisplay = sec < 10 ? `0${sec}` : sec
    return `${min}:${secsDisplay}`
  },

  laser: function (x, y) {
    const toX = x || this.me.x
    const toY = y || this.me.y
    const graphics = this.add.graphics();
  
    graphics.lineStyle(5, 0xff0000)
  
    graphics.beginPath()
    graphics.moveTo(400, 30)
    graphics.lineTo(toX, toY)
  
    graphics.closePath();
    graphics.strokePath();
    laserSound.play()
  
    setTimeout(() => {
      graphics.destroy()
      laserSound.stop()
    }, 3000)
  },

  die: function () {
    this.me.die = true
    const eks = this.add.image(0,0, 'eks')
    eks.setScale(.7, .7)
    eks.setAlpha(.3)
    this.me.add(eks)

    const deadText = this.add.text(400, 300, `You're Dead!`, { fontSize: '80px', color: '#ff0000', stroke: '#ffec00', strokeThickness: 2})
    deadText.setOrigin(.5, .5)
  },

  bomb: function () {
    const explode = this.add.image(this.me.x, this.me.y, 'explosion')
    explode.setScale(.7, .7)
    mineSound.play()
    setTimeout(() => mineSound.stop(), 3000)
  },

  displayBomb: function (coordString, x, y, xAdd, yAdd) {
    const timeout = this.me.shape === CIRCLE ? 6000 : 3000
    if(this.roomObj.bombs.includes(coordString) && !bombViewed.includes(coordString)) {
      var exclamation = this.add.text(x+xAdd, y+yAdd, '!', {color: "#ff0000", fontSize: '20px'})
      exclamation.setOrigin(.5,.5)
      bombViewed.push(coordString)
      setTimeout(()=> {
        exclamation.destroy()
      }, timeout)
    }
  },

  displayWinner: function (winnerId) {
    const player = this.otherPlayers.getChildren().find(otherPlayer => otherPlayer.playerId === winnerId)
    const playerWin = this.add.text(400, 400, `#${player.number} wins!`, { fontSize: '70px', color: '#ff0000', stroke: '#ffec00', strokeThickness: 2})
    playerWin.setOrigin(.5, .5)
  },

  addEks: function (playerObj) {
    const eks = this.add.image(0, 0, 'eks')
    eks.setScale(.7,.7)
    eks.setAlpha(.3)
    playerObj.add(eks)
  }
})
