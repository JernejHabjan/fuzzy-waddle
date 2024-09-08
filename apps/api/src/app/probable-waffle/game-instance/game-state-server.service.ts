import { Injectable } from "@nestjs/common";
import {
  CommunicatorEvent,
  GameSessionState,
  ProbableWaffleCommunicatorType,
  ProbableWaffleGameInstanceMetadataChangeEvent,
  ProbableWaffleGameModeDataChangeEvent,
  ProbableWaffleGameStateDataChangeEvent,
  ProbableWaffleListeners,
  ProbableWafflePlayerDataChangeEvent,
  ProbableWaffleSpectatorDataChangeEvent
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceService } from "./game-instance.service";
import { User } from "@supabase/supabase-js";

@Injectable()
export class GameStateServerService {
  constructor(private readonly gameInstanceService: GameInstanceService) {}

  updateGameState(body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>, user: User): boolean {
    const gameInstance = this.gameInstanceService.findGameInstance(body.gameInstanceId);
    if (!gameInstance) {
      console.log("game instance not found");
      return false;
    }

    gameInstance.gameInstanceMetadata.data.updatedOn = new Date();

    switch (body.communicator) {
      case "gameInstanceMetadataDataChange":
        const giMetadata = body.payload as ProbableWaffleGameInstanceMetadataChangeEvent;
        ProbableWaffleListeners.gameInstanceMetadataChanged(gameInstance, giMetadata);
        switch (giMetadata.property) {
          case "sessionState":
            switch (giMetadata.data.sessionState) {
              case GameSessionState.Stopped:
                this.gameInstanceService.stopGameInstance(body.gameInstanceId, user);
                break;
            }
            break;
        }
        break;
      case "gameModeDataChange":
        const gmData = body.payload as ProbableWaffleGameModeDataChangeEvent;
        ProbableWaffleListeners.gameModeChanged(gameInstance, gmData);
        break;
      case "playerDataChange":
        const playerData = body.payload as ProbableWafflePlayerDataChangeEvent;
        ProbableWaffleListeners.playerChanged(gameInstance, playerData);
        break;
      case "spectatorDataChange":
        const spectatorData = body.payload as ProbableWaffleSpectatorDataChangeEvent;
        ProbableWaffleListeners.spectatorChanged(gameInstance, spectatorData);
        break;
      case "gameStateDataChange":
        const gameStateData = body.payload as ProbableWaffleGameStateDataChangeEvent;
        ProbableWaffleListeners.gameStateDataChanged(gameInstance, gameStateData);
        break;
      default:
        throw new Error("Unknown communicator");
    }
    return true;
  }
}
