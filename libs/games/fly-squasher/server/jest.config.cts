const sharedPreset = require("../../../../tools/testing/jest-node-preset.cjs");

module.exports = {
  ...sharedPreset,
  displayName: "fly-squasher-server",
  coverageDirectory: "../../../../coverage/libs/games/fly-squasher/server"
};
