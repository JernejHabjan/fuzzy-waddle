import { BaseScene } from "@fuzzy-waddle/platform-game-host/phaser/scene/base.scene";
import { type ProbableWaffleGameData } from "./probable-waffle-game-data";
import {
  ProbableWaffleGameMode,
  type ProbableWaffleGameModeData,
  ProbableWaffleGameState,
  type ProbableWaffleGameStateData,
  ProbableWaffleLevels,
  type ProbableWaffleMapData,
  ProbableWafflePlayer,
  type ProbableWafflePlayerControllerData,
  type ProbableWafflePlayerStateData,
  ProbableWaffleSpectator,
  type ProbableWaffleSpectatorData
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleCommunicatorServiceInterface } from "./ports/probable-waffle-communicator";
import { BehaviorSubject } from "rxjs";

import type { ProbableWaffleSceneData } from "../world/scenes/probable-waffle-scene-data";

export class ProbableWaffleScene extends BaseScene<
  ProbableWaffleGameData,
  ProbableWaffleGameStateData,
  ProbableWaffleGameState,
  ProbableWaffleGameModeData,
  ProbableWaffleGameMode,
  ProbableWafflePlayerStateData,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayer,
  ProbableWaffleSpectatorData,
  ProbableWaffleSpectator,
  ProbableWaffleCommunicatorServiceInterface
> {
  override getSceneGameData() {
    this.sceneGameData.baseGameData = this.baseGameData;
    return this.sceneGameData;
  }

  protected sceneGameData: ProbableWaffleSceneData = {
    baseGameData: this.baseGameData,
    systems: [],
    components: [],
    services: [],
    initializers: {
      sceneInitialized: new BehaviorSubject<boolean>(false)
    }
  } satisfies ProbableWaffleSceneData;

  get mapInfo(): ProbableWaffleMapData {
    return ProbableWaffleLevels[this.baseGameData.gameInstance.data.gameModeData!.map!];
  }
}
