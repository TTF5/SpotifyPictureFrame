var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var bodyParser = require('body-parser');
var SpotifyWebApi = require('spotify-web-api-node');

var LoggedIn = false;
var TokenRefreshTimeout = null;

// Setup Express
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
var apiRouter = express.Router();

app.use('/api', apiRouter);
app.ws('/live', function(ws, req) {});
app.use('/app', express.static('public'));

// Setup SpotifyApi
var scopes = ['user-read-private', 'user-read-email', 'user-read-playback-state'];
var spotifyApi = new SpotifyWebApi({
    clientId: '043a4af36efd49f58005e8135c722c93',
    clientSecret: '9658001a933340bb843f275262bf732a',
    redirectUri: 'http://localhost:8080'
});

function handleSpotifyError(err) {
    if(err.name === "WebapiError" &&
        err.message === "Unauthorized" &&
        err.statusCode === 401) {
        
        console.log("Error: No longer authorized!");
        LoggedIn = false;
        updateLoginState();
    } else {
        console.log(err);
    }
}

expressWs.getWss().on('connection', function(ws) {
    console.log('New client connected!');
    var json = JSON.stringify({
        loggedIn: LoggedIn,
    });
    ws.send(json);
})

var updateLoginState = function() {
    let json = JSON.stringify({
        loggedIn: LoggedIn,
    });

    expressWs.getWss().clients.forEach(function each(client) {
        client.send(json);
    });
}

var updatePlaybackState = function() {
    if(LoggedIn) {
        spotifyApi.getMyCurrentPlayingTrack().then(function(result) {
            let data = result.body;

            let info = {
              isPlaying: data.is_playing,
              progress: data.progress_ms,
              duration: data.item.duration_ms,
              name: data.item.name,
              artist: data.item.artists[0].name,
              image: data.item.album.images[0].url,
            }

            let json = JSON.stringify({
                playbackInfo: info,
            });

            expressWs.getWss().clients.forEach(function each(client) {
                client.send(json);
            });
      
          }, function(err) {
              handleSpotifyError(err);
          });
    }    
}

var doLogin = function(code, res) {
    spotifyApi.authorizationCodeGrant(code)
        .then(function(data) {
            console.log('The token expires in ' + data.body['expires_in']);

            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);

            LoggedIn = true;
            updateLoginState();

            TokenRefreshTimeout = setTimeout(refreshToken, (data.body['expires_in']-3)*1000);

            res.redirect('/login');
        }, function(err) {
            handleSpotifyError(err);
            console.log(err);
        });
}

var refreshToken = function() {
    spotifyApi.refreshAccessToken()
    .then(function(data) {
        console.log('The access token has been refreshed!');
        console.log('The token expires in ' + data.body['expires_in']);

        // Save the access token so that it's used in future calls
        spotifyApi.setAccessToken(data.body['access_token']);
        
        TokenRefreshTimeout = setTimeout(refreshToken, data.body['expires_in']);
    }, function(err) {
        console.log('Could not refresh access token', err);
    });
}

app.get('/', function(req, res) {
    if(req.query.code != undefined && req.query.state == "login") {
        doLogin(req.query.code, res);    
    } else {
        res.redirect('/app');
    }
});

app.get('/login', function(req, res) {
    if(!LoggedIn)
        res.send('<html><head><title>SpotifyPictureFrame - Login</title></head><body><center><a href="'
                    + spotifyApi.createAuthorizeURL(scopes, 'login') +
                    '">Login</a></center></body></html>');
    else
        res.send('<html><head><title>SpotifyPictureFrame - Login</title></head><body><center><a href="/logout">Logout</a></center></body></html>');
});

app.get('/logout', function(req, res) {
    LoggedIn = false;
    
    spotifyApi.resetAccessToken();
    spotifyApi.resetRefreshToken();
    // spotifyApi.resetCode(); Not defined?!

    // Needed for authentication
    // spotifyApi.resetRedirectURI();
    // spotifyApi.resetClientId();
    // spotifyApi.resetClientSecret();

    clearTimeout(TokenRefreshTimeout);

    updateLoginState();

    res.redirect('/login');
});

apiRouter.route("/").get(function(req, res) {
    res.send("API entry");
});

apiRouter.route('/loggedIn')
    .get(function(req, res) {
        res.json({ status: LoggedIn});
    });

apiRouter.route('/user')
    .get(function (req, res) {
        spotifyApi.getMe().then(function(data) {
            let name = data.body.display_name;
            let id = data.body.id;
            let avatar = data.body.images[0].url;
            res.json({id: id, name: name, avatar: avatar});
        }, function(err) {
            handleSpotifyError(err);
            res.json({error: err, code: 002});
        });
    });

setInterval(updatePlaybackState, 1000);

app.listen(8080);