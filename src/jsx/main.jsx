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
    let imageClass = this.props.info.isPlaying ? "playing" : "paused";
    let trackTitle = this.props.info.name + " - " + this.props.info.artist;

    return(
      <div id="content-justify">
        <div id="playback-info">
          <div id="coverart"><img src={this.props.info.image} /></div>
          <ProgressBar progress={this.props.info.progress} duration={this.props.info.duration} />
          <p>{trackTitle}</p>
        </div>
      </div>
    );
  }
}

class ProgressBar extends React.Component {
  render() {

    let width = this.props.progress / this.props.duration * 100;

    return(
      <div id="bar">
        <div id="progress" style={{width: width}} />
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
      <div id="user-info">
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

    this.tick = this.tick.bind(this);
    this.fetchPlayingTrack = this.fetchPlayingTrack.bind(this);
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
  }

  componentDidMount() {
    this.interval = setInterval(this.tick, 250);
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  tick() {
    if(this.state.loggedIn === true) {
      this.fetchPlayingTrack();
    }
  }

  fetchUserInfo() {
    fetch('http://localhost:8080/api/user')
     .then(result => result.json())
     .then((data) => {
        //console.log(data);
        this.setState({userinfo: {name: data.name, avatar: data.avatar}});
     });
  }

  fetchPlayingTrack() {
    fetch('http://localhost:8080/api/playback')
      .then(data => data.json())
      .then((result) => {
        let data = result.body;

        console.log(data);

        let info = {
          isPlaying: data.is_playing,
          progress: data.progress_ms,
          duration: data.item.duration_ms,
          name: data.item.name,
          artist: data.item.artists[0].name,
          image: data.item.album.images[0].url,
        };

        this.setState({ playbackinfo: info});
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