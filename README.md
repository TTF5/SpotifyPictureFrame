# Spotify Picture Frame #

Example config

```javascript
module.exports = {
    spotify: {
        clientId: '043a4af3xxxxxxxxxxxxxxxxxxxxxxxxx',
        clientSecret: '979c9c8xxxxxxxxxxxxxxxxxxxxxxxxxx',
        redirectUri: 'http://localhost:8080'
    },
    refreshTime: 500,
    port: 8080,
}
```

1. Start the Server: ```yarn run app```
2. Login /w Spotify ```http://localhost:<port>/login```
3. Load the app website ```http://localhost:<port>/app```

Don't forget to set the redirectUri in your SpotifyApplication!