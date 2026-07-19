const { NxAppWebpackPlugin } = require("@nx/webpack/app-plugin");
const path = require("path");

const configValues = {
  build: {
    default: {
      target: "node",
      compiler: "tsc",
      outputPath: "../../dist/apps/api",
      main: "./src/main.ts",
      tsConfig: "./tsconfig.app.json",
      outputFileName: "main.js",
      sourceMap: true,
      assets: ["./src/assets"]
    },
    production: {
      optimization: true,
      extractLicenses: true,
      inspect: false
    }
  }
};

const configuration = process.env.NX_TASK_TARGET_CONFIGURATION || "default";
const buildOptions = {
  ...configValues.build.default,
  ...configValues.build[configuration]
};

module.exports = {
  plugins: [new NxAppWebpackPlugin(buildOptions)],
  output: {
    clean: true,
    filename: "main.js",
    path: path.resolve(__dirname, "../../dist/apps/api")
  }
};
