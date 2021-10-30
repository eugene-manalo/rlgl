'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var e = React.createElement;

var HomeComponent = function (_React$Component) {
  _inherits(HomeComponent, _React$Component);

  function HomeComponent(props) {
    _classCallCheck(this, HomeComponent);

    var _this = _possibleConstructorReturn(this, (HomeComponent.__proto__ || Object.getPrototypeOf(HomeComponent)).call(this, props));

    _this.state = { roomId: '' };

    _this.handleChange = _this.handleChange.bind(_this);
    _this.handleSubmit = _this.handleSubmit.bind(_this);
    return _this;
  }

  _createClass(HomeComponent, [{
    key: 'handleChange',
    value: function handleChange(event) {
      this.setState({ roomId: event.target.value });
    }
  }, {
    key: 'handleSubmit',
    value: function handleSubmit() {
      fetch('/checkRoom/' + this.state.roomId).then(function (response) {
        return response.json();
      }).then(function (data) {
        return console.log(data);
      });
    }
  }, {
    key: 'render',
    value: function render() {
      return React.createElement(
        'div',
        { className: 'room_form' },
        React.createElement(
          'div',
          { className: 'room_textinput' },
          React.createElement('input', { type: 'text', name: 'room_id', placeholder: 'Enter room id', maxLength: '4', value: this.state.roomId, onChange: this.handleChange })
        ),
        React.createElement(
          'div',
          null,
          React.createElement(
            'button',
            { onClick: this.handleSubmit },
            'Join'
          )
        ),
        React.createElement(
          'div',
          null,
          React.createElement(
            'button',
            null,
            'Create'
          )
        )
      );
    }
  }]);

  return HomeComponent;
}(React.Component);

var domContainer = document.querySelector('#home_container');

ReactDOM.render(e(HomeComponent), domContainer);