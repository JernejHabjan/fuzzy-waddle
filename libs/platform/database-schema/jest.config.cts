const sharedPreset = require("../../../tools/testing/jest-node-preset.cjs");

module.exports = {
  ...sharedPreset,
  displayName: "platform-database-schema",
  coverageDirectory: "../../../coverage/libs/platform/database-schema"
};
