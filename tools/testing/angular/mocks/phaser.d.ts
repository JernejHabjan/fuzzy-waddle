// Type declarations for phaser.js mock

export class Game {
  constructor(config: any);
  destroy(): void;
}

export class Container {
  scene: any;
  x: number;
  y: number;
  constructor(scene: any, x?: number, y?: number);
  setInteractive(): this;
  add(): this;
  setScale(): this;
  setPosition(): this;
  setAlpha(): this;
  setOrigin(): this;
  getBounds(): { width: number; height: number };
}

export class Sprite extends Container {
  play(): this;
}

export class Image extends Container {}
export class Scene {}
export class Text extends Container {}
export class Graphics extends Container {}
export class Group {}
export class LightsManager {}
export class Zone extends Container {}

export class Vector2 {
  x: number;
  y: number;
  constructor(x?: number, y?: number);
}

export class Point {
  x: number;
  y: number;
  constructor(x?: number, y?: number);
}

export class Polygon {
  points: any[];
  constructor(points?: any[]);
}

export class Color {}
export class Body {}
export class Tween {}
export class TimerEvent {}

export class Circle {
  x: number;
  y: number;
  r: number;
  constructor(x: number, y: number, r: number);
  static Contains(circle: any, pointX: number, pointY: number): boolean;
}

export class Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
  constructor(x: number, y: number, width: number, height: number);
  static Intersection(rectA: any, rectB: any): Rectangle;
  static Overlaps(rectA: any, rectB: any): boolean;
}

export const Scale: {
  RESIZE: string;
};

export const MathUtils: {
  Between: (min?: number, max?: number) => number;
  Distance: {
    Between: () => number;
    Squared: () => number;
  };
  Angle: {
    Between: () => number;
  };
  Vector2: typeof Vector2;
};

export const Geom: {
  Circle: typeof Circle;
  Rectangle: typeof Rectangle;
  Point: typeof Point;
  Polygon: typeof Polygon;
};

export const Types: {
  // add any Phaser.Types mocks your code uses
};

export const Scenes: {
  Events: {
    SHUTDOWN: string;
  };
};

export const Display: {
  Color: typeof Color;
};

export const Input: {
  Keyboard: {
    KeyCodes: Record<string, any>;
  };
};

export const Physics: {
  Arcade: {
    Body: typeof Body;
  };
};

export const Tweens: {
  Tween: typeof Tween;
};

export const Time: {
  TimerEvent: typeof TimerEvent;
};

export const GameObjects: {
  Container: typeof Container;
  Sprite: typeof Sprite;
  Image: typeof Image;
  GameObject: typeof Container;
  Text: typeof Text;
  Graphics: typeof Graphics;
  Group: typeof Group;
  LightsManager: typeof LightsManager;
  Zone: typeof Zone;
};

export const Phaser: {
  Game: typeof Game;
  GameObjects: typeof GameObjects;
  Scene: typeof Scene;
  Scenes: typeof Scenes;
  Geom: typeof Geom;
  Scale: typeof Scale;
  Math: typeof MathUtils;
  Display: typeof Display;
  Input: typeof Input;
  Physics: typeof Physics;
  Tweens: typeof Tweens;
  Time: typeof Time;
  Types: typeof Types;
};

/**
 * Creates a generic mock scene with common properties
 * @param overrides - Properties to override in the mock scene
 * @returns Mock scene object
 */
export function createMockScene(overrides?: any): any;

export default Phaser;
