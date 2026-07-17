const sharedPreset = require("../../../../tools/testing/jest-node-preset.cjs");

module.exports = {
  ...sharedPreset,
  displayName: "little-muncher-server",
  coverageDirectory: "../../../../coverage/libs/games/little-muncher/server"
};
