import "jest-canvas-mock";
import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";
import * as failOnConsole from "jest-fail-on-console";

setupZoneTestEnv();

failOnConsole();

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

jest.mock("phaser", () => {
  return {
    Game: class Game {
      constructor() {
        //
      }

      destroy() {
        //
      }
    }
  };
});
