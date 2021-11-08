'use strict';

const e = React.createElement;
const SESSION_ID = 'sessionId';

class HomeComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      roomId: '', 
      sessionId: localStorage.getItem(SESSION_ID) || '',
      enableAction: false, 
      errorCreatingRoom: false,
      game: ''
    };

    this.handleChange = this.handleChange.bind(this);
    this.handleJoin = this.handleJoin.bind(this);
    this.handleNewGame = this.handleNewGame.bind(this);

  }


  componentDidMount() {
    const urlSearchParams = new URLSearchParams(window.location.search);
    const params = Object.fromEntries(urlSearchParams.entries());
    if(params && params.game) {
      this.setState({ game: params.game})
      if (params.game === 'end') {
        this.setState({ gameMsg: 'The game is ended.'})
      } else if (params.game === 'notFound') {
        this.setState({ gameMsg: 'Room not found'})
      }
    }

    if (!this.state.sessionId) {
      const sessionId = Date.now()
      localStorage.setItem(SESSION_ID, sessionId)
      this.setState({ sessionId, enableAction: true })
    } else {
      this.setState({ enableAction: true })
    }
  }

  // Use effect
  componentDidUpdate() {
  }

  handleChange(event) {
    this.setState({ roomId: event.target.value })
  }

  handleJoin() {
    window.location.href = `/game/${this.state.roomId}`
  }

  handleNewGame() {
    this.setState({ enableAction: false})
    fetch(`/room`, {
      method: 'POST',
      headers: {
        'Content-type': 'application/json'
      },
      body: JSON.stringify({
        sessionId: this.state.sessionId
      })
    })
      .then(response => response.json())
      .then(data => {
        if(data.roomId > 0) {
          localStorage.setItem('roomId', data.roomId)
          window.location.href = `/game/${data.roomId}`
        } else {
          this.setState({ enableAction: true, errorCreatingRoom: true})
        }        
      })
  }

  render() {
    const { enableAction, roomId, errorCreatingRoom, game } = this.state
    return (
      <div className="room-form">
        <div className="game-title">
          <strong>Red Light Green Light</strong>
        </div>
        <div className="room-textinput">
          <input disabled={!enableAction} type="text" name="room-id" placeholder="Enter room id" maxLength="6" value={roomId} onChange={this.handleChange}></input>
        </div>
        { errorCreatingRoom && (
          <div className="error">Error creating a room.</div>
        )}
        {
          game && (
            <div className="error">
              <strong>{this.state.gameMsg}</strong>
            </div>
          )
        }
        <div>
          <button onClick={this.handleJoin} disabled={!enableAction}>Join</button>
        </div>
        <div>
          <button onClick={this.handleNewGame} disabled={!enableAction}>New Game</button>
        </div>
      </div>
    )
  }
}

const domContainer = document.querySelector('#home-container');

ReactDOM.render(e(HomeComponent), domContainer);