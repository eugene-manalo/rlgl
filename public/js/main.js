const STARTED = "STARTED", WAITING = 'WAITING', END = 'END';
var game

var config = {
  type: Phaser.AUTO,
  parent: 'phaser-rlgl',
  width: 800,
  height: 700,
  backgroundColor: '#4488AA',
};

const SESSION_ID = 'sessionId';
const ROOM_ID = 'roomId';

function getLocalData() {
  let playerId = localStorage.getItem(SESSION_ID)
  let roomId = localStorage.getItem(ROOM_ID)
  let pid

  const paths = window.location.pathname.split('/');
  roomId = paths[paths.length - 1]
  localStorage.setItem(ROOM_ID, roomId)

  if(!playerId) {
    pid = Date.now()
    localStorage.setItem(SESSION_ID, pid)
  }

  return { playerId: playerId || pid, roomId }
}

function goToRoom(scenes) {
  const { roomId } = getLocalData()
  fetch(`/room/${roomId}`)
    .then(res => res.json())
    .then(data => {
      if(data.status === WAITING || data.status === STARTED) {
        config.scene = scenes
        game = new Phaser.Game(config);
      }
    })
}

function createPlayer() {
  const { playerId, roomId } = getLocalData()

  fetch(`/player/${playerId}/room/${roomId}`, {
    method: 'POST',
    headers: {
      'Content-type': 'application/json'
    },
  })
    .then(response => response.json())
    .then(data => {
      goToRoom([ChooseScene, GameScene])
    })

}

function initMain() {
  const { playerId, roomId } = getLocalData()
  let scenes

  fetch(`/player/${playerId}/room/${roomId}`)
    .then(response => response.json())
    .then(data => {
      if(Object.keys(data).length === 0) {
        // initialise player
        console.log('initialise player')
        createPlayer()
      } else {
        if (!data.shape) {
          scenes = [ChooseScene, GameScene]
        } else {
          scenes = [GameScene]
        }
        goToRoom(scenes)
      }
    })
};

window.onload = initMain()
// scenes = [ChooseScene]

// var config = {
//   type: Phaser.AUTO,
//   parent: 'phaser-rlgl',
//   width: 800,
//   height: 700,
//   backgroundColor: '#4488AA',
//   scene: scenes
// };

// var game = new Phaser.Game(config);