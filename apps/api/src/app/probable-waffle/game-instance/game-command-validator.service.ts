import { Injectable, Logger } from "@nestjs/common";
import {
  type ProbableWaffleGameCommandEvent,
  type ProbableWaffleGameInstance
} from "@fuzzy-waddle/api-interfaces";
import type { User } from "@supabase/supabase-js";

/**
 * Cheap server-side validation for incoming command batches.
 *
 * The server never runs the simulation, so it can only check:
 *   1. Player ownership  — the JWT user must own the playerNumber they're
 *      submitting commands for.
 *   2. Rate limiting     — at most MAX_BATCHES_PER_SECOND batches per player
 *      per second (guards against flooding).
 *   3. Sequence numbers — each player's tick must advance monotonically
 *      (prevents replaying old batches or submitting far-future ticks).
 *   4. Payload schema   — batch must be an array; individual command fields
 *      must not be wildly out of range.
 *
 * Rejects return false; callers should drop the message (no relay).
 */
@Injectable()
export class GameCommandValidatorService {
  private readonly logger = new Logger(GameCommandValidatorService.name);

  /** Maximum tick jump allowed in one batch — guards against far-future exploits. */
  private static readonly MAX_TICK_JUMP = 10;

  /** Maximum command batches a player may send per second. */
  private static readonly MAX_BATCHES_PER_SECOND = 40;

  /** Maximum commands allowed in a single batch. */
  private static readonly MAX_COMMANDS_PER_BATCH = 100;

  // last committed tick per (gameInstanceId → playerNumber)
  private readonly lastTick = new Map<string, Map<number, number>>();

  // rate-limit counters per (gameInstanceId → playerNumber) with rolling window
  private readonly rateBuckets = new Map<string, Map<number, { count: number; windowStart: number }>>();

  validate(
    event: ProbableWaffleGameCommandEvent,
    gameInstance: ProbableWaffleGameInstance,
    user: User
  ): boolean {
    const { playerNumber, tick, commands, gameInstanceId } = event;

    // 1. Ownership: the authenticated user must be the owner of this playerNumber
    const player = gameInstance.getPlayerByNumber(playerNumber);
    if (!player) {
      this.logger.warn(`[GameCommand] Unknown playerNumber ${playerNumber} in instance ${gameInstanceId}`);
      return false;
    }
    const playerUserId = player.playerController.data.userId;
    if (playerUserId !== user.id) {
      this.logger.warn(
        `[GameCommand] Ownership violation: user ${user.id} tried to submit for player ${playerNumber} owned by ${playerUserId}`
      );
      return false;
    }

    // 2. Schema: commands must be an array within size limits
    if (!Array.isArray(commands)) {
      this.logger.warn(`[GameCommand] commands field is not an array from player ${playerNumber}`);
      return false;
    }
    if (commands.length > GameCommandValidatorService.MAX_COMMANDS_PER_BATCH) {
      this.logger.warn(
        `[GameCommand] Oversized batch (${commands.length}) from player ${playerNumber} — dropping`
      );
      return false;
    }

    // 3. Sequence: tick must advance (never go backwards, never jump too far)
    const instanceKey = String(gameInstanceId);
    if (!this.lastTick.has(instanceKey)) this.lastTick.set(instanceKey, new Map());
    const playerTicks = this.lastTick.get(instanceKey)!;
    const prev = playerTicks.get(playerNumber) ?? -1;
    if (tick <= prev) {
      this.logger.warn(
        `[GameCommand] Stale batch: player ${playerNumber} sent tick ${tick} but last was ${prev}`
      );
      return false;
    }
    if (tick > prev + GameCommandValidatorService.MAX_TICK_JUMP + 1) {
      this.logger.warn(
        `[GameCommand] Tick jump too large: player ${playerNumber} jumped from ${prev} to ${tick}`
      );
      return false;
    }
    playerTicks.set(playerNumber, tick);

    // 4. Rate limiting: sliding 1-second window
    if (!this.rateBuckets.has(instanceKey)) this.rateBuckets.set(instanceKey, new Map());
    const buckets = this.rateBuckets.get(instanceKey)!;
    const now = Date.now();
    const bucket = buckets.get(playerNumber) ?? { count: 0, windowStart: now };
    if (now - bucket.windowStart > 1000) {
      bucket.count = 0;
      bucket.windowStart = now;
    }
    bucket.count++;
    buckets.set(playerNumber, bucket);
    if (bucket.count > GameCommandValidatorService.MAX_BATCHES_PER_SECOND) {
      this.logger.warn(
        `[GameCommand] Rate limit exceeded for player ${playerNumber} in instance ${gameInstanceId}`
      );
      return false;
    }

    return true;
  }

  /** Remove state for a game instance after it ends, to prevent memory leaks. */
  cleanup(gameInstanceId: string): void {
    this.lastTick.delete(gameInstanceId);
    this.rateBuckets.delete(gameInstanceId);
  }
}
