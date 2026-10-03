const sharedPreset = require("../../../tools/testing/jest-angular-preset.cjs");

module.exports = {
  ...sharedPreset,
  displayName: "platform-identity",
  coverageDirectory: "../../../coverage/libs/platform/identity"
};
