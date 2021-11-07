const { getRoom, updateRoom } = require('../service/redis')
const { STARTED } = require('./room')
const RED = 'RED', GREEN = 'GREEN'
const MAX_TOGGLE_TIME = 6000
const MIN_TOGGLE_TIME = 2000

const LightToggler = function (io, roomId) {
  this.light = RED
  this.toggle = async () => {
    const room = await getRoom(roomId)
    if(room.status === STARTED) {
      this.light = this.light === GREEN ? RED : GREEN
      room.light = this.light
      await updateRoom(roomId, room)
      io.to(roomId).emit('lightChanged', this.light)
      const nextToggle = Math.floor(Math.random() * MAX_TOGGLE_TIME) + MIN_TOGGLE_TIME
      setTimeout(() => {
        this.toggle()
      }, nextToggle)
    }
  }
  this.toggle()
}

module.exports = {
  LightToggler,
  RED, GREEN
}