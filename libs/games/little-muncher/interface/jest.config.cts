const sharedPreset = require("../../../../tools/testing/jest-angular-preset.cjs");

module.exports = {
  ...sharedPreset,
  displayName: "little-muncher-interface",
  coverageDirectory: "../../../../coverage/libs/games/little-muncher/interface"
};
