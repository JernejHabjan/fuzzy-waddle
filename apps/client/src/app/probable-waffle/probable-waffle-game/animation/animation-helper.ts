export enum AnimDirectionEnum {
  north = 'north',
  east = 'east',
  south = 'south',
  west = 'west'
}

export enum LPCAnimTypeEnum {
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
  | LPCAnimTypeEnum.spellCast
  | LPCAnimTypeEnum.thrust
  | LPCAnimTypeEnum.walk
  | LPCAnimTypeEnum.slash
  | LPCAnimTypeEnum.shoot
  | LPCAnimTypeEnum.hurt;

export class AnimationHelper {
  constructor(private animationManager: Phaser.Animations.AnimationManager) {}

  static playAnimation(sprite: Phaser.GameObjects.Sprite, animName: LPCAnimType, dir: AnimDirection, idle: boolean) {
    sprite.play(`${animName}-${dir}` + (idle ? '-idle' : ''));
  }

  private createAnim(
    textureName: string,
    animName: LPCAnimType,
    dir: AnimDirection,
    frameIndexStart: number,
    frameCount: number,
    generateIdle:
      | false
      | {
          frame: number;
        },
    frameRate: number = 8
  ) {
    if (generateIdle !== false) {
      this.animationManager.create({
        key: `${animName}-${dir}-idle`,
        frames: this.animationManager.generateFrameNumbers(textureName, {
          start: generateIdle.frame,
          end: generateIdle.frame
        }),
        frameRate,
        repeat: -1
      });
    }
    this.animationManager.create({
      key: `${animName}-${dir}`,
      frames: this.animationManager.generateFrameNumbers(textureName, {
        start: frameIndexStart,
        end: frameIndexStart + frameCount - 1
      }),
      frameRate
      // repeat: 1
    });
  }

  createAnimationsForLPCSpriteSheet(textureName: string): [LPCAnimType, AnimDirection][] {
    // 7 frames
    this.createAnim(textureName, LPCAnimTypeEnum.spellCast, AnimDirectionEnum.north, 0, 7, { frame: 0 });
    this.createAnim(textureName, LPCAnimTypeEnum.spellCast, AnimDirectionEnum.west, 13, 7, { frame: 13 });
    this.createAnim(textureName, LPCAnimTypeEnum.spellCast, AnimDirectionEnum.south, 26, 7, { frame: 26 });
    this.createAnim(textureName, LPCAnimTypeEnum.spellCast, AnimDirectionEnum.east, 39, 7, { frame: 39 });

    // 8 frames
    this.createAnim(textureName, LPCAnimTypeEnum.thrust, AnimDirectionEnum.north, 52, 8, { frame: 52 });
    this.createAnim(textureName, LPCAnimTypeEnum.thrust, AnimDirectionEnum.west, 65, 8, { frame: 65 });
    this.createAnim(textureName, LPCAnimTypeEnum.thrust, AnimDirectionEnum.south, 78, 8, { frame: 78 });
    this.createAnim(textureName, LPCAnimTypeEnum.thrust, AnimDirectionEnum.east, 91, 8, { frame: 91 });

    // walk 9 frames
    this.createAnim(textureName, LPCAnimTypeEnum.walk, AnimDirectionEnum.north, 104, 9, { frame: 104 });
    this.createAnim(textureName, LPCAnimTypeEnum.walk, AnimDirectionEnum.west, 117, 9, { frame: 117 });
    this.createAnim(textureName, LPCAnimTypeEnum.walk, AnimDirectionEnum.south, 130, 9, { frame: 130 });
    this.createAnim(textureName, LPCAnimTypeEnum.walk, AnimDirectionEnum.east, 143, 9, { frame: 143 });

    // slash 6 frames
    this.createAnim(textureName, LPCAnimTypeEnum.slash, AnimDirectionEnum.north, 156, 6, { frame: 156 });
    this.createAnim(textureName, LPCAnimTypeEnum.slash, AnimDirectionEnum.west, 169, 6, { frame: 169 });
    this.createAnim(textureName, LPCAnimTypeEnum.slash, AnimDirectionEnum.south, 182, 6, { frame: 182 });
    this.createAnim(textureName, LPCAnimTypeEnum.slash, AnimDirectionEnum.east, 195, 6, { frame: 195 });

    // shoot 13 frames
    this.createAnim(textureName, LPCAnimTypeEnum.shoot, AnimDirectionEnum.north, 208, 13, { frame: 208 });
    this.createAnim(textureName, LPCAnimTypeEnum.shoot, AnimDirectionEnum.west, 221, 13, { frame: 221 });
    this.createAnim(textureName, LPCAnimTypeEnum.shoot, AnimDirectionEnum.south, 234, 13, { frame: 234 });
    this.createAnim(textureName, LPCAnimTypeEnum.shoot, AnimDirectionEnum.east, 247, 13, { frame: 247 });

    // hurt 6 frames
    // note that these frames are the same
    this.createAnim(textureName, LPCAnimTypeEnum.hurt, AnimDirectionEnum.north, 260, 6, { frame: 260 + 6 - 1 });
    this.createAnim(textureName, LPCAnimTypeEnum.hurt, AnimDirectionEnum.west, 260, 6, { frame: 260 + 6 - 1 });
    this.createAnim(textureName, LPCAnimTypeEnum.hurt, AnimDirectionEnum.south, 260, 6, { frame: 260 + 6 - 1 });
    this.createAnim(textureName, LPCAnimTypeEnum.hurt, AnimDirectionEnum.east, 260, 6, { frame: 260 + 6 - 1 });

    return [
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

}
