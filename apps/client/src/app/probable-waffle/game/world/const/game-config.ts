import { environment } from "../../../../../environments/environment";
import type { Types } from "phaser";
import { baseGameConfig } from "../../../../shared/game/base-game.config";
import MapRiverCrossing from "../scenes/game-maps/MapRiverCrossing";
import PreloadProbableWaffle from "../scenes/preload-scenes/PreloadProbableWaffle";
import { Boot } from "../scenes/preload-scenes/Boot";
import MapEmberEnclave from "../scenes/game-maps/MapEmberEnclave";
import HudProbableWaffle from "../scenes/hud-scenes/HudProbableWaffle";
import GameActionsLayer from "../scenes/hud-scenes/GameActionsLayer";
import EndGameDialog from "../scenes/hud-scenes/EndGameDialog";
import ReconnectRecoveryDialog from "../scenes/hud-scenes/ReconnectRecoveryDialog";
import MapSandbox from "../scenes/game-maps/MapSandbox";
import SceneBootOverlayScene from "../scenes/preload-scenes/SceneBootOverlayScene";

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
    SceneBootOverlayScene,
    GameActionsLayer,
    EndGameDialog,
    ReconnectRecoveryDialog
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
