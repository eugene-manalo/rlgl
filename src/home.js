'use strict';

const e = React.createElement;

class HomeComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = { roomId: '' };

    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleChange(event) {
    this.setState({ roomId: event.target.value })
  }

  handleSubmit() {
    fetch(`/checkRoom/${this.state.roomId}`)
      .then(response => response.json())
      .then(data => console.log(data))
  }

  render() {
    return (
      <div className="room_form">
        <div className="room_textinput">
          <input type="text" name="room_id" placeholder="Enter room id" maxLength="4" value={this.state.roomId} onChange={this.handleChange}></input>
        </div>
        <div>
          <button onClick={this.handleSubmit}>Join</button>
        </div>
        <div>
          <button>Create</button>
        </div>
      </div>
    )
  }
}

const domContainer = document.querySelector('#home_container');

ReactDOM.render(e(HomeComponent), domContainer);