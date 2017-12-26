import ReactDOM from 'react-dom';
import React from 'react';

class App extends React.Component {
  constructor() {
    super();

    this.state = {

    };
  }

  render() {
    return(
      <p>App</p>
    );
  }
}

class LoginWrapper extends React.Component {
  constructor() {
    super();

    this.state = {
      authUrl: null,
      loggedIn: false,
    };
  }

  componentDidMount() {
    fetch('http://localhost:8080/api/loggedIn')
    .then(result => result.json())
    .then(data => this.setState({loggedIn: data.status}));

    fetch('http://localhost:8080/api/authorizeUrl')
    .then(result => result.json())
    .then(data => this.setState({authUrl: data.url}));
  }
  
  render = () => {
    if(this.state.loggedIn == true) {
      return (<App />);
    } else {
      return (<a href={this.state.authUrl} id="login-link">Login</a>);
    }
  }
}


ReactDOM.render(
  <LoginWrapper />,
  document.getElementById('root')
);