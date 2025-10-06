import { BaseScene } from "../../../shared/game/phaser/scene/base.scene";
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
} from "@fuzzy-waddle/api-interfaces";
import { ProbableWaffleCommunicatorService } from "../../communicators/probable-waffle-communicator.service";
import { BehaviorSubject } from "rxjs";
import { type ProbableWaffleSceneData } from "../world/scenes/GameProbableWaffleScene";

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
  ProbableWaffleCommunicatorService
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
