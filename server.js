var express = require('express');
var app = express();
var server = require('http').Server(app);
const { Server } = require("socket.io");
const io = new Server(server);

const { createNewPlayer, reconnectPlayer } = require('./utils/player');
const { bombs } = require('./utils/board')

const START = "START", WAITING = 'WAITING', END = 'END';
const RED = "RED", GREEN = 'GREEN'
var players = {};
var dcPlayers = {}
var status = WAITING;
var light = RED;
var interval;
var GAME_ID = Math.random()

app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

var countdown;

// admin
app.use('/admin/*', function(req, resp, next){
  const auth = req.headers['authorization']
  if(auth !== '$qG1225') {
    resp.sendStatus(401)
  }
  next()
})
app.get('/admin/start', function(req, res) {
  if(status != START) {
    countdown = 180
    status = START;
    light = GREEN
    io.emit('statusChanged', status)
    interval = setInterval(() => {
      if(countdown > 0) {
        countdown--;
        io.emit('timer', countdown);
      } else if(countdown == 0){
        clearInterval(interval)
        io.emit('timeout')
      }
    },1000)

    
  } 
  res.send('started')
})

app.get('/admin/toggleLight', function(req, res) {
  if(status === START) {
    light = light === RED ? GREEN : RED
    io.emit('lightChanged', light)
    res.send('lightChanged')
  } else {
    res.send('game not yet started')
  }
})

app.get('/gameStatus', function(req,res) {
  res.send(status)
})

server.listen(3000, function () {
  console.log(`Listening on ${server.address().port}. Game id: ${GAME_ID}`);
});


// SOCKET
io.on('connection', function (socket) {
  console.log('a user connected');

  socket.on('register', function ({number, gameId}) {
    console.log(number, gameId)
    if(number && dcPlayers[number] && gameId == GAME_ID) {
      console.log('reconnectPlayer')
      // reconnect player
      reconnectPlayer(players, dcPlayers, number, socket, status, light, GAME_ID)
    } else {
      console.log('createNewPlayer')
      createNewPlayer(players, socket, status, light, GAME_ID);
    }
  })


  socket.on('disconnect', function () {
    console.log('user disconnected');
    const playerNum = players[socket.id].number
    dcPlayers[playerNum] = players[socket.id]
    delete players[socket.id];
    io.emit('dc', socket.id);
  });

  socket.on('playerMovement', function (movementData) {
    players[socket.id].x = movementData.x;
    players[socket.id].y = movementData.y;
    players[socket.id].boardX = movementData.boardX;
    players[socket.id].boardY = movementData.boardY;
    // emit a message to all players about the player that moved
    const moveStr = `${movementData.boardX},${movementData.boardY}`
    console.log(players[socket.id].number, moveStr)
    if(status === START) {
      if(bombs.includes(moveStr)) {
        console.log('die');
        players[socket.id].die = true
        players[socket.id].reason = 'bomb'
        io.to(socket.id).emit('youAreDead', 'bomb')
      } else if (light === RED) {
        console.log('die');
        players[socket.id].die = true
        players[socket.id].reason = 'red'
        io.to(socket.id).emit('youAreDead', 'red')
      }

      if(players[socket.id].die) {
        console.log(`Number ${players[socket.id].number} is dead.`)
      }
    }


    if(movementData.boardY === 0) {
      console.log('win')
      players[socket.id].win = true
    }
    socket.broadcast.emit('playerMoved', players[socket.id]);

    if(players[socket.id].win) {
      status = END
      io.emit('statusChanged', END)
      io.emit('winner', socket.id)
      clearInterval(interval)
    }
  });

  socket.on('changeStatus', function(stat) {
    status = stat;
    if(status === START) {
      light = GREEN
    }
    socket.broadcast.emit('statusChanged', status)
  })
});

