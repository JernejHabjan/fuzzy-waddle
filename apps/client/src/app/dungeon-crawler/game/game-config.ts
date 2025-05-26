import DungeonPreloader from "./scenes/DungeonPreloader";
import Dungeon from "./scenes/Dungeon";
import DungeonUi from "./scenes/DungeonUi";
import { baseGameConfig } from "../../shared/game/base-game.config";
import VirtualJoystickPlugin from "phaser3-rex-plugins/plugins/virtualjoystick-plugin.js";

export const dungeonCrawlerGameConfig: Phaser.Types.Core.GameConfig = {
  ...baseGameConfig,
  width: window.innerWidth / 2,
  height: window.innerHeight / 2,
  physics: {
    default: "arcade",
    arcade: {
      debug: false
    }
  },
  pixelArt: true,
  scale: {
    zoom: 2,
    mode: Phaser.Scale.CENTER_BOTH
  },
  plugins: {
    global: [
      {
        key: "rexVirtualJoystick",
        plugin: VirtualJoystickPlugin,
        start: true
      }
    ]
  },
  scene: [DungeonPreloader, Dungeon, DungeonUi]
};
