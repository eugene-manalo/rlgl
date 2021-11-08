const ALIVE = 'ALIVE'
const WAITING = 'WAITING'

const newPlayerConfig = {
  playerId: 0,
  number: 0,
  boardX: 0,
  boardY: 19,
  roomId: 0,
  die: false,
  reason: '',
  win: false,
}

module.exports = {
  newPlayerConfig,
  WAITING
}