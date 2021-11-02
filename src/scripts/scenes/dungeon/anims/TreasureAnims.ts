import { AnimationsChest, AssetsDungeon } from "../assets";

const createTreasureAnims = (anims: Phaser.Animations.AnimationManager) => {
  anims.create({
    key: AnimationsChest.open,
    frames: anims.generateFrameNames(AssetsDungeon.treasure, {
      start: 0,
      end: 2,
      prefix: "chest_empty_open_anim_f",
      suffix: ".png"
    }),
    frameRate: 5
  });
  anims.create({
    key: AnimationsChest.close,
    frames: [{ key: AssetsDungeon.treasure, frame: "chest_empty_open_anim_f0.png" }]
  });
};

export { createTreasureAnims };
