const TerserPlugin = require('terser-webpack-plugin');

const path = require('path');
const package = require('./package.json');

module.exports = {
  devtool: "nosources-source-map",
  entry: './src/main.js',
  optimization: {
    minimizer: [
      new TerserPlugin({
        parallel: true,
        terserOptions: {
          sourceMap: true
        },
      })
    ]
  },
  output: {
    filename: `lob-address-elements-${package.version}.min.js`,
    path: path.resolve(__dirname, 'lib'),
  },
};
