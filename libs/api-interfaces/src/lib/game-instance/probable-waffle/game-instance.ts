import { GameInstance, type GameInstanceData, type GameInstanceDataDto } from "../game-instance";
import {
  ProbableWaffleGameInstanceMetadata,
  type ProbableWaffleGameInstanceMetadataData
} from "./game-instance-medatada";
import { ProbableWaffleGameMode, type ProbableWaffleGameModeData } from "./game-mode";
import { ProbableWaffleGameState, type ProbableWaffleGameStateData } from "./game-state";
import {
  ProbableWafflePlayer,
  ProbableWafflePlayerController,
  type ProbableWafflePlayerControllerData,
  ProbableWafflePlayerState,
  type ProbableWafflePlayerStateData
} from "./player";
import { ProbableWaffleSpectator, type ProbableWaffleSpectatorData } from "./spectator";

export type ProbableWaffleGameInstanceData = GameInstanceData<
  ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGameStateData,
  ProbableWaffleGameModeData,
  ProbableWafflePlayerStateData,
  ProbableWafflePlayerControllerData,
  ProbableWaffleSpectatorData
>;

export class ProbableWaffleGameInstance extends GameInstance<
  ProbableWaffleGameInstanceMetadataData,
  ProbableWaffleGameInstanceMetadata,
  ProbableWaffleGameStateData,
  ProbableWaffleGameState,
  ProbableWaffleGameModeData,
  ProbableWaffleGameMode,
  ProbableWafflePlayerStateData,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerState,
  ProbableWafflePlayerController,
  ProbableWafflePlayer,
  ProbableWaffleSpectatorData,
  ProbableWaffleSpectator
> {
  constructor(gameInstanceData?: ProbableWaffleGameInstanceData) {
    super(
      {
        gameInstanceMetadata: ProbableWaffleGameInstanceMetadata,
        gameMode: ProbableWaffleGameMode,
        gameState: ProbableWaffleGameState,
        spectator: ProbableWaffleSpectator,
        playerController: ProbableWafflePlayerController,
        player: ProbableWafflePlayer,
        playerState: ProbableWafflePlayerState
      },
      gameInstanceData
    );
  }

  removePlayerByData(controllerData: ProbableWafflePlayerControllerData) {
    if (!controllerData.playerDefinition) throw new Error("Player definition is required");
    const playerNumber = controllerData.playerDefinition.player.playerNumber;
    this.players = this.players.filter((p) => {
      if (!p.playerController.data.playerDefinition) throw new Error("Player definition is required");
      return p.playerNumber !== playerNumber;
    });
  }

  getPlayerByNumber(playerNumber: number) {
    return this.players.find((p) => {
      if (!p.playerController.data.playerDefinition) throw new Error("Player definition is required");
      return p.playerNumber === playerNumber;
    });
  }
}
