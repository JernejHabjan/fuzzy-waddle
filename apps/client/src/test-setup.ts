import "jest-canvas-mock";
import { setupZoneTestEnv } from "jest-preset-angular/setup-env/zone";
import failOnConsole from "jest-fail-on-console";

setupZoneTestEnv();

failOnConsole();

// Mock Phaser for game-related tests
(global as any).Phaser = {
  GameObjects: {
    Container: class {},
    GameObject: class {},
    Image: class {},
    Text: class {},
    Graphics: class {},
    Sprite: class {},
    Group: class {},
    LightsManager: class {},
    Zone: class {}
  },
  Geom: {
    Rectangle: class {},
    Point: class {},
    Circle: class {},
    Polygon: class {}
  },
  Scene: class {},
  Math: {
    Distance: {
      Between: () => 0,
      Squared: () => 0
    },
    Angle: {
      Between: () => 0
    },
    Vector2: class {
      constructor(
        public x = 0,
        public y = 0
      ) {}
    }
  },
  Display: {
    Color: class {}
  },
  Input: {
    Keyboard: {
      KeyCodes: {}
    }
  },
  Physics: {
    Arcade: {
      Body: class {}
    }
  },
  Tweens: {
    Tween: class {}
  },
  Time: {
    TimerEvent: class {}
  }
};

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
