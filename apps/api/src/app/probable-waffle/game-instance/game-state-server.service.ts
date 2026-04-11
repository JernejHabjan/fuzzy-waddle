import { Injectable } from "@nestjs/common";
import {
  type CommunicatorEvent,
  GameSessionState,
  type ProbableWaffleCommunicatorType,
  type ProbableWaffleGameCommandEvent,
  type ProbableWaffleGameInstanceMetadataChangeEvent,
  type ProbableWaffleGameModeDataChangeEvent,
  type ProbableWaffleGameStateDataChangeEvent,
  ProbableWaffleListeners,
  type ProbableWafflePlayerDataChangeEvent,
  type ProbableWaffleSpectatorDataChangeEvent
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceService } from "./game-instance.service";
import { type User } from "@supabase/supabase-js";
import { GameCommandValidatorService } from "./game-command-validator.service";

@Injectable()
export class GameStateServerService {
  constructor(
    private readonly gameInstanceService: GameInstanceService,
    private readonly commandValidator: GameCommandValidatorService
  ) {}

  updateGameState(body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>, user: User): boolean {
    const gameInstance = this.gameInstanceService.findGameInstance(body.gameInstanceId!);
    if (!gameInstance) {
      console.log("game instance not found in updateGameState in GameStateServerService");
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
                this.gameInstanceService.stopGameInstance(body.gameInstanceId!, user);
                // Clean up per-instance validator state
                this.commandValidator.cleanup(String(body.gameInstanceId));
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
      case "game-command":
        const cmdEvent = body.payload as ProbableWaffleGameCommandEvent;
        // Validate ownership, rate limits, and sequence before relaying
        return this.commandValidator.validate(cmdEvent, gameInstance, user);
      case "state-hash":
        // No server-side processing needed; relay to all peers as-is.
        return true;
      default:
        throw new Error("Unknown communicator");
    }
    return true;
  }
}
