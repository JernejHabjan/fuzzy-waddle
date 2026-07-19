import { AnimationsFaune, AssetsDungeon } from "../assets";

const createCharacterAnims = (anims: Phaser.Animations.AnimationManager) => {
  const createIdleAnim = (keyName: string, frameName: string) => {
    anims.create({
      key: keyName,
      frames: [{ key: AssetsDungeon.faune, frame: frameName + ".png" }]
    });
  };

  const createFaintAnim = (prefix: string, keyName: AnimationsFaune) => {
    anims.create({
      key: keyName,
      frames: anims.generateFrameNames(AssetsDungeon.faune, {
        start: 1,
        end: 4,
        prefix: prefix + "-",
        suffix: ".png"
      }),
      frameRate: 15
    });
  };

  const createMovingAnim = (prefix: string, keyName: AnimationsFaune) => {
    anims.create({
      key: keyName,
      frames: anims.generateFrameNames(AssetsDungeon.faune, {
        start: 1,
        end: 8,
        prefix: prefix + "-",
        suffix: ".png"
      }),
      repeat: -1,
      frameRate: 15
    });
  };
  createIdleAnim(AnimationsFaune.idleDown, "walk-down-3");
  createIdleAnim(AnimationsFaune.idleUp, "walk-up-3");
  createIdleAnim(AnimationsFaune.idleSide, "walk-side-3");

  createMovingAnim("run-down", AnimationsFaune.runDown);
  createMovingAnim("run-up", AnimationsFaune.runUp);
  createMovingAnim("run-side", AnimationsFaune.runSide);

  createFaintAnim("faint", AnimationsFaune.faint);
};

export { createCharacterAnims };
