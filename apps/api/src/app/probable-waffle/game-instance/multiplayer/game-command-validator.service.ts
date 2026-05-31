import { Injectable, Logger } from "@nestjs/common";
import {
  AllOrderTypes,
  type ActorDefinition,
  ObjectNames,
  OrderType,
  type ProbableWaffleGameCommandEvent,
  ProbableWaffleGameCommandTypes,
  type ProbableWaffleGameCommandType,
  type ProbableWaffleGameInstance,
  ResearchType
} from "@fuzzy-waddle/api-interfaces";
import type { User } from "@supabase/supabase-js";

/**
 * Result of batch validation.
 *
 * - `{ valid: true }` — relay the batch as-is to all peers.
 * - `{ valid: false, relayEmpty: true,  reason }` — the player and tick are
 *   authoritative but the payload is bad; relay an empty batch so the lockstep
 *   barrier can advance without desync.
 * - `{ valid: false, relayEmpty: false, reason }` — security / ownership
 *   violation; drop the message entirely (no relay of any kind).
 */
export type GameCommandValidationResult =
  | { valid: true }
  | { valid: false; relayEmpty: boolean; reason: string; overrideTick?: number };

/**
 * Cheap server-side validation for incoming command batches.
 *
 * The server never runs the simulation, so it can only check:
 *   1. Player ownership  — the JWT user must own the playerNumber they're
 *      submitting commands for.
 *   2. Sequence numbers — each player's tick must advance monotonically.
 *      On sequence mismatch, server relays an empty batch for the next
 *      canonical tick so lockstep does not stall permanently.
 *   3. Rate limiting     — at most MAX_BATCHES_PER_SECOND batches per player
 *      per second; once the tick is confirmed authoritative, excess batches
 *      are replaced with an empty relay rather than dropped, so the lockstep
 *      barrier still advances.
 *   4. Payload schema   — batch must be an array; individual command fields
 *      must not be wildly out of range.  Payload failures → RELAY EMPTY (the
 *      tick is authoritative but the commands cannot be applied).
 */
@Injectable()
export class GameCommandValidatorService {
  private readonly logger = new Logger(GameCommandValidatorService.name);
  private static readonly KNOWN_ORDER_TYPES = new Set(AllOrderTypes);
  private static readonly KNOWN_ACTOR_NAMES = new Set(Object.values(ObjectNames));
  private static readonly KNOWN_RESEARCH_TYPES = new Set(Object.values(ResearchType));
  private static readonly KNOWN_COMMAND_TYPES = new Set<ProbableWaffleGameCommandType>(
    Object.values(ProbableWaffleGameCommandTypes)
  );

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
  // Game instances recreated from client reseed can resume at high ticks.
  // Allow a one-time high initial tick per player for those instances only.
  private readonly allowHighInitialTickAfterReseed = new Set<string>();

  // rate-limit counters per (gameInstanceId → playerNumber) with rolling window
  private readonly rateBuckets = new Map<string, Map<number, { count: number; windowStart: number }>>();

  validate(
    event: ProbableWaffleGameCommandEvent,
    gameInstance: ProbableWaffleGameInstance,
    user: User
  ): GameCommandValidationResult {
    const { playerNumber, tick, commands, gameInstanceId } = event;

    // ── Phase 1: Security / authoritative checks ────────────────────────────
    // Failures here are protocol violations.  The batch is DROPPED entirely
    // (no relay) so a malicious sender cannot spoof a no-op commit for another
    // player's slot or inject stale/far-future ticks.

    // 1a. Ownership: the authenticated user must be the owner of this playerNumber.
    //    AI players have userId = null; only the current host may submit commands on their behalf.
    const player = gameInstance.getPlayerByNumber(playerNumber);
    if (!player) {
      this.logger.warn(`[GameCommand] Unknown playerNumber ${playerNumber} in instance ${gameInstanceId}`);
      return { valid: false, relayEmpty: false, reason: `unknown playerNumber ${playerNumber}` };
    }
    const playerUserId = player.playerController.data.userId;
    if (playerUserId !== user.id) {
      if (playerUserId !== null) {
        // Non-null userId mismatch — one human trying to control another human's units.
        this.logger.warn(
          `[GameCommand] Ownership violation: user ${user.id} tried to submit for player ${playerNumber} owned by ${playerUserId}`
        );
        return { valid: false, relayEmpty: false, reason: `ownership violation for player ${playerNumber}` };
      }
      // playerUserId === null → AI-owned slot. Only the current host may issue these commands.
      const hostUserId =
        (gameInstance.gameInstanceMetadata.data as { currentHostUserId?: string | null }).currentHostUserId ??
        gameInstance.gameInstanceMetadata.data.createdBy;
      if (hostUserId !== user.id) {
        this.logger.warn(
          `[GameCommand] AI-player command from non-host: user ${user.id} tried to submit for AI player ${playerNumber}, host is ${hostUserId}`
        );
        return { valid: false, relayEmpty: false, reason: `non-host AI command for player ${playerNumber}` };
      }
    }

    // 1b. Sequence: tick must advance (never go backwards, never jump too far).
    //     Advance the sequence tracker only after ownership is confirmed so a
    //     forged packet cannot poison another player's sequence state.
    const instanceKey = String(gameInstanceId);
    if (!this.lastTick.has(instanceKey)) this.lastTick.set(instanceKey, new Map());
    const playerTicks = this.lastTick.get(instanceKey)!;
    const prev = playerTicks.get(playerNumber) ?? -1;
    const canonicalTick = prev + 1;

    // Invalid ticks are converted into empty commits for the next canonical tick
    // so peers do not block forever on a missing slot from this player.
    if (!Number.isInteger(tick) || tick < 0) {
      this.logger.warn(`[GameCommand] Invalid tick ${tick} from player ${playerNumber}`);
      playerTicks.set(playerNumber, canonicalTick);
      return {
        valid: false,
        relayEmpty: true,
        reason: `invalid tick value ${tick}`,
        overrideTick: canonicalTick
      };
    }

    if (tick <= prev) {
      this.logger.warn(
        `[GameCommand] Stale batch: game=${gameInstanceId} player=${playerNumber} user=${user.id} emitter=${event.emitterUserId ?? "n/a"} ` +
          `sentTick=${tick} lastAcceptedTick=${prev} canonicalNextTick=${canonicalTick} commandCount=${commands.length}`
      );
      // Do not advance sequence state for stale duplicates/out-of-order old packets.
      // The authoritative slot for this tick already exists; advancing here can
      // force canonical tick drift and create stale-loop cascades.
      return {
        valid: false,
        relayEmpty: false,
        reason: `stale tick ${tick} (last: ${prev})`
      };
    }
    if (prev === -1 && this.allowHighInitialTickAfterReseed.has(instanceKey)) {
      playerTicks.set(playerNumber, tick);
    } else if (tick > prev + GameCommandValidatorService.MAX_TICK_JUMP + 1) {
      this.logger.warn(`[GameCommand] Tick jump too large: player ${playerNumber} jumped from ${prev} to ${tick}`);
      playerTicks.set(playerNumber, canonicalTick);
      return {
        valid: false,
        relayEmpty: true,
        reason: `tick jump too large (${prev} → ${tick})`,
        overrideTick: canonicalTick
      };
    } else {
      // Sequence accepted — record the tick now so subsequent checks can treat
      // this slot as authoritative even if the payload turns out to be invalid.
      playerTicks.set(playerNumber, tick);
    }

    // ── Phase 2: Payload / content checks ───────────────────────────────────
    // The tick and player are now confirmed as authoritative.  Any failure
    // below results in RELAY EMPTY so the lockstep barrier advances without
    // desync: the sender committed this slot but with no valid commands.

    // 2a. Schema: commands must be an array within size limits.
    if (!Array.isArray(commands)) {
      this.logger.warn(`[GameCommand] commands field is not an array from player ${playerNumber}`);
      return { valid: false, relayEmpty: true, reason: `commands field is not an array` };
    }
    if (commands.length > GameCommandValidatorService.MAX_COMMANDS_PER_BATCH) {
      this.logger.warn(`[GameCommand] Oversized batch (${commands.length}) from player ${playerNumber} — dropping`);
      return {
        valid: false,
        relayEmpty: true,
        reason: `oversized batch (${commands.length} > ${GameCommandValidatorService.MAX_COMMANDS_PER_BATCH})`
      };
    }

    // 2b. Rate limiting: sliding 1-second window.
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
      this.logger.warn(`[GameCommand] Rate limit exceeded for player ${playerNumber} in instance ${gameInstanceId}`);
      return {
        valid: false,
        relayEmpty: true,
        reason: `rate limit exceeded (${bucket.count} batches/s)`
      };
    }

    // 2c. Per-command payload checks.
    const actorIndex = this.getActorIndex(gameInstance);
    for (const command of commands) {
      const payloadError = this.validateCommandPayload(command, tick, playerNumber, actorIndex, gameInstanceId);
      if (payloadError !== null) {
        return { valid: false, relayEmpty: true, reason: payloadError };
      }
    }

    return { valid: true };
  }

  /** Remove state for a game instance after it ends, to prevent memory leaks. */
  cleanup(gameInstanceId: string): void {
    this.lastTick.delete(gameInstanceId);
    this.rateBuckets.delete(gameInstanceId);
    this.allowHighInitialTickAfterReseed.delete(gameInstanceId);
  }

  /**
   * Allows one high initial tick after server-side instance recreation.
   * Without this, the first post-reseed batch would be dropped as a tick jump.
   */
  allowInitialTickBootstrap(gameInstanceId: string): void {
    this.allowHighInitialTickAfterReseed.add(gameInstanceId);
  }

  /**
   * Validates a single command's payload.
   * Returns null on success, or an error string describing the failure.
   */
  private validateCommandPayload(
    command: unknown,
    expectedTick: number,
    playerNumber: number,
    actorIndex: Map<string, ActorDefinition>,
    gameInstanceId: string
  ): string | null {
    if (!command || typeof command !== "object") {
      this.logger.warn(`[GameCommand] Non-object command in ${gameInstanceId}`);
      return `non-object command`;
    }

    const payload = command as Record<string, unknown>;
    const type = payload.type;
    if (!this.isKnownCommandType(type)) {
      this.logger.warn(`[GameCommand] Unknown command type ${String(type)} in ${gameInstanceId}`);
      return `unknown command type "${String(type)}"`;
    }
    if (payload.tick !== expectedTick || payload.playerNumber !== playerNumber) {
      this.logger.warn(`[GameCommand] Inner command metadata mismatch for player ${playerNumber} in ${gameInstanceId}`);
      return `command metadata mismatch (tick=${String(payload.tick)}, player=${String(payload.playerNumber)})`;
    }

    const actorIds = this.readActorIds(payload.actorIds);
    if (!actorIds || actorIds.length === 0 || actorIds.length > GameCommandValidatorService.MAX_ACTOR_IDS_PER_COMMAND) {
      this.logger.warn(`[GameCommand] Invalid actorIds for player ${playerNumber} in ${gameInstanceId}`);
      return `invalid actorIds for player ${playerNumber}`;
    }
    for (const actorId of actorIds) {
      const actor = actorIndex.get(actorId);
      if (!actor) {
        this.logger.warn(`[GameCommand] Unknown actor ${actorId} for player ${playerNumber} in ${gameInstanceId}`);
        return `unknown actor "${actorId}"`;
      }
      if (actor.owner?.ownerId !== playerNumber) {
        this.logger.warn(
          `[GameCommand] Ownership violation for actor ${actorId} by player ${playerNumber} in ${gameInstanceId}`
        );
        return `actor "${actorId}" not owned by player ${playerNumber}`;
      }
    }

    switch (type) {
      case ProbableWaffleGameCommandTypes.Move: {
        if (!(payload.queue === true || payload.queue === false)) {
          this.logger.warn(`[GameCommand] Invalid queue flag for MOVE in ${gameInstanceId}`);
          return `invalid queue flag for MOVE`;
        }
        if (!this.isValidTileVector3(payload.tileVec3) || !this.isValidWorldVector3(payload.worldVec3)) {
          this.logger.warn(`[GameCommand] Invalid move vector payload in ${gameInstanceId}`);
          return `invalid move vector payload`;
        }
        return null;
      }
      case ProbableWaffleGameCommandTypes.ActorAction: {
        const orderType = typeof payload.orderType === "string" ? payload.orderType : undefined;
        const knownOrderType = this.toKnownOrderType(orderType);
        if (!(payload.queue === true || payload.queue === false)) {
          this.logger.warn(`[GameCommand] Invalid queue flag for ACTOR_ACTION in ${gameInstanceId}`);
          return `invalid queue flag for ACTOR_ACTION`;
        }
        if (payload.tileVec3 !== undefined && !this.isValidTileVector3(payload.tileVec3)) {
          this.logger.warn(`[GameCommand] Invalid tileVec3 for ACTOR_ACTION in ${gameInstanceId}`);
          return `invalid tileVec3 for ACTOR_ACTION`;
        }
        if (payload.orderType !== undefined && typeof payload.orderType !== "string") {
          this.logger.warn(`[GameCommand] Invalid orderType for ACTOR_ACTION in ${gameInstanceId}`);
          return `invalid orderType for ACTOR_ACTION`;
        }
        if (orderType !== undefined && knownOrderType === undefined) {
          this.logger.warn(`[GameCommand] Unknown orderType ${orderType} in ${gameInstanceId}`);
          return `unknown orderType "${orderType}"`;
        }
        if (payload.targetObjectIds !== undefined) {
          const targetIds = this.readActorIds(payload.targetObjectIds);
          if (!targetIds || targetIds.length > GameCommandValidatorService.MAX_TARGET_IDS_PER_COMMAND) {
            this.logger.warn(`[GameCommand] Invalid targetObjectIds for ACTOR_ACTION in ${gameInstanceId}`);
            return `invalid targetObjectIds for ACTOR_ACTION`;
          }
        }
        return null;
      }
      case ProbableWaffleGameCommandTypes.Stop:
        return null;
      case ProbableWaffleGameCommandTypes.Production: {
        if (!this.isKnownActorName(payload.actorName)) {
          this.logger.warn(`[GameCommand] Invalid actorName for PRODUCTION in ${gameInstanceId}`);
          return `invalid actorName for PRODUCTION`;
        }
        return null;
      }
      case ProbableWaffleGameCommandTypes.CancelProduction:
        if (!Number.isInteger(payload.queueIndex) || (payload.queueIndex as number) < 0) {
          this.logger.warn(`[GameCommand] Invalid queueIndex for CANCEL_PRODUCTION in ${gameInstanceId}`);
          return `invalid queueIndex for CANCEL_PRODUCTION`;
        }
        return null;
      case ProbableWaffleGameCommandTypes.Research:
        if (!this.isKnownResearchType(payload.researchType)) {
          this.logger.warn(`[GameCommand] Invalid researchType for RESEARCH in ${gameInstanceId}`);
          return `invalid researchType for RESEARCH`;
        }
        return null;
      case ProbableWaffleGameCommandTypes.CancelResearch:
        return null;
    }
  }

  private isKnownCommandType(value: unknown): value is ProbableWaffleGameCommandType {
    return typeof value === "string" && GameCommandValidatorService.KNOWN_COMMAND_TYPES.has(value as ProbableWaffleGameCommandType);
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

  private toKnownOrderType(orderType: string | undefined): OrderType | undefined {
    if (!orderType || !GameCommandValidatorService.KNOWN_ORDER_TYPES.has(orderType as OrderType)) {
      return undefined;
    }

    return orderType as OrderType;
  }

  private isKnownActorName(value: unknown): value is ObjectNames {
    return typeof value === "string" && GameCommandValidatorService.KNOWN_ACTOR_NAMES.has(value as ObjectNames);
  }

  private isKnownResearchType(value: unknown): value is ResearchType {
    return typeof value === "string" && GameCommandValidatorService.KNOWN_RESEARCH_TYPES.has(value as ResearchType);
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

  private isFiniteNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value);
  }

  private isFiniteInteger(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && Number.isInteger(value);
  }
}
