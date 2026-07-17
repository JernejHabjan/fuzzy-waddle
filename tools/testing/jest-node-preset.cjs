const nxPreset = require("../../jest.preset.js");

module.exports = {
  ...nxPreset,
  testEnvironment: "node",
  transform: {
    "^.+\\.[tj]s$": [
      "@swc/jest",
      {
        sourceMaps: "inline",
        module: {
          type: "commonjs"
        },
        jsc: {
          target: "es2024",
          parser: {
            syntax: "typescript",
            decorators: true
          },
          transform: {
            legacyDecorator: true,
            decoratorMetadata: true
          }
        }
      }
    ]
  },
  moduleFileExtensions: ["ts", "js", "html"]
};
