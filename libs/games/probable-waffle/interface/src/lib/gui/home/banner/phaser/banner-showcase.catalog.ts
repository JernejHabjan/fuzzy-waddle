import type { BannerCharacterConfig } from "./banner-showcase.models";

const CHARACTER_FRAME_64 = {
  frameWidth: 64,
  frameHeight: 64,
  startFrame: 0,
  endFrame: -1,
  spacing: 0,
  margin: 0
} as const;

export const bannerShowcaseCatalog: BannerCharacterConfig[] = [
  {
    id: "general-warrior",
    textureKey: "warrior_idle",
    frame: 4,
    idleAnimationKey: "general_warrior_idle_down",
    originY: 0.9,
    scaleMultiplier: 1.75,
    files: [
      {
        type: "spritesheet",
        key: "warrior_idle",
        url: "assets/probable-waffle/spritesheets/characters/general/warrior/warrior_idle.png",
        frameConfig: CHARACTER_FRAME_64
      },
      {
        type: "animation",
        key: "warrior_anim",
        url: "assets/probable-waffle/spritesheets/characters/general/warrior/warrior_anim.json"
      }
    ]
  },
  {
    id: "tivara-worker-male",
    textureKey: "base_idle_3",
    frame: 4,
    idleAnimationKey: "tivara_worker_male_base_idle_2",
    originY: 0.9,
    scaleMultiplier: 1.75,
    files: [
      {
        type: "spritesheet",
        key: "base_idle_3",
        url: "assets/probable-waffle/spritesheets/characters/tivara/worker_male/base_idle.png",
        frameConfig: CHARACTER_FRAME_64
      },
      {
        type: "animation",
        key: "tivara_worker_male_anims",
        url: "assets/probable-waffle/spritesheets/characters/tivara/worker_male/tivara_worker_male_anims.json"
      }
    ]
  },
  {
    id: "skaduwee-worker-female",
    textureKey: "base_idle",
    frame: 4,
    idleAnimationKey: "skaduwee_worker_female_base_idle_2",
    originY: 0.9,
    scaleMultiplier: 1.75,
    files: [
      {
        type: "spritesheet",
        key: "base_idle",
        url: "assets/probable-waffle/spritesheets/characters/skaduwee/worker_female/base_idle.png",
        frameConfig: CHARACTER_FRAME_64
      },
      {
        type: "animation",
        key: "skaduwee_worker_female_anims",
        url: "assets/probable-waffle/spritesheets/characters/skaduwee/worker_female/skaduwee_worker_female_anims.json"
      }
    ]
  }
];
