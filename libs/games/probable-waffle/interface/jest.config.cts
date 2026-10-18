const sharedPreset = require("../../../../tools/testing/jest-angular-preset.cjs");

module.exports = {
  ...sharedPreset,
  displayName: "probable-waffle-interface",
  coverageDirectory: "../../../../coverage/libs/games/probable-waffle/interface"
};
