const { merge } = require("webpack-merge");
const common = require("./webpack.common");

const dev = {
  mode: "development",
  devtool: "inline-source-map",
  devServer: {
    open: false,
    client: {
      overlay: {
        errors: true,
        warnings: false
      }
    }
  }
};

// noinspection JSCheckFunctionSignatures
module.exports = merge(common, dev);
