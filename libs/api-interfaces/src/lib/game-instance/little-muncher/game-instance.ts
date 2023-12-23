import { GameInstance, GameInstanceData } from "../game-instance";
import { LittleMuncherGameInstanceMetadata, LittleMuncherGameInstanceMetadataData } from "./game-instance-medatada";
import { LittleMuncherGameMode, LittleMuncherGameModeData } from "./game-mode";
import { LittleMuncherGameState, LittleMuncherGameStateData } from "./game-state";
import {
  LittleMuncherPlayer,
  LittleMuncherPlayerController,
  LittleMuncherPlayerControllerData,
  LittleMuncherPlayerState,
  LittleMuncherPlayerStateData
} from "./player";
import { LittleMuncherSpectator, LittleMuncherSpectatorData } from "./spectator";
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
    if (!this.gameMode || !this.gameInstanceMetadata)
      throw new Error("Game mode or game instance metadata is not initialized");
    this.gameMode.data = gameModeData;
    this.gameInstanceMetadata.data.sessionState = GameSessionState.InProgress;
  }
}
