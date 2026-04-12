import { Injectable } from "@nestjs/common";
import {
  type CommunicatorEvent,
  GameSessionState,
  type ProbableWaffleCommunicatorType,
  type ProbableWaffleDesyncAlertEvent,
  type ProbableWaffleGameCommandEvent,
  type ProbableWaffleGameInstanceMetadataChangeEvent,
  type ProbableWaffleGameModeDataChangeEvent,
  type ProbableWafflePauseChangedEvent,
  type ProbableWaffleGameStateDataChangeEvent,
  ProbableWaffleListeners,
  type ProbableWafflePlayerDataChangeEvent,
  type ProbableWaffleSnapshotResponseEvent,
  type ProbableWaffleSpectatorDataChangeEvent
} from "@fuzzy-waddle/api-interfaces";
import { GameInstanceService } from "./game-instance.service";
import { type User } from "@supabase/supabase-js";
import { GameCommandValidatorService } from "./game-command-validator.service";
import { PlayerStateValidatorService } from "./player-state-validator.service";
import { PauseStateValidatorService } from "./pause-state-validator.service";

@Injectable()
export class GameStateServerService {
  private static readonly COMMAND_HISTORY_LIMIT = 256;
  private readonly recentCommandHistory = new Map<string, ProbableWaffleGameCommandEvent[]>();

  constructor(
    private readonly gameInstanceService: GameInstanceService,
    private readonly commandValidator: GameCommandValidatorService,
    private readonly playerStateValidator: PlayerStateValidatorService,
    private readonly pauseStateValidator: PauseStateValidatorService
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
                this.cleanup(String(body.gameInstanceId));
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
        if (!this.playerStateValidator.validate(playerData, gameInstance, user)) {
          return false;
        }
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
        if (!this.commandValidator.validate(cmdEvent, gameInstance, user)) {
          return false;
        }
        this.recordCommand(cmdEvent);
        return true;
      case "state-hash":
        // No server-side processing needed; relay to all peers as-is.
        return true;
      case "snapshot-request":
        // Request is relayed to all peers; the host will respond directly.
        // Server holds no snapshot state — routing only.
        return true;
      case "snapshot-response":
        // Response is relayed to all peers (only the requester will consume it via userId filter).
        const snapshotResponse = body.payload as ProbableWaffleSnapshotResponseEvent;
        snapshotResponse.commandTail = this.getCommandTail(
          gameInstance.gameInstanceMetadata.data.gameInstanceId!,
          snapshotResponse.snapshot.tick
        );
        return true;
      case "desync-alert":
        return this.validateDesyncAlert(body.payload as ProbableWaffleDesyncAlertEvent, gameInstance, user);
      case "pause-changed":
        return this.pauseStateValidator.validate(body.payload as ProbableWafflePauseChangedEvent, gameInstance, user);
      case "player-disconnected":
      case "player-reconnected":
      case "host-migrated":
        // Server-originated events — clients should never send these; return false to suppress relay.
        return false;
      default:
        throw new Error("Unknown communicator");
    }
    return true;
  }

  cleanup(gameInstanceId: string): void {
    this.commandValidator.cleanup(gameInstanceId);
    this.playerStateValidator.cleanup(gameInstanceId);
    this.pauseStateValidator.cleanup(gameInstanceId);
    this.recentCommandHistory.delete(gameInstanceId);
  }

  private recordCommand(event: ProbableWaffleGameCommandEvent): void {
    const history = this.recentCommandHistory.get(event.gameInstanceId) ?? [];
    history.push(structuredClone(event));
    if (history.length > GameStateServerService.COMMAND_HISTORY_LIMIT) {
      history.splice(0, history.length - GameStateServerService.COMMAND_HISTORY_LIMIT);
    }
    this.recentCommandHistory.set(event.gameInstanceId, history);
  }

  private getCommandTail(gameInstanceId: string, snapshotTick: number): ProbableWaffleGameCommandEvent[] {
    return (this.recentCommandHistory.get(gameInstanceId) ?? [])
      .filter((event) => event.tick > snapshotTick)
      .map((event) => structuredClone(event));
  }

  private validateDesyncAlert(
    event: ProbableWaffleDesyncAlertEvent,
    gameInstance: ReturnType<GameInstanceService["findGameInstance"]>,
    user: User
  ): boolean {
    const currentHostUserId = gameInstance?.gameInstanceMetadata.data.currentHostUserId ?? gameInstance?.gameInstanceMetadata.data.createdBy;
    if (currentHostUserId !== user.id) {
      return false;
    }

    return Number.isInteger(event.tick) && event.tick >= 0 && Number.isInteger(event.desyncedPlayerNumber);
  }
}
