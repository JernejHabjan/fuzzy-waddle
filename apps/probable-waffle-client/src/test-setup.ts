import "jest-canvas-mock";
import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";
import failOnConsole from "jest-fail-on-console";

setupZoneTestEnv();

failOnConsole();

// Mock Phaser for game-related tests
// The Phaser mock is imported via jest moduleNameMapper from test/mocks/phaser.js
// This ensures the global.Phaser is set up correctly
require("./test/mocks/phaser");

// make sure to mock @dicebear/core and @dicebear/pixel-art using jest so that we don't get following error:
// import * as license from './utils/license.js';
// ^^^^^^
//
// SyntaxError: Cannot use import statement outside a module
jest.mock("@dicebear/core", () => {
  return {
    createAvatar: () => {
      return "";
    }
  };
});

jest.mock("@dicebear/pixel-art", () => {
  return {
    sprites: {}
  };
});
