const path = require("node:path");
const nxPreset = require("../../jest.preset.js");

module.exports = {
  ...nxPreset,
  testEnvironment: "jsdom",
  setupFilesAfterEnv: [path.join(__dirname, "angular/test-setup.ts")],
  transform: {
    "^.+\\.(ts|mjs|js|html)$": [
      "jest-preset-angular",
      {
        stringifyContentPathRegex: "\\.(html|svg)$"
      }
    ]
  },
  transformIgnorePatterns: ["node_modules/(?!.*\\.mjs$)"],
  snapshotSerializers: [
    "jest-preset-angular/build/serializers/no-ng-attributes",
    "jest-preset-angular/build/serializers/ng-snapshot",
    "jest-preset-angular/build/serializers/html-comment"
  ],
  moduleNameMapper: {
    "^lodash-es$": "lodash",
    "^phaser$": path.join(__dirname, "angular/mocks/phaser.js"),
    "^phaser3-rex-plugins/.*$": path.join(__dirname, "angular/mocks/phaser3-rex-plugin.js"),
    "^@supabase/supabase-js$": path.join(__dirname, "angular/mocks/supabase-js.js")
  }
};
