/* eslint-disable @typescript-eslint/no-unused-vars */
// src/test/mocks/phaser.js
// noinspection JSUnusedGlobalSymbols

class Game {
  constructor() {
    //
  }
  destroy() {
    //
  }
}
class Container {
  constructor(scene, x, y) {
    //
  }
  setInteractive() {
    //
  }
  add() {
    //
  }
  setScale() {
    //
  }
  setPosition() {
    //
  }
  setAlpha() {
    //
  }
  setOrigin() {
    //
  }
  getBounds() {
    return { width: 1, height: 1 };
  }
}
class Sprite extends Container {
  play() {
    //
  }
}
class Image {}
class Scene {}
class Circle {
  constructor(x, y, r) {
    //
  }
  static Contains() {
    return true;
  }
}

const Scale = {
  RESIZE: "RESIZE"
  // add more scale modes if needed
};

const Math = {
  Between: () => 0
};

const Geom = {
  Circle: Circle
};

const Types = {
  // mock what you need here
};

module.exports = {
  default: {
    Game,
    GameObjects: {
      Container,
      Sprite,
      Image
    },
    Scene,
    Geom,
    Math
  },
  Game,
  Scale,
  Types
};
