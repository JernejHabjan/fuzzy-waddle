const sharedPreset = require("../../../../tools/testing/jest-angular-preset.cjs");

module.exports = {
  ...sharedPreset,
  displayName: "dungeon-crawler-interface",
  coverageDirectory: "../../../../coverage/libs/games/dungeon-crawler/interface"
};
