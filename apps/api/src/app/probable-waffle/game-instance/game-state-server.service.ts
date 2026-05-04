import { Injectable, Logger } from "@nestjs/common";
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
import { GameCommandValidatorService, type GameCommandValidationResult } from "./game-command-validator.service";
import { PlayerStateValidatorService } from "./player-state-validator.service";
import { PauseStateValidatorService } from "./pause-state-validator.service";

/**
 * Result of a game-state update.
 *
 * - `{ success: true }` — state updated; relay the event to peers.
 * - `{ success: false, relayEmpty: true, rejectionReason }` — tick is
 *   authoritative but payload was invalid; relay an empty batch so the
 *   lockstep barrier can advance without freeze.
 * - `{ success: false, relayEmpty: false }` — security/protocol violation;
 *   drop the message entirely (no relay).
 */
export type UpdateGameStateResult =
  | { success: true }
  | { success: false; relayEmpty: false }
  | { success: false; relayEmpty: true; rejectionReason: string };

@Injectable()
export class GameStateServerService {
  // 1024 batches ≈ ~51 seconds at 20 ticks/s — enough to cover the full reconnect grace window.
  private static readonly COMMAND_HISTORY_LIMIT = 1024;
  private readonly recentCommandHistory = new Map<string, ProbableWaffleGameCommandEvent[]>();
  private readonly logger = new Logger(GameStateServerService.name);

  constructor(
    private readonly gameInstanceService: GameInstanceService,
    private readonly commandValidator: GameCommandValidatorService,
    private readonly playerStateValidator: PlayerStateValidatorService,
    private readonly pauseStateValidator: PauseStateValidatorService
  ) {}

  updateGameState(body: CommunicatorEvent<any, ProbableWaffleCommunicatorType>, user: User): UpdateGameStateResult {
    const gameInstance = this.gameInstanceService.findGameInstance(body.gameInstanceId!);
    if (!gameInstance) {
      console.warn(
        `[GameStateServer] Missing game instance for communicator=${body.communicator} ` +
          `gameInstanceId=${body.gameInstanceId} user=${user.id}. ` +
          `Open instances: ${this.gameInstanceService.getOpenGameInstanceIds().join(",") || "none"}`
      );
      return { success: false, relayEmpty: false };
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
          return { success: false, relayEmpty: false };
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
      case "game-command": {
        const cmdEvent = body.payload as ProbableWaffleGameCommandEvent;
        const validationResult: GameCommandValidationResult = this.commandValidator.validate(cmdEvent, gameInstance, user);
        if (!validationResult.valid) {
          if (validationResult.relayEmpty) {
            // Tick is authoritative but payload failed — record an empty batch
            // in command history so reconnecting clients don't stall on a missing tick.
            this.recordCommand({ ...cmdEvent, commands: [] });
            return { success: false, relayEmpty: true, rejectionReason: validationResult.reason };
          }
          // Security/sequence violation — drop entirely.
          return { success: false, relayEmpty: false };
        }
        this.recordCommand(cmdEvent);
        return { success: true };
      }
      case "state-hash":
        // No server-side processing needed; relay to all peers as-is.
        break;
      case "snapshot-request":
        // Request is relayed to all peers; the host will respond directly.
        // Server holds no snapshot state — routing only.
        break;
      case "snapshot-response":
        // Response is relayed to all peers (only the requester will consume it via userId filter).
        const snapshotResponse = body.payload as ProbableWaffleSnapshotResponseEvent;
        snapshotResponse.commandTail = this.getCommandTail(
          gameInstance.gameInstanceMetadata.data.gameInstanceId!,
          snapshotResponse.snapshot.tick
        );
        break;
      case "desync-alert":
        if (!this.validateDesyncAlert(body.payload as ProbableWaffleDesyncAlertEvent, gameInstance, user)) {
          return { success: false, relayEmpty: false };
        }
        break;
      case "pause-changed":
        if (!this.pauseStateValidator.validate(body.payload as ProbableWafflePauseChangedEvent, gameInstance, user)) {
          return { success: false, relayEmpty: false };
        }
        break;
      case "player-disconnected":
      case "player-reconnected":
      case "host-migrated":
        // Server-originated events — clients should never send these; return false to suppress relay.
        return { success: false, relayEmpty: false };
      default:
        throw new Error("Unknown communicator");
    }
    return { success: true };
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
      // History window exceeded — oldest batches are dropped. A reconnecting client
      // that rejoins after this point will receive an incomplete command tail.
      this.logger.warn(
        `[CommandHistory] History limit hit for gameInstance ${event.gameInstanceId} — oldest batches dropped`
      );
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
