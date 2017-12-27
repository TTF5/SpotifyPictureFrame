var express = require('express');
var app = express();
var expressWs = require('express-ws')(app);
var bodyParser = require('body-parser');

var scopes = ['user-read-private', 'user-read-email', 'user-read-playback-state'];

var SpotifyWebApi = require('spotify-web-api-node');

var LoggedIn = false;

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
    }
}

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.ws('/live', function(ws, req) {});

expressWs.getWss().on('connection', function(ws) {
    console.log('New client connected!');
    var json = JSON.stringify({
        loggedIn: LoggedIn,
    });
    ws.send(json);
})

var updateLoginState = function() {
    var json = JSON.stringify({
        loggedIn: LoggedIn,
    });

    expressWs.getWss().clients.forEach(function each(client) {
        client.send(json);
    });
}

app.get('/', function(req, res) {
    if(req.query.code != undefined && req.query.state == "login") {
        let code = req.query.code;
        spotifyApi.authorizationCodeGrant(code)
        .then(function(data) {
            console.log('The token expires in ' + data.body['expires_in']);
            console.log('The access token is ' + data.body['access_token']);
            console.log('The refresh token is ' + data.body['refresh_token']);

            // Set the access token on the API object to use it in later calls
            spotifyApi.setAccessToken(data.body['access_token']);
            spotifyApi.setRefreshToken(data.body['refresh_token']);

            LoggedIn = true;
            updateLoginState();

            res.redirect('/login');
        }, function(err) {
            handleSpotifyError(err);
            console.log(err);
        });
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

    updateLoginState();

    res.redirect('/login');
});

app.use('/app', express.static('public'));

var router = express.Router();
app.use('/api', router);

router.route("/").get(function(req, res) {
    res.send("API entry");
});

// router.route('/authorizeUrl')
//     .get(function(req, res) {
//         res.json({ url:  });
//     });

router.route('/loggedIn')
    .get(function(req, res) {
        res.json({ status: LoggedIn});
    });

router.route('/user')
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

router.route('/playback').get(function(req, res) {
    spotifyApi.getMyCurrentPlayingTrack().then(function(data) {
        res.json(data);
    }, function(err) {
        handleSpotifyError(err);
        res.json({error: err, code:003});
    });
});

app.listen(8080);