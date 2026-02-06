/* eslint-disable @typescript-eslint/no-unused-vars */
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
    
    return new Rectangle(
      x,
      y,
      Math.max(0, width),
      Math.max(0, height)
    );
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
  Between: (min = 0, max = 0) => Math.floor(Math.random() * (max - min + 1)) + min
};

const Geom = {
  Circle,
  Rectangle
};

const Types = {
  // add any Phaser.Types mocks your code uses
};

module.exports = {
  default: {
    Game,
    GameObjects: { Container, Sprite, Image },
    Scene,
    Geom,
    Scale,
    Math: MathUtils,
    Types
  },
  Game,
  GameObjects: { Container, Sprite, Image },
  Scene,
  Geom,
  Scale,
  Math: MathUtils,
  Types
};
