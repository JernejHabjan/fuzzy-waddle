const sharedPreset = require("../../../../tools/testing/jest-angular-preset.cjs");

module.exports = {
  ...sharedPreset,
  displayName: "probable-waffle-gameplay",
  coverageDirectory: "../../../../coverage/libs/games/probable-waffle/gameplay"
};
