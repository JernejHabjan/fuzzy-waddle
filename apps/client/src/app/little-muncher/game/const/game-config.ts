import type { Types } from "phaser";
import { LittleMuncherScene } from "../little-muncher-scene";
import { baseGameConfig } from "../../../shared/game/base-game.config";
import { LittleMuncherUiScene } from "../little-muncher-ui-scene";

export const littleMuncherGameConfig: Types.Core.GameConfig = {
  ...baseGameConfig,
  scene: [LittleMuncherScene, LittleMuncherUiScene],
  physics: {
    default: "arcade",
    arcade: {
      fps: 60
      // debug: !environment.production
    }
  },
  pixelArt: true,
  backgroundColor: "#8bc34a"
};
