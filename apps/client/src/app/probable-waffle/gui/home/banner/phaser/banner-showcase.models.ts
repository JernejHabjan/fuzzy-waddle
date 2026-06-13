import type Phaser from "phaser";

export type BannerAssetFile =
  | {
      type: "animation";
      key: string;
      url: string;
    }
  | {
      type: "image";
      key: string;
      url: string;
    }
  | {
      type: "multiatlas";
      key: string;
      url: string;
      path: string;
    }
  | {
      type: "spritesheet";
      key: string;
      url: string;
      frameConfig: Phaser.Types.Loader.FileTypes.ImageFrameConfig;
    };

export interface BannerCharacterConfig {
  id: string;
  files: BannerAssetFile[];
  textureKey: string;
  frame?: number | string;
  idleAnimationKey?: string;
  originY?: number;
  scaleMultiplier?: number;
}
