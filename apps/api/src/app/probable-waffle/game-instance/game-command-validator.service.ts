import { Injectable, Logger } from "@nestjs/common";
import {
  type ActorDefinition,
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
  private static readonly ISO_HALF_TILE_WIDTH = 32;
  private static readonly ISO_HALF_TILE_HEIGHT = 16;
  private static readonly KNOWN_ORDER_TYPES = new Set([
    "Attack",
    "Build",
    "Gather",
    "Move",
    "ReturnResources",
    "Stop",
    "Repair",
    "Heal",
    "EnterContainer"
  ]);

  /** Maximum tick jump allowed in one batch — guards against far-future exploits. */
  private static readonly MAX_TICK_JUMP = 10;

  /** Maximum command batches a player may send per second. */
  private static readonly MAX_BATCHES_PER_SECOND = 40;

  /** Maximum commands allowed in a single batch. */
  private static readonly MAX_COMMANDS_PER_BATCH = 100;
  private static readonly MAX_ACTOR_IDS_PER_COMMAND = 100;
  private static readonly MAX_TARGET_IDS_PER_COMMAND = 32;

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
    if (!Number.isInteger(tick) || tick < 0) {
      this.logger.warn(`[GameCommand] Invalid tick ${tick} from player ${playerNumber}`);
      return false;
    }

    const actorIndex = this.getActorIndex(gameInstance);

    for (const command of commands) {
      if (!this.validateCommandPayload(command, tick, playerNumber, actorIndex, gameInstanceId)) {
        return false;
      }
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

  private validateCommandPayload(
    command: unknown,
    expectedTick: number,
    playerNumber: number,
    actorIndex: Map<string, ActorDefinition>,
    gameInstanceId: string
  ): boolean {
    if (!command || typeof command !== "object") {
      this.logger.warn(`[GameCommand] Non-object command in ${gameInstanceId}`);
      return false;
    }

    const payload = command as Record<string, unknown>;
    const type = payload.type;
    if (type !== "MOVE" && type !== "ACTOR_ACTION" && type !== "STOP") {
      this.logger.warn(`[GameCommand] Unknown command type ${String(type)} in ${gameInstanceId}`);
      return false;
    }
    if (payload.tick !== expectedTick || payload.playerNumber !== playerNumber) {
      this.logger.warn(
        `[GameCommand] Inner command metadata mismatch for player ${playerNumber} in ${gameInstanceId}`
      );
      return false;
    }

    const actorIds = this.readActorIds(payload.actorIds);
    if (!actorIds || actorIds.length === 0 || actorIds.length > GameCommandValidatorService.MAX_ACTOR_IDS_PER_COMMAND) {
      this.logger.warn(`[GameCommand] Invalid actorIds for player ${playerNumber} in ${gameInstanceId}`);
      return false;
    }
    for (const actorId of actorIds) {
      const actor = actorIndex.get(actorId);
      if (!actor) {
        this.logger.warn(`[GameCommand] Unknown actor ${actorId} for player ${playerNumber} in ${gameInstanceId}`);
        return false;
      }
      if (actor.owner?.ownerId !== playerNumber) {
        this.logger.warn(
          `[GameCommand] Ownership violation for actor ${actorId} by player ${playerNumber} in ${gameInstanceId}`
        );
        return false;
      }
    }

    switch (type) {
      case "MOVE": {
        if (!(payload.queue === true || payload.queue === false)) {
          this.logger.warn(`[GameCommand] Invalid queue flag for MOVE in ${gameInstanceId}`);
          return false;
        }
        if (!this.isValidTileVector3(payload.tileVec3) || !this.isValidWorldVector3(payload.worldVec3)) {
          this.logger.warn(`[GameCommand] Invalid move vector payload in ${gameInstanceId}`);
          return false;
        }
        if (!this.isConsistentTileAndWorld(payload.tileVec3, payload.worldVec3)) {
          this.logger.warn(`[GameCommand] Inconsistent tile/world move payload in ${gameInstanceId}`);
          return false;
        }
        if (!actorIds.every((actorId) => this.canActorHandleMove(actorIndex.get(actorId)!))) {
          this.logger.warn(`[GameCommand] MOVE issued by non-movable actor in ${gameInstanceId}`);
          return false;
        }
        return true;
      }
      case "ACTOR_ACTION": {
        const orderType = typeof payload.orderType === "string" ? payload.orderType : undefined;
        if (!(payload.queue === true || payload.queue === false)) {
          this.logger.warn(`[GameCommand] Invalid queue flag for ACTOR_ACTION in ${gameInstanceId}`);
          return false;
        }
        if (payload.tileVec3 !== undefined && !this.isValidTileVector3(payload.tileVec3)) {
          this.logger.warn(`[GameCommand] Invalid tileVec3 for ACTOR_ACTION in ${gameInstanceId}`);
          return false;
        }
        if (payload.orderType !== undefined && typeof payload.orderType !== "string") {
          this.logger.warn(`[GameCommand] Invalid orderType for ACTOR_ACTION in ${gameInstanceId}`);
          return false;
        }
        if (orderType !== undefined && !GameCommandValidatorService.KNOWN_ORDER_TYPES.has(orderType)) {
          this.logger.warn(`[GameCommand] Unknown orderType ${orderType} in ${gameInstanceId}`);
          return false;
        }
        if (payload.targetObjectIds !== undefined) {
          const targetIds = this.readActorIds(payload.targetObjectIds);
          if (
            !targetIds ||
            targetIds.length > GameCommandValidatorService.MAX_TARGET_IDS_PER_COMMAND
          ) {
            this.logger.warn(`[GameCommand] Invalid targetObjectIds for ACTOR_ACTION in ${gameInstanceId}`);
            return false;
          }
          for (const targetId of targetIds) {
            if (!actorIndex.has(targetId)) {
              this.logger.warn(`[GameCommand] Unknown target ${targetId} for ACTOR_ACTION in ${gameInstanceId}`);
              return false;
            }
          }
        }
        if (orderType !== undefined && !actorIds.every((actorId) => this.canActorHandleOrder(actorIndex.get(actorId)!, orderType))) {
          this.logger.warn(`[GameCommand] ACTOR_ACTION ${orderType} issued by incapable actor in ${gameInstanceId}`);
          return false;
        }
        return true;
      }
      case "STOP":
        return true;
    }
  }

  private readActorIds(value: unknown): string[] | null {
    if (!Array.isArray(value)) {
      return null;
    }
    const actorIds = value.filter((actorId): actorId is string => typeof actorId === "string" && actorId.length > 0);
    return actorIds.length === value.length ? actorIds : null;
  }

  private getActorIndex(gameInstance: ProbableWaffleGameInstance): Map<string, ActorDefinition> {
    const actorIndex = new Map<string, ActorDefinition>();
    for (const actor of gameInstance.gameState?.data.actors ?? []) {
      const actorId = actor.id?.id;
      if (!actorId) {
        continue;
      }
      actorIndex.set(actorId, actor);
    }
    return actorIndex;
  }

  private canActorHandleMove(actor: ActorDefinition): boolean {
    return actor.translatable !== undefined || actor.production !== undefined;
  }

  private canActorHandleOrder(actor: ActorDefinition, orderType: string): boolean {
    switch (orderType) {
      case "Attack":
        return actor.attack !== undefined;
      case "Build":
      case "Repair":
        return actor.builder !== undefined;
      case "Gather":
      case "ReturnResources":
        return actor.gatherer !== undefined;
      case "Heal":
        return actor.healing !== undefined;
      case "Move":
        return this.canActorHandleMove(actor);
      case "EnterContainer":
      case "Stop":
        return actor.translatable !== undefined;
      default:
        return false;
    }
  }

  private isValidTileVector3(value: unknown): boolean {
    if (!value || typeof value !== "object") {
      return false;
    }
    const vector = value as Record<string, unknown>;
    return this.isFiniteInteger(vector.x) && this.isFiniteInteger(vector.y) && this.isFiniteInteger(vector.z);
  }

  private isValidWorldVector3(value: unknown): boolean {
    if (!value || typeof value !== "object") {
      return false;
    }
    const vector = value as Record<string, unknown>;
    return this.isFiniteNumber(vector.x) && this.isFiniteNumber(vector.y) && this.isFiniteNumber(vector.z);
  }

  private isConsistentTileAndWorld(tileValue: unknown, worldValue: unknown): boolean {
    if (!this.isValidTileVector3(tileValue) || !this.isValidWorldVector3(worldValue)) {
      return false;
    }

    const tile = tileValue as { x: number; y: number };
    const world = worldValue as { x: number; y: number };
    const derivedTileX =
      (world.x / GameCommandValidatorService.ISO_HALF_TILE_WIDTH -
        world.y / GameCommandValidatorService.ISO_HALF_TILE_HEIGHT) /
      2;
    const derivedTileY =
      (world.x / GameCommandValidatorService.ISO_HALF_TILE_WIDTH +
        world.y / GameCommandValidatorService.ISO_HALF_TILE_HEIGHT) /
      2;

    return Math.abs(tile.x - derivedTileX) <= 1 && Math.abs(tile.y - derivedTileY) <= 1;
  }

  private isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
  }

  private isFiniteInteger(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
  }
}
