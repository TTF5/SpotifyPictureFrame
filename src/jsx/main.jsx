import ReactDOM from 'react-dom';
import React from 'react';
import Websocket from 'react-websocket';

class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {
    // fetch('http://localhost:8080/api/loggedIn')
    // .then(result => result.json())
    // .then(data => this.setState({loggedIn: data.status}));
  }

  render() {
    if(this.props.isLoggedIn) {
      return(
        <div>
          <UserInfo info={this.props.userinfo} />
          <PlaybackInfo info={this.props.playbackInfo} />
        </div>
      );
    } else {
      return(null);
    }
  }
}

class PlaybackInfo extends React.Component {
  constructor(props) {
    super(props);

    
    // playbackinfo: {
    //   isPlaying: false,
    //   progress: 0,
    //   duration: 0,
    //   name: "",
    //   artist: "",
    //   image: "",
    // }
  }

  render() {
    let imageClass = ["coverart"];
    if(!this.props.info.isPlaying)
      imageClass.push("paused");

    let trackTitle = this.props.info.name + " - " + this.props.info.artist;

    return(
      <div className="content-justify">
        <div className="playback-info">
          <div className={imageClass.join(' ')}>
            <div className="overlay">
              <img src={this.props.info.image} />
            </div>
          </div>
          <ProgressBar progress={this.props.info.progress} duration={this.props.info.duration} />
          <p>{trackTitle}</p>
        </div>
      </div>
    );
  }
}

class ProgressBar extends React.Component {
  render() {

    let width = this.props.progress / this.props.duration * 100 + "%";

    return(
      <div className="bar">
        <div className="progress" style={{width: width}} />
      </div>
    );
  }
}

class UserInfo extends React.Component {

  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="user-info">
          <div className="inner">
            <p>{this.props.info.name}</p>
          </div>
          <div className="inner">
            <img src={this.props.info.avatar} />
          </div>
      </div>
    );
  }
}

class WSHost extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
      loggedIn: false,
      userinfo: {
        name: "",
        avatar: ""
      },
      playbackinfo: {
        isPlaying: false,
        progress: 0,
        duration: 0,
        name: "",
        artist: "",
        image: "",
      }
    }

    this.fetchUserInfo = this.fetchUserInfo.bind(this);
  }

  handleData(data) {
    let result = JSON.parse(data);
    if(result.loggedIn != undefined) {
      this.setState({loggedIn: result.loggedIn});
      if(result.loggedIn === true) {
        this.fetchUserInfo();
      }
    }
    if(result.playbackInfo != undefined) {;

      this.setState({ playbackinfo: result.playbackInfo});
    }
  }

  fetchUserInfo() {
    fetch('http://localhost:8080/api/user')
     .then(result => result.json())
     .then((data) => {
        this.setState({userinfo: {name: data.name, avatar: data.avatar}});
     });
  }

  render() {
    return( 
      <div>
        <Websocket url='ws://localhost:8080/live'
            onMessage={this.handleData.bind(this)} />
        <App isLoggedIn={this.state.loggedIn} 
              userinfo={this.state.userinfo}
              playbackInfo={this.state.playbackinfo} />
      </div>
    );
  }
}

ReactDOM.render(
  <WSHost />,
  document.getElementById('root')
);