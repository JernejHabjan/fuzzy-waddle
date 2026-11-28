const preset = require("../../../../tools/testing/jest-angular-preset.cjs");

module.exports = {
  ...preset,
  // Geometry regression tests use Three.js itself; its CommonJS entry now loads ESM internally.
  transformIgnorePatterns: ["node_modules/(?!.*\\.mjs$|(?:\\.pnpm/three@[^/]+/node_modules/)?three/)"],
  displayName: "trump-defense-interface",
  coverageDirectory: "../../../../coverage/libs/games/trump-defense/interface"
};
