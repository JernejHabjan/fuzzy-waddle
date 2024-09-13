import { environment } from "../../../../../environments/environment";
import { Types } from "phaser";
import { baseGameConfig } from "../../../../shared/game/base-game.config";
import MapRiverCrossing from "../../scenes/MapRiverCrossing";
import PreloadProbableWaffle from "../../scenes/PreloadProbableWaffle";
import { Boot } from "../../scenes/Boot";
import MapEmberEnclave from "../../scenes/MapEmberEnclave";
import HudProbableWaffle from "../../scenes/HudProbableWaffle";
import ColorReplacePipelinePlugin from "phaser3-rex-plugins/plugins/colorreplacepipeline-plugin";
import { Plugins } from "./Plugins";

export const probableWaffleGameConfig: Types.Core.GameConfig = {
  ...baseGameConfig,
  // scene: [GrasslandScene, PlaygroundScene],
  scene: [Boot, PreloadProbableWaffle, MapRiverCrossing, MapEmberEnclave, HudProbableWaffle],
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
      {
        key: Plugins.RexColorReplacePipeline,
        plugin: ColorReplacePipelinePlugin,
        start: true
      }
    ]
  }
};
