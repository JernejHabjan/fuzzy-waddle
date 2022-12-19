export enum AnimDirectionEnum {
  north = 'north',
  east = 'east',
  south = 'south',
  west = 'west'
}

export enum LPCAnimTypeEnum {
  idle = 'idle',
  spellCast = 'spellCast',
  thrust = 'thrust',
  walk = 'walk',
  slash = 'slash',
  shoot = 'shoot',
  hurt = 'hurt'
}

export type AnimDirection =
  | AnimDirectionEnum.north
  | AnimDirectionEnum.west
  | AnimDirectionEnum.south
  | AnimDirectionEnum.east;

export type LPCAnimType =
  | LPCAnimTypeEnum.idle
  | LPCAnimTypeEnum.spellCast
  | LPCAnimTypeEnum.thrust
  | LPCAnimTypeEnum.walk
  | LPCAnimTypeEnum.slash
  | LPCAnimTypeEnum.shoot
  | LPCAnimTypeEnum.hurt;

export class AnimationHelper {
  constructor(private animationManager: Phaser.Animations.AnimationManager) {}

  createAnim(
    textureName: string,
    animName: LPCAnimType,
    dir: AnimDirection,
    frameIndexStart: number,
    frameCount: number,
    frameRate: number = 8
  ) {
    this.animationManager.create({
      key: `${animName}-${dir}`,
      frames: this.animationManager.generateFrameNumbers(textureName, {
        start: frameIndexStart,
        end: frameIndexStart + frameCount - 1
      }),
      frameRate,
      repeat: -1
    });
  }

  createAnimationsForLPCSpriteSheet(textureName: string): [LPCAnimType, AnimDirection][] {
    // 1 frame
    this.createAnim(textureName, LPCAnimTypeEnum.idle, AnimDirectionEnum.north, 0, 1); // todo we need idle for every direction for every animType!!!
    this.createAnim(textureName, LPCAnimTypeEnum.idle, AnimDirectionEnum.west, 13, 1); // todo we need idle for every direction for every animType!!!
    this.createAnim(textureName, LPCAnimTypeEnum.idle, AnimDirectionEnum.south, 26, 1); // todo we need idle for every direction for every animType!!!
    this.createAnim(textureName, LPCAnimTypeEnum.idle, AnimDirectionEnum.east, 39, 1); // todo we need idle for every direction for every animType!!!

    // 7 frames
    this.createAnim(textureName, LPCAnimTypeEnum.spellCast, AnimDirectionEnum.north, 0, 7);
    this.createAnim(textureName, LPCAnimTypeEnum.spellCast, AnimDirectionEnum.west, 13, 7);
    this.createAnim(textureName, LPCAnimTypeEnum.spellCast, AnimDirectionEnum.south, 26, 7);
    this.createAnim(textureName, LPCAnimTypeEnum.spellCast, AnimDirectionEnum.east, 39, 7);

    // 8 frames
    this.createAnim(textureName, LPCAnimTypeEnum.thrust, AnimDirectionEnum.north, 52, 8);
    this.createAnim(textureName, LPCAnimTypeEnum.thrust, AnimDirectionEnum.west, 65, 8);
    this.createAnim(textureName, LPCAnimTypeEnum.thrust, AnimDirectionEnum.south, 78, 8);
    this.createAnim(textureName, LPCAnimTypeEnum.thrust, AnimDirectionEnum.east, 91, 8);

    // walk 9 frames
    this.createAnim(textureName, LPCAnimTypeEnum.walk, AnimDirectionEnum.north, 104, 9);
    this.createAnim(textureName, LPCAnimTypeEnum.walk, AnimDirectionEnum.west, 117, 9);
    this.createAnim(textureName, LPCAnimTypeEnum.walk, AnimDirectionEnum.south, 130, 9);
    this.createAnim(textureName, LPCAnimTypeEnum.walk, AnimDirectionEnum.east, 143, 9);

    // slash 6 frames
    this.createAnim(textureName, LPCAnimTypeEnum.slash, AnimDirectionEnum.north, 156, 6);
    this.createAnim(textureName, LPCAnimTypeEnum.slash, AnimDirectionEnum.west, 169, 6);
    this.createAnim(textureName, LPCAnimTypeEnum.slash, AnimDirectionEnum.south, 182, 6);
    this.createAnim(textureName, LPCAnimTypeEnum.slash, AnimDirectionEnum.east, 195, 6);

    // shoot 13 frames
    this.createAnim(textureName, LPCAnimTypeEnum.shoot, AnimDirectionEnum.north, 208, 13);
    this.createAnim(textureName, LPCAnimTypeEnum.shoot, AnimDirectionEnum.west, 221, 13);
    this.createAnim(textureName, LPCAnimTypeEnum.shoot, AnimDirectionEnum.south, 234, 13);
    this.createAnim(textureName, LPCAnimTypeEnum.shoot, AnimDirectionEnum.east, 247, 13);

    // hurt 6 frames
    // note that these frames are the same
    this.createAnim(textureName, LPCAnimTypeEnum.hurt, AnimDirectionEnum.north, 260, 6);
    this.createAnim(textureName, LPCAnimTypeEnum.hurt, AnimDirectionEnum.west, 260, 6);
    this.createAnim(textureName, LPCAnimTypeEnum.hurt, AnimDirectionEnum.south, 260, 6);
    this.createAnim(textureName, LPCAnimTypeEnum.hurt, AnimDirectionEnum.east, 260, 6);

    return [
      [LPCAnimTypeEnum.idle, AnimDirectionEnum.north],
      [LPCAnimTypeEnum.idle, AnimDirectionEnum.west],
      [LPCAnimTypeEnum.idle, AnimDirectionEnum.south],
      [LPCAnimTypeEnum.idle, AnimDirectionEnum.east],
      [LPCAnimTypeEnum.spellCast, AnimDirectionEnum.north],
      [LPCAnimTypeEnum.spellCast, AnimDirectionEnum.west],
      [LPCAnimTypeEnum.spellCast, AnimDirectionEnum.south],
      [LPCAnimTypeEnum.spellCast, AnimDirectionEnum.east],
      [LPCAnimTypeEnum.thrust, AnimDirectionEnum.north],
      [LPCAnimTypeEnum.thrust, AnimDirectionEnum.west],
      [LPCAnimTypeEnum.thrust, AnimDirectionEnum.south],
      [LPCAnimTypeEnum.thrust, AnimDirectionEnum.east],
      [LPCAnimTypeEnum.walk, AnimDirectionEnum.north],
      [LPCAnimTypeEnum.walk, AnimDirectionEnum.west],
      [LPCAnimTypeEnum.walk, AnimDirectionEnum.south],
      [LPCAnimTypeEnum.walk, AnimDirectionEnum.east],
      [LPCAnimTypeEnum.slash, AnimDirectionEnum.north],
      [LPCAnimTypeEnum.slash, AnimDirectionEnum.west],
      [LPCAnimTypeEnum.slash, AnimDirectionEnum.south],
      [LPCAnimTypeEnum.slash, AnimDirectionEnum.east],
      [LPCAnimTypeEnum.shoot, AnimDirectionEnum.north],
      [LPCAnimTypeEnum.shoot, AnimDirectionEnum.west],
      [LPCAnimTypeEnum.shoot, AnimDirectionEnum.south],
      [LPCAnimTypeEnum.shoot, AnimDirectionEnum.east],
      [LPCAnimTypeEnum.hurt, AnimDirectionEnum.north],
      [LPCAnimTypeEnum.hurt, AnimDirectionEnum.west],
      [LPCAnimTypeEnum.hurt, AnimDirectionEnum.south],
      [LPCAnimTypeEnum.hurt, AnimDirectionEnum.east]
    ];
  }

  playAnimation(sprite: Phaser.GameObjects.Sprite, animName: LPCAnimType, dir: AnimDirection) {
    sprite.play(`${animName}-${dir}`);
  }
}
