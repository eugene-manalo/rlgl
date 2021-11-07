var redis = require("redis");
var randomstring = require("randomstring");
var roomUtil = require('../utils/room')
var { newPlayerConfig } = require('../utils/config');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'redis.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple(),
  }));
}

const client = redis.createClient()
const { WAITING } = roomUtil
const EXPIRY_OPTION =  {
  EX: 60 * 60 // 30 mins
}
client.on('error', err => logger.info('Redis Client Errr', err))
client.connect()

const roomGenerator = async (ownerId) => {
  let hasGeneratedRoom = false
  var roomId = ''
  let roomCache
  try {
    do {
      roomId = randomstring.generate({
        length: 6,
        charset: 'numeric'
      })

      const isRoomExists = await client.exists(`rm_${roomId}`)
      logger.debug('isRoomExists', isRoomExists)
      if (!isRoomExists) {
        hasGeneratedRoom = true
        const initConfig = {
          status: WAITING,
          owner: ownerId,
          bombs: initializeBombs()
        }
  
        roomCache = await client.set(`rm_${roomId}`, JSON.stringify(initConfig), EXPIRY_OPTION)
      }
    } while(!hasGeneratedRoom)
  } catch(e) {
    logger.error(e.message)
    roomId = 0
  }

  logger.info(`Room generated: ${roomId}`)
  return roomId
}

const initializePlayer = async (playerId, roomId) => {
  logger.info('initializing player')
  const player = {
    ...newPlayerConfig
  }
  player.playerId = playerId
  player.roomId = roomId

  try {
    await client.set(`r_${roomId}:p_${playerId}`, JSON.stringify(player), EXPIRY_OPTION)
  } catch(e) {
    logger.error(e.message)
  }
  logger.info('player generated', player)
  return player
}

const initializeBombs = () => {
  const BOARD_SIZE = 20
  const bombs = []

  // each column should have bomb
  for(var x=0; x <= BOARD_SIZE; x++) {
    bombs.push(`${x},${Math.floor(Math.random() * (BOARD_SIZE -4))}`)
  }
  // another 10 bombs
  for(var i=0; i <= 10; i++) {
    bombs.push(`${Math.floor(Math.random() * BOARD_SIZE)},${Math.floor(Math.random() * (BOARD_SIZE -4))}`)
  }

  // try {
  //   await client.set(`b_${roomId}`, JSON.stringify(bombs), EXPIRY_OPTION)
  // } catch (e) {
  //   logger.error('error creating bombs', e.message)
  // }

  return bombs;
}

const createRoom = async (ownerId) => {
  const generatedRooom = await roomGenerator(ownerId)
  if (generatedRooom) {
    await initializePlayer(ownerId, generatedRooom)
    // await initializeBombs(generatedRooom)
  }
  return generatedRooom
}

const getRoom = async (roomId) => {
  let room
  try {
    room = JSON.parse(await client.get(`rm_${roomId}`))
  } catch(e) {
    logger.info('error', e.message)
  }
  return room
}

const updateRoom = async (roomId, roomObj) => {
  logger.info('Updating room:', roomObj)
  try {
    await client.set(`rm_${roomId}`, JSON.stringify(roomObj), EXPIRY_OPTION)
  } catch(e) {
    logger.info('error', e)
    return {}
  }
  return roomObj
}

const patchRoom = async (roomId, update) => {
  let updatedData
  try {
    const data = await getRoom(roomId)
    if (!data) {
      return
    }
    logger.info('patch room', data)
    updatedData = {
      ...data,
      ...update
    }
    await client.set(`rm_${roomId}`, JSON.stringify(updatedData), EXPIRY_OPTION)
  }catch(e) {
    logger.info('error', e.message)
  } 

  return updatedData
}

const getPlayerByRoom = async (playerId, roomId) => {
  let data
  try {
    data = JSON.parse(await client.get(`r_${roomId}:p_${playerId}`))
  } catch(e) {
    logger.info('error', e.message)
  }

  return data
}

const getPlayersByRoom = async (roomId) => {
  const room = await getRoom(roomId)
  if(!room) return []

  const players = room.players
  if(!players || players.length <= 0) {
    return []
  }

  logger.info(`players`, players)
  const r_pIds = players.map((p) => `r_${roomId}:p_${p.playerId}`)
  logger.info(`r_pIds`, r_pIds)
  const playersInfo = await client.mGet(r_pIds)
  const playersInfoJson = playersInfo.map(p => JSON.parse(p))
  logger.info(`players in room:${roomId}`, playersInfoJson)

  return playersInfoJson
}

const patchPlayerByRoom = async (playerId, roomId, update) => {
  let updatedData
  try {
    const data = JSON.parse(await client.get(`r_${roomId}:p_${playerId}`))
    if (!data) {
      return
    }
    logger.info('patch player', data)
    updatedData = {
      ...data,
      ...update
    }
    await client.set(`r_${roomId}:p_${playerId}`, JSON.stringify(updatedData), EXPIRY_OPTION)
  }catch(e) {
    logger.info('error', e.message)
  } 

  return updatedData
}

module.exports = {
  createRoom,
  getRoom,
  initializePlayer,
  getPlayerByRoom,
  getPlayersByRoom,
  patchPlayerByRoom,
  updateRoom,
  patchRoom,
}