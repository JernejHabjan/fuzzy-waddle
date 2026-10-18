/* eslint-disable */
export default {
  displayName: "api",
  preset: "../../jest.preset.js",
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
  moduleFileExtensions: ["ts", "js", "html"],
  coverageDirectory: "../../coverage/apps/api"
};
