'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var e = React.createElement;
var SESSION_ID = 'sessionId';

var HomeComponent = function (_React$Component) {
  _inherits(HomeComponent, _React$Component);

  function HomeComponent(props) {
    _classCallCheck(this, HomeComponent);

    var _this = _possibleConstructorReturn(this, (HomeComponent.__proto__ || Object.getPrototypeOf(HomeComponent)).call(this, props));

    _this.state = {
      roomId: '',
      sessionId: localStorage.getItem(SESSION_ID) || '',
      enableAction: false,
      errorCreatingRoom: false,
      game: ''
    };

    _this.handleChange = _this.handleChange.bind(_this);
    _this.handleJoin = _this.handleJoin.bind(_this);
    _this.handleNewGame = _this.handleNewGame.bind(_this);

    return _this;
  }

  _createClass(HomeComponent, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var urlSearchParams = new URLSearchParams(window.location.search);
      var params = Object.fromEntries(urlSearchParams.entries());
      if (params && params.game) {
        this.setState({ game: params.game });
        if (params.game === 'end') {
          this.setState({ gameMsg: 'The game is ended.' });
        } else if (params.game === 'notFound') {
          this.setState({ gameMsg: 'Room not found' });
        }
      }

      if (!this.state.sessionId) {
        var sessionId = Date.now();
        localStorage.setItem(SESSION_ID, sessionId);
        this.setState({ sessionId: sessionId, enableAction: true });
      } else {
        this.setState({ enableAction: true });
      }
    }

    // Use effect

  }, {
    key: 'componentDidUpdate',
    value: function componentDidUpdate() {}
  }, {
    key: 'handleChange',
    value: function handleChange(event) {
      this.setState({ roomId: event.target.value });
    }
  }, {
    key: 'handleJoin',
    value: function handleJoin() {
      window.location.href = '/game/' + this.state.roomId;
    }
  }, {
    key: 'handleNewGame',
    value: function handleNewGame() {
      var _this2 = this;

      this.setState({ enableAction: false });
      fetch('/room', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: this.state.sessionId
        })
      }).then(function (response) {
        return response.json();
      }).then(function (data) {

        if (data.roomId > 0) {
          localStorage.setItem('roomId', data.roomId);
          window.location.href = '/game/' + data.roomId;
        } else {
          _this2.setState({ enableAction: true, errorCreatingRoom: true });
        }
      });
    }
  }, {
    key: 'render',
    value: function render() {
      var _state = this.state,
          enableAction = _state.enableAction,
          roomId = _state.roomId,
          errorCreatingRoom = _state.errorCreatingRoom,
          game = _state.game;

      return React.createElement(
        'div',
        { className: 'room-form' },
        React.createElement(
          'div',
          { className: 'game-title' },
          React.createElement(
            'strong',
            null,
            'Red Light Green Light'
          )
        ),
        React.createElement(
          'div',
          { className: 'room-textinput' },
          React.createElement('input', { disabled: !enableAction, type: 'text', name: 'room-id', placeholder: 'Enter room id', maxLength: '6', value: roomId, onChange: this.handleChange })
        ),
        errorCreatingRoom && React.createElement(
          'div',
          { className: 'error' },
          'Error creating a room.'
        ),
        game && React.createElement(
          'div',
          { className: 'error' },
          React.createElement(
            'strong',
            null,
            this.state.gameMsg
          )
        ),
        React.createElement(
          'div',
          null,
          React.createElement(
            'button',
            { onClick: this.handleJoin, disabled: !enableAction },
            'Join'
          )
        ),
        React.createElement(
          'div',
          null,
          React.createElement(
            'button',
            { onClick: this.handleNewGame, disabled: !enableAction },
            'New Game'
          )
        )
      );
    }
  }]);

  return HomeComponent;
}(React.Component);

var domContainer = document.querySelector('#home-container');

ReactDOM.render(e(HomeComponent), domContainer);