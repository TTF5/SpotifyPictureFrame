var path = require('path');

module.exports = {
  entry: [
    'babel-polyfill',
    './src/entry.js'
  ],
  devtool: 'inline-source-map',
  devServer: {
    contentBase: path.join(__dirname, 'public'),
    compress: true,
    port: 8080,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            plugins: [
              'transform-runtime',
              'transform-class-properties',
              'transform-decorators-legacy',
            ],
            presets:['latest', 'react']
          }
        }
      },
      {
        test: /\.scss$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { sourceMap:true } },
          { loader: 'sass-loader', options: { sourceMap:true } },
        ]
      },
      {
        test: /\.woff(2)?(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
          { loader: 'url-loader?limit=10000&mimetype=application/font-woff' }
        ]
      },
      {
        test: /\.(ttf|eot|svg)(\?v=[0-9]\.[0-9]\.[0-9])?$/,
        use: [
          { loader: 'file-loader' }
        ]
      }
    ]
  },
  output: {
    path: path.resolve(__dirname, 'public', 'build'),
    publicPath: 'build/',
    filename: 'app.js',
  },
};
