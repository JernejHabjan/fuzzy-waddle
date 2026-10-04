const sharedPreset = require("../../../tools/testing/jest-angular-preset.cjs");

module.exports = {
  ...sharedPreset,
  displayName: "platform-game-host",
  coverageDirectory: "../../../coverage/libs/platform/game-host"
};
