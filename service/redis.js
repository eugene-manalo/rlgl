var redis = require("redis");
var randomstring = require("randomstring");

const client = redis.createClient()
client.on('error', err => console.log('Redis Client Errr', err))

const roomIdGenerator = async (ownerId) => {
  let hasGeneratedRoom = false
  var roomId = ''
  let roomCache
  await client.connect()
  do {

    roomId = randomstring.generate({
      length: 6,
      charset: 'numeric'
    })

    const isRoomExists = await client.exists(`r_${roomId}`)
    console.log('isRoomExists', isRoomExists)
    if (!isRoomExists) {
      hasGeneratedRoom = true
      const initConfig = {
        status: 'WAIT',
        owner: ownerId
      }

      roomCache = await client.set(`r_${roomId}`, JSON.stringify(initConfig), {
        EX: 60 * 30 // 30 mins
      })
    }
  } while(!hasGeneratedRoom)

  console.log(roomCache)
  await client.disconnect()
  return roomCache
}

const createRoom = async (ownerId) => {
  const generatedRooom = await roomIdGenerator(ownerId)

  return generatedRooom
}

module.exports = {
  createRoom
}