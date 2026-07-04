import Phaser from "phaser";
import { baseGameConfig } from "../../../../../shared/game/base-game.config";
import { BannerScene } from "./banner-scene";

export function createBannerGame(parent: HTMLElement): Phaser.Game {
  const parentHeight = Math.max(320, Math.floor(parent.getBoundingClientRect().height));
  const config: Phaser.Types.Core.GameConfig = {
    ...baseGameConfig,
    type: Phaser.AUTO,
    width: 300,
    height: parentHeight,
    scale: {
      mode: Phaser.Scale.NONE,
      width: 300,
      height: parentHeight
    },
    parent,
    transparent: true,
    pixelArt: true,
    fps: {
      forceSetTimeOut: true
    },
    render: {
      powerPreference: "low-power",
      antialias: false,
      pixelArt: true,
      roundPixels: true
    },
    scene: BannerScene
  };

  return new Phaser.Game(config);
}
