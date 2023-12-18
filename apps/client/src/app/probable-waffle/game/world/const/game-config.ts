import { environment } from "../../../../../environments/environment";
import { Types } from "phaser";
import { baseGameConfig } from "../../../../shared/game/base-game.config";
import MapRiverCrossing from "../../scenes/MapRiverCrossing";
import PreloadProbableWaffle from "../../scenes/PreloadProbableWaffle";
import { Boot } from "../../scenes/Boot";
import MapEmberEnclave from "../../scenes/MapEmberEnclave";

export const probableWaffleGameConfig: Types.Core.GameConfig = {
  ...baseGameConfig,
  // scene: [GrasslandScene, PlaygroundScene],
  scene: [Boot, PreloadProbableWaffle, MapRiverCrossing, MapEmberEnclave],
  physics: {
    default: "arcade",
    arcade: {
      fps: 60,
      gravity: { y: 0 },
      debug: !environment.production
    }
  },
  pixelArt: true,
  backgroundColor: "#222"
};
