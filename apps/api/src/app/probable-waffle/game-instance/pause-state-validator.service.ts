import { Injectable, Logger } from "@nestjs/common";
import {
  type ProbableWaffleGameInstance,
  type ProbableWafflePauseChangedEvent
} from "@fuzzy-waddle/api-interfaces";
import type { User } from "@supabase/supabase-js";

@Injectable()
export class PauseStateValidatorService {
  private readonly logger = new Logger(PauseStateValidatorService.name);
  private static readonly MIN_PAUSE_INTERVAL_MS = 60_000;
  private static readonly MAX_PAUSES_PER_MATCH = 3;

  private readonly playerPauseState = new Map<
    string,
    Map<number, { pauseCount: number; lastPauseAt: number }>
  >();
  private readonly currentPauseState = new Map<string, boolean>();

  validate(event: ProbableWafflePauseChangedEvent, gameInstance: ProbableWaffleGameInstance, user: User): boolean {
    const player = gameInstance.getPlayerByNumber(event.playerNumber);
    if (!player) {
      this.logger.warn(`[Pause] Unknown playerNumber ${event.playerNumber} in ${event.gameInstanceId}`);
      return false;
    }

    if (player.playerController.data.userId !== user.id) {
      this.logger.warn(
        `[Pause] Ownership violation: user ${user.id} tried to pause/resume for player ${event.playerNumber}`
      );
      return false;
    }

    const currentlyPaused = this.currentPauseState.get(event.gameInstanceId) ?? false;
    if (event.paused === currentlyPaused) {
      this.logger.warn(
        `[Pause] Duplicate pause state ${event.paused ? "pause" : "resume"} from player ${event.playerNumber}`
      );
      return false;
    }

    if (event.paused) {
      const instanceState = this.getPlayerState(event.gameInstanceId, event.playerNumber);
      const now = Date.now();
      if (instanceState.pauseCount >= PauseStateValidatorService.MAX_PAUSES_PER_MATCH) {
        this.logger.warn(`[Pause] Player ${event.playerNumber} exhausted pause limit in ${event.gameInstanceId}`);
        return false;
      }
      if (now - instanceState.lastPauseAt < PauseStateValidatorService.MIN_PAUSE_INTERVAL_MS) {
        this.logger.warn(`[Pause] Player ${event.playerNumber} hit pause cooldown in ${event.gameInstanceId}`);
        return false;
      }

      instanceState.pauseCount++;
      instanceState.lastPauseAt = now;
    }

    this.currentPauseState.set(event.gameInstanceId, event.paused);
    return true;
  }

  cleanup(gameInstanceId: string): void {
    this.playerPauseState.delete(gameInstanceId);
    this.currentPauseState.delete(gameInstanceId);
  }

  private getPlayerState(gameInstanceId: string, playerNumber: number): { pauseCount: number; lastPauseAt: number } {
    let instanceState = this.playerPauseState.get(gameInstanceId);
    if (!instanceState) {
      instanceState = new Map();
      this.playerPauseState.set(gameInstanceId, instanceState);
    }

    let playerState = instanceState.get(playerNumber);
    if (!playerState) {
      playerState = {
        pauseCount: 0,
        lastPauseAt: 0
      };
      instanceState.set(playerNumber, playerState);
    }

    return playerState;
  }
}
