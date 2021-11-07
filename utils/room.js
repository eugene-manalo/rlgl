const { patchRoom } = require('../service/redis')
const WAITING = 'WAITING'
const STARTED = 'STARTED'
const END = 'END'

const RoomTimer = function (io, id) {
  this.id = id
  this.countdown = 180
  this.timer = setInterval(() => {
    if(this.countdown > 0) {
      this.countdown--
      io.to(id).emit('timer', this.countdown)
    } else if (this.countdown <= 0) {
      clearInterval(this.timer)
      patchRoom(roomId, { status: END })
      io.to(id).emit('timeout')
    }
  }, 1000)
}
module.exports = {
  WAITING,
  STARTED,
  END,
  RoomTimer
}