const sharedPreset = require("../../../../tools/testing/jest-node-preset.cjs");

module.exports = {
  ...sharedPreset,
  displayName: "probable-waffle-gameplay",
  coverageDirectory: "../../../../coverage/libs/games/probable-waffle/gameplay"
};
