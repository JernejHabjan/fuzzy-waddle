import { AnimationsLizard, AssetsDungeon } from "../assets";

const createLizardAnims = (anims: Phaser.Animations.AnimationManager) => {
  anims.create({
    key: AnimationsLizard.idle,
    frames: anims.generateFrameNames(AssetsDungeon.lizard, {
      start: 0,
      end: 3,
      prefix: "lizard_m_idle_anim_f",
      suffix: ".png"
    }),
    repeat: -1,
    frameRate: 15
  });
  anims.create({
    key: AnimationsLizard.run,
    frames: anims.generateFrameNames(AssetsDungeon.lizard, {
      start: 0,
      end: 3,
      prefix: "lizard_m_run_anim_f",
      suffix: ".png"
    }),
    repeat: -1,
    frameRate: 15
  });
};
export { createLizardAnims };
