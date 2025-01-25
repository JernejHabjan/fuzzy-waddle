import { BaseScene } from "../../../shared/game/phaser/scene/base.scene";
import { ProbableWaffleGameData } from "../scenes/probable-waffle-game-data";
import {
  ProbableWaffleGameMode,
  ProbableWaffleGameModeData,
  ProbableWaffleGameState,
  ProbableWaffleGameStateData,
  ProbableWaffleLevels,
  ProbableWaffleMapData,
  ProbableWafflePlayer,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerStateData,
  ProbableWaffleSpectator,
  ProbableWaffleSpectatorData
} from "@fuzzy-waddle/api-interfaces";
import { ProbableWaffleCommunicatorService } from "../../communicators/probable-waffle-communicator.service";
import { BehaviorSubject } from "rxjs";
import { ProbableWaffleSceneData } from "../scenes/GameProbableWaffleScene";

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
    return this.sceneGameData;
  }

  protected sceneGameData: ProbableWaffleSceneData = {
    baseGameData: this.baseGameData,
    systems: [],
    components: [],
    services: [],
    initializers: {
      sceneInitialized: new BehaviorSubject<boolean>(false),
      postSceneInitialized: new BehaviorSubject<boolean>(false)
    }
  } satisfies ProbableWaffleSceneData;

  get mapInfo(): ProbableWaffleMapData {
    return ProbableWaffleLevels[this.baseGameData.gameInstance.data.gameModeData!.map!];
  }
}
