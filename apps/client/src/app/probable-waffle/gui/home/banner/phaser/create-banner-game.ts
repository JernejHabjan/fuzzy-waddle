import Phaser from "phaser";
import { baseGameConfig } from "../../../../../shared/game/base-game.config";
import { BannerScene } from "./banner-scene";

export function createBannerGame(parent: HTMLElement): Phaser.Game {
  const config: Phaser.Types.Core.GameConfig = {
    ...baseGameConfig,
    type: Phaser.AUTO,
    width: 300,
    height: window.innerHeight,
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
