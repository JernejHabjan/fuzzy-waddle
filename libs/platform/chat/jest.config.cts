const sharedPreset = require("../../../tools/testing/jest-angular-preset.cjs");

module.exports = {
  ...sharedPreset,
  displayName: "platform-chat",
  coverageDirectory: "../../../coverage/libs/platform/chat"
};
