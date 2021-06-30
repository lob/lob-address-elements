const TerserPlugin = require('terser-webpack-plugin');

const path = require('path');
const package = require('./package.json');

module.exports = {
  mode: 'production',
  devtool: "nosources-source-map",
  entry: './src/lob-address-elements.js',
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
