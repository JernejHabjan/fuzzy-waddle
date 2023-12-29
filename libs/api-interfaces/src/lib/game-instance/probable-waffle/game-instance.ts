import { GameInstance, GameInstanceData, GameInstanceDataDto } from "../game-instance";
import { ProbableWaffleGameInstanceMetadata, ProbableWaffleGameInstanceMetadataData } from "./game-instance-medatada";
import { ProbableWaffleGameMode, ProbableWaffleGameModeData } from "./game-mode";
import { ProbableWaffleGameState, ProbableWaffleGameStateData } from "./game-state";
import {
  ProbableWafflePlayer,
  ProbableWafflePlayerController,
  ProbableWafflePlayerControllerData,
  ProbableWafflePlayerState,
  ProbableWafflePlayerStateData
} from "./player";
import { ProbableWaffleSpectator, ProbableWaffleSpectatorData } from "./spectator";

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
}

export interface ProbableWaffleJoinDto extends GameInstanceDataDto {
  gameInstanceId: string;
  type: "player" | "spectator";
}

export interface ProbableWaffleLeaveDto extends GameInstanceDataDto {
  gameInstanceId: string;
}
