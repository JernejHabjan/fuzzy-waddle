import { GameInstance, type GameInstanceData } from "../game-instance";
import {
  LittleMuncherGameInstanceMetadata,
  type LittleMuncherGameInstanceMetadataData
} from "./game-instance-medatada";
import { LittleMuncherGameMode, type LittleMuncherGameModeData } from "./game-mode";
import { LittleMuncherGameState, type LittleMuncherGameStateData } from "./game-state";
import {
  LittleMuncherPlayer,
  LittleMuncherPlayerController,
  type LittleMuncherPlayerControllerData,
  LittleMuncherPlayerState,
  type LittleMuncherPlayerStateData
} from "./player";
import { LittleMuncherSpectator, type LittleMuncherSpectatorData } from "./spectator";
import { GameSessionState } from "../session";

export type LittleMuncherGameInstanceData = GameInstanceData<
  LittleMuncherGameInstanceMetadataData,
  LittleMuncherGameStateData,
  LittleMuncherGameModeData,
  LittleMuncherPlayerStateData,
  LittleMuncherPlayerControllerData,
  LittleMuncherSpectatorData
>;

export class LittleMuncherGameInstance extends GameInstance<
  LittleMuncherGameInstanceMetadataData,
  LittleMuncherGameInstanceMetadata,
  LittleMuncherGameStateData,
  LittleMuncherGameState,
  LittleMuncherGameModeData,
  LittleMuncherGameMode,
  LittleMuncherPlayerStateData,
  LittleMuncherPlayerControllerData,
  LittleMuncherPlayerState,
  LittleMuncherPlayerController,
  LittleMuncherPlayer,
  LittleMuncherSpectatorData,
  LittleMuncherSpectator
> {
  constructor(gameInstanceData?: LittleMuncherGameInstanceData) {
    super(
      {
        gameInstanceMetadata: LittleMuncherGameInstanceMetadata,
        gameMode: LittleMuncherGameMode,
        gameState: LittleMuncherGameState,
        spectator: LittleMuncherSpectator,
        playerController: LittleMuncherPlayerController,
        player: LittleMuncherPlayer,
        playerState: LittleMuncherPlayerState
      },
      gameInstanceData
    );
  }

  initGame(gameModeData: LittleMuncherGameModeData) {
    this.gameMode = new LittleMuncherGameMode(gameModeData);
    this.gameState = new LittleMuncherGameState();
    this.gameInstanceMetadata.data.sessionState = GameSessionState.InProgress;
  }
}
