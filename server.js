var express = require('express');
var app = express();
var server = require('http').Server(app);
const { Server } = require("socket.io");
const io = new Server(server);
const winston = require('winston');

const {
  createRoom,
  getRoom, 
  getPlayerByRoom, 
  patchPlayerByRoom, 
  initializePlayer, 
  patchRoom 
} = require('./service/redis');
const { WAITING, STARTED, END, RoomTimer } = require('./utils/room');
const { createNewPlayer, reconnectPlayer } = require('./utils/player');
const { LightToggler, RED } = require('./utils/board');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

app.use(express.json())
app.use(express.static(__dirname + '/public'));

app.get('/game/:roomId',async function (req, res) {
  const { roomId } = req.params
  const { game } = req.query
  const roomObj = await getRoom(roomId)
  console.log(game)
  if(!game) {
    if(!roomObj) {
      return res.redirect(`/?game=notFound`)
    } else if(roomObj.status === END && !game) {
      return res.redirect(`/?game=end`)
    }
  }

  if(roomObj.status === WAITING || roomObj.status === STARTED) {
    return res.sendFile(__dirname + '/src/game.html');
  }
});

app.get('/player/:playerId/room/:roomId', async function (req, res) {
  const { playerId, roomId } = req.params
  let data = await getPlayerByRoom(playerId, roomId)
  if(!data) {
    data = {}
  }
  res.send(data)
})

app.patch('/player/:playerId/room/:roomId', async function (req, res) {
  const { playerId, roomId } = req.params
  logger.info('patch player', req.params)
  const updatedData = await patchPlayerByRoom(playerId, roomId, req.body)
  if (!updatedData) {
    return res.sendStatus(404)
  }
  res.send(updatedData)
})

app.post('/player/:playerId/room/:roomId', async function (req, res) {
  const { playerId, roomId } = req.params
  const player = await initializePlayer(playerId, roomId)

  res.send(player)
})

app.get('/room/:roomId', async function(req, res) {
  const { roomId } = req.params
  const roomObj = await getRoom(roomId)
  if(!roomObj) return res.sendStatus(404)

  res.send(JSON.stringify(roomObj))
})

app.post('/room', async function (req, res) {
  logger.info('creating a room', req.body)
  const { sessionId } = req.body
  const room = await createRoom(sessionId)
  let data = {
    roomId: room
  };
  res.send(JSON.stringify(data))
})

server.listen(3000, function () {
  logger.info(`Listening on ${server.address().port}.`);
});

// SOCKET
io.on('connection', socket => {
  logger.info('a user is connected')

  socket.on('register', async ({ playerId, roomId }) => {
    logger.info('Registering player', { playerId, roomId })
    const player = await getPlayerByRoom(playerId, roomId)

    if(!player) return

    if(player.number > 0) {
      logger.info('Reconnecting player', playerId)
      await reconnectPlayer(io, socket, playerId, roomId)
      await socket.join(roomId)
    } else {
      logger.info('Creating new player', playerId)
      await createNewPlayer(io, socket, playerId, roomId)
      await socket.join(roomId)
    }
  })

  socket.on('playerMovement', async movement => {
    // update player movement
    const { boardX, boardY, roomId, playerId } = movement
    const playerInfo = await patchPlayerByRoom(playerId, roomId, { boardX, boardY })
    const room = await getRoom(roomId)
    const moveStr = `${boardX},${boardY}`

    if(room.status === STARTED) {
      if(room.light === RED) {
        logger.info('a player died from red light:', playerInfo.number)
        playerInfo.die = true
        playerInfo.reason = RED
        await patchPlayerByRoom(playerId, roomId, { die: true, reason: RED })
        io.to(socket.id).emit('youAreDead', RED)
      } else if(room.bombs.includes(moveStr)) {
        const BOMB = 'BOMB'
        playerInfo.die = true
        playerInfo.reason = BOMB
        logger.info('a player died from stepping land mine:', playerInfo.number)
        await patchPlayerByRoom(playerId, roomId, { die: true, reason: BOMB })
        io.to(socket.id).emit('youAreDead', BOMB)
      }
    }

    if (boardY < 0) {
      await patchPlayerByRoom(playerId, roomId, { win: true })
      await patchRoom(roomId, { status: END })
      io.to(roomId).emit('statusChanged', END)
      io.emit('winner', playerId)
    }

    socket.to(roomId).emit('playerMoved', playerInfo)
  })

  socket.on('startGame', async ({ roomId, playerId}) => {
    await patchRoom(roomId, { status: STARTED })
    io.to(roomId).emit('statusChanged', STARTED)
    new RoomTimer(io, roomId)
    new LightToggler(io, roomId)
  })
});