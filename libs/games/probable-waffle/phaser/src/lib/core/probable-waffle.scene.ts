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
  ProbableWafflePlayerType,
  ProbableWaffleGameInstanceType,
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
  /** Offline AI and human slots share null user IDs; only the restored local human slot owns input. */
  override get playerOrNull(): ProbableWafflePlayer | null {
    if (this.baseGameData.user.userId) return super.playerOrNull;
    const type = this.baseGameData.gameInstance.gameInstanceMetadata.data.type;
    const local = [
      ProbableWaffleGameInstanceType.Skirmish,
      ProbableWaffleGameInstanceType.Campaign,
      ProbableWaffleGameInstanceType.InstantGame
    ].includes(type);
    if (!local || this.baseGameData.user.playerNumber === undefined) return null;
    return (
      this.players.find(
        (player) =>
          player.playerNumber === this.baseGameData.user.playerNumber &&
          player.playerController.data.playerDefinition?.playerType === ProbableWafflePlayerType.Human
      ) ?? null
    );
  }

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
