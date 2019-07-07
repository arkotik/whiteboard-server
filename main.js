require('@babel/register')({
  presets: [
    [
      "@babel/preset-env",
      {
        useBuiltIns: "entry",
        corejs: 2
      }
    ]
  ]
});
require('@babel/polyfill');
require('@babel/core').transform('code', {
  plugins: [
    '@babel/plugin-proposal-throw-expressions',
    '@babel/plugin-proposal-class-properties'
  ]
});

module.exports = require('./src/index.js');
