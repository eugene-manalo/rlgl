const { getRoom, patchPlayerByRoom, updateRoom, getPlayersByRoom, getPlayerByRoom } = require('../service/redis')

const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'player.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

const createNewPlayer = async (io, socket, playerId, roomId) => {
  // assign game number
  const room = await getRoom(roomId)
  const players = room.players
  let number
  if(!players) {
    number = 1
    room.players = [{ playerId, number }]
  } else {
    number = players[players.length - 1].number + 1
    room.players.push({ playerId, number })
  }

  logger.info(`Assigning number "${number}" to player:${playerId}`)
  const player = await patchPlayerByRoom(playerId, roomId, { number })
  await updateRoom(roomId, room);
  
  const playersInfo = await getPlayersByRoom(roomId)
  socket.emit('currentPlayers', playersInfo)
  io.to(roomId).emit('newPlayer', player)
}

const reconnectPlayer = async (io, socket, playerId, roomId) => {
  const playerInfo = await getPlayerByRoom(playerId, roomId)
  const playersInfo = await getPlayersByRoom(roomId)

  socket.emit('currentPlayers', playersInfo)
  io.to(roomId).emit('newPlayer', playerInfo)
}

module.exports = {
  createNewPlayer,
  reconnectPlayer,
}