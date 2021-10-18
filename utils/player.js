const { bombs } = require('./board')

var boardConfig = {
  size: 32,
  horizontal: 20,
  vertical: 20,
  xPos: (32 * 20) / 2,
  yPos: (32 * 20) / 2,
  xOffset: 80,
  yOffset: 50
}

const startingPoint = {
  x: boardConfig.xOffset + 16,
  y: (32 * 20) + (50 - 16)
}

const createNewPlayer = (players, socket, status, light) => {
  var number;
  var keys = Object.keys(players);
  var count = keys.length

  if(count == 0) {
    number = 1
  } else {
    number = players[keys[count - 1]].number + 1
  }

  players[socket.id] = {
    playerId: socket.id,
    number,
    x: startingPoint.x,
    y: startingPoint.y,
    boardX: 0,
    boardY: 20,
    bombs,
    gameStatus: status,
    gameLight: light
  }

  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);
}

const reconnectPlayer = function(players, dcPlayers, number, socket, status, light) {
  var retrievedData = dcPlayers[number]

  players[socket.id] = retrievedData
  players[socket.id].playerId = socket.id
  players[socket.id].gameStatus = status
  players[socket.id].gameLight = light

  // send the players object to the new player
  socket.emit('currentPlayers', players);
  // update all other players of the new player
  socket.broadcast.emit('newPlayer', players[socket.id]);

}

module.exports = {
  createNewPlayer,
  reconnectPlayer
}