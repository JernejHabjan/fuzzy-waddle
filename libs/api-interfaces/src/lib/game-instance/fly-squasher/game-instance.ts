import { GameInstance, GameInstanceData } from "../game-instance";
import { FlySquasherGameInstanceMetadata, FlySquasherGameInstanceMetadataData } from "./game-instance-medatada";
import { FlySquasherGameMode, FlySquasherGameModeData } from "./game-mode";
import { FlySquasherGameState, FlySquasherGameStateData } from "./game-state";
import {
  FlySquasherPlayer,
  FlySquasherPlayerController,
  FlySquasherPlayerControllerData,
  FlySquasherPlayerState,
  FlySquasherPlayerStateData
} from "./player";
import { FlySquasherSpectator, FlySquasherSpectatorData } from "./spectator";

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
