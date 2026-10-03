/* eslint-disable */
export default {
  displayName: "probable-waffle-desktop",
  preset: "../../jest.preset.js",
  setupFilesAfterEnv: ["<rootDir>/../../tools/testing/angular/test-setup.ts"],
  coverageDirectory: "../../coverage/apps/probable-waffle-desktop",
  transform: {
    "^.+\\.(ts|mjs|js|html)$": [
      "jest-preset-angular",
      {
        tsconfig: "<rootDir>/tsconfig.spec.json",
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
    "^phaser$": "<rootDir>/../../tools/testing/angular/mocks/phaser.js",
    "^phaser3-rex-plugins/.*$": "<rootDir>/../../tools/testing/angular/mocks/phaser3-rex-plugin.js",
    "^@supabase/supabase-js$": "<rootDir>/../../tools/testing/angular/mocks/supabase-js.js"
  }
};
