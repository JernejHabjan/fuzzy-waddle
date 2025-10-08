import { GameInstance, type GameInstanceData } from "../game-instance";
import { FlySquasherGameInstanceMetadata, type FlySquasherGameInstanceMetadataData } from "./game-instance-medatada";
import { FlySquasherGameMode, type FlySquasherGameModeData } from "./game-mode";
import { FlySquasherGameState, type FlySquasherGameStateData } from "./game-state";
import {
  FlySquasherPlayer,
  FlySquasherPlayerController,
  type FlySquasherPlayerControllerData,
  FlySquasherPlayerState,
  type FlySquasherPlayerStateData
} from "./player";
import { FlySquasherSpectator, type FlySquasherSpectatorData } from "./spectator";

export type FlySquasherGameInstanceData = GameInstanceData<
  FlySquasherGameInstanceMetadataData,
  FlySquasherGameStateData,
  FlySquasherGameModeData,
  FlySquasherPlayerStateData,
  FlySquasherPlayerControllerData,
  FlySquasherSpectatorData
>;

export class FlySquasherGameInstance extends GameInstance<
  FlySquasherGameInstanceMetadataData,
  FlySquasherGameInstanceMetadata,
  FlySquasherGameStateData,
  FlySquasherGameState,
  FlySquasherGameModeData,
  FlySquasherGameMode,
  FlySquasherPlayerStateData,
  FlySquasherPlayerControllerData,
  FlySquasherPlayerState,
  FlySquasherPlayerController,
  FlySquasherPlayer,
  FlySquasherSpectatorData,
  FlySquasherSpectator
> {
  constructor(gameInstanceData?: FlySquasherGameInstanceData) {
    super(
      {
        gameInstanceMetadata: FlySquasherGameInstanceMetadata,
        gameMode: FlySquasherGameMode,
        gameState: FlySquasherGameState,
        spectator: FlySquasherSpectator,
        playerController: FlySquasherPlayerController,
        player: FlySquasherPlayer,
        playerState: FlySquasherPlayerState
      },
      gameInstanceData
    );
  }
}
