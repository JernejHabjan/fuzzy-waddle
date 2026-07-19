import type { Types } from "phaser";
import { FlySquasherScene } from "../fly-squasher-scene";
import { baseGameConfig } from "@fuzzy-waddle/platform-game-host/base-game.config";

export const flySquasherGameConfig: Types.Core.GameConfig = {
  ...baseGameConfig,
  scene: [FlySquasherScene],
  physics: {
    default: "arcade",
    arcade: {
      fps: 60
      // debug: !environment.production
    }
  },
  pixelArt: true,
  backgroundColor: "#D1C4E9"
};
