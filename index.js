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

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/app', express.static('public'));

var router = express.Router();
app.use('/api', router);

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
        }, function(err) {
            console.log(err);
        });
    }
    res.redirect('/app');
});

router.route("/").get(function(req, res) {
    res.send("API entry");
});

router.route('/authorizeUrl')
    .get(function(req, res) {
        res.json({ url: spotifyApi.createAuthorizeURL(scopes, 'login') });
    });

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
            res.json({error: err, code: 002});
        });
    });

router.route('/playback').get(function(req, res) {
    spotifyApi.getMyCurrentPlayingTrack().then(function(data) {
        res.json(data);
    }, function(err) {
        res.json({error: err, code:003});
    });
});

app.listen(8080);