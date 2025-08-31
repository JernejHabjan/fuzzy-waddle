import { environment } from "../../../../../environments/environment";
import type { Types } from "phaser";
import { baseGameConfig } from "../../../../shared/game/base-game.config";
import MapRiverCrossing from "../../scenes/game-maps/MapRiverCrossing";
import PreloadProbableWaffle from "../../scenes/preload-scenes/PreloadProbableWaffle";
import { Boot } from "../../scenes/preload-scenes/Boot";
import MapEmberEnclave from "../../scenes/game-maps/MapEmberEnclave";
import HudProbableWaffle from "../../scenes/hud-scenes/HudProbableWaffle";
import GameActionsLayer from "../../scenes/hud-scenes/GameActionsLayer";
import MapSandbox from "../../scenes/game-maps/MapSandbox";

export const probableWaffleGameConfig: Types.Core.GameConfig = {
  ...baseGameConfig,
  // scene: [GrasslandScene, PlaygroundScene],
  scene: [
    Boot,
    PreloadProbableWaffle,
    MapSandbox,
    MapRiverCrossing,
    MapEmberEnclave,
    HudProbableWaffle,
    GameActionsLayer
  ],
  physics: {
    default: "arcade",
    arcade: {
      fps: 60,
      debug: !environment.production
    }
  },
  pixelArt: true,
  backgroundColor: "#222",
  plugins: {
    global: [
      // ...(OwnerComponent.useColorReplace
      //   ? [
      //       {
      //         key: Plugins.RexColorReplacePipeline,
      //         plugin: ColorReplacePipelinePlugin,
      //         start: true
      //       }
      //     ]
      //   : [])
    ]
  }
};
