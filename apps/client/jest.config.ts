/* eslint-disable */
export default {
  displayName: "client",
  preset: "../../jest.preset.js",
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  coverageDirectory: "../../coverage/apps/client",
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
    "^phaser$": "<rootDir>/src/test/mocks/phaser.js",
    "^@supabase/supabase-js$": "<rootDir>/src/test/mocks/supabase-js.js"
  }
};
