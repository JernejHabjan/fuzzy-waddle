const sharedPreset = require("../../../../tools/testing/jest-angular-preset.cjs");

module.exports = {
  ...sharedPreset,
  displayName: "fly-squasher-interface",
  coverageDirectory: "../../../../coverage/libs/games/fly-squasher/interface"
};
