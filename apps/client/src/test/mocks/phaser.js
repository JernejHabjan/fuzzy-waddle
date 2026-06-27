/* eslint-disable @typescript-eslint/no-unused-vars,no-undef */
// src/test/mocks/phaser.js

class Game {
  constructor(config) {
    this.config = config;
  }
  destroy() {
    //
  }
}

class Container {
  constructor(scene, x = 0, y = 0) {
    this.scene = scene;
    this.x = x;
    this.y = y;
  }
  setInteractive() {
    return this;
  }
  add() {
    return this;
  }
  setScale() {
    return this;
  }
  setPosition() {
    return this;
  }
  setAlpha() {
    return this;
  }
  setOrigin() {
    return this;
  }
  getBounds() {
    return { width: 1, height: 1 };
  }
}

class Sprite extends Container {
  play() {
    return this;
  }
}

class Image extends Container {}
class Scene {}
class Text extends Container {}
class Graphics extends Container {}
class Group {}
class LightsManager {}
class Zone extends Container {}

class Vector2 {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

class Point {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }
}

class Polygon {
  constructor(points) {
    this.points = points || [];
  }
}

class Color {}
class Body {}
class Tween {}
class TimerEvent {}

class Circle {
  constructor(x, y, r) {
    this.x = x;
    this.y = y;
    this.r = r;
  }
  static Contains(circle, pointX, pointY) {
    return true;
  }
}

class Rectangle {
  constructor(x, y, width, height) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  static Intersection(rectA, rectB) {
    const x = Math.max(rectA.x, rectB.x);
    const y = Math.max(rectA.y, rectB.y);
    const width = Math.min(rectA.x + rectA.width, rectB.x + rectB.width) - x;
    const height = Math.min(rectA.y + rectA.height, rectB.y + rectB.height) - y;

    return new Rectangle(x, y, Math.max(0, width), Math.max(0, height));
  }

  static Overlaps(rectA, rectB) {
    return (
      rectA.x < rectB.x + rectB.width &&
      rectA.x + rectA.width > rectB.x &&
      rectA.y < rectB.y + rectB.height &&
      rectA.y + rectA.height > rectB.y
    );
  }
}

const Scale = {
  RESIZE: "RESIZE"
};

const MathUtils = {
  Between: (min = 0, max = 0) => Math.floor(Math.random() * (max - min + 1)) + min,
  Distance: {
    Between: () => 0,
    Squared: () => 0
  },
  Angle: {
    Between: () => 0
  },
  Vector2
};

const Geom = {
  Circle,
  Rectangle,
  Point,
  Polygon
};

const Types = {
  // add any Phaser.Types mocks your code uses
};

const Scenes = {
  Events: {
    SHUTDOWN: "shutdown"
  }
};

const Display = {
  Color
};

const Input = {
  Keyboard: {
    KeyCodes: {}
  }
};

const Physics = {
  Arcade: {
    Body
  }
};

const Tweens = {
  Tween
};

const Time = {
  TimerEvent
};

const Phaser = {
  Game,
  GameObjects: {
    Container,
    Sprite,
    Image,
    GameObject: Container,
    Text,
    Graphics,
    Group,
    LightsManager,
    Zone
  },
  Scene,
  Scenes,
  Geom,
  Scale,
  Math: MathUtils,
  Display,
  Input,
  Physics,
  Tweens,
  Time,
  Types
};

// Set up global.Phaser for tests that need it
if (typeof global !== "undefined") {
  global.Phaser = Phaser;
}

/**
 * Creates a generic mock scene with common properties
 * @param {Object} overrides - Properties to override in the mock scene
 * @returns {Object} Mock scene object
 */
function createMockScene(overrides = {}) {
  return {
    input: {
      keyboard: {
        on: jest.fn(),
        off: jest.fn()
      }
    },
    cameras: {
      main: {
        getWorldPoint: jest.fn((x, y) => ({ x, y })),
        worldView: new Rectangle(0, 0, 800, 600)
      }
    },
    communicator: {
      allScenes: {
        pipe: jest.fn(() => ({
          subscribe: jest.fn(() => ({ unsubscribe: jest.fn() }))
        })),
        subscribe: jest.fn(() => ({ unsubscribe: jest.fn() }))
      }
    },
    onShutdown: {
      subscribe: jest.fn(() => ({ unsubscribe: jest.fn() }))
    },
    ...overrides
  };
}

module.exports = {
  default: Phaser,
  ...Phaser,
  createMockScene
};
