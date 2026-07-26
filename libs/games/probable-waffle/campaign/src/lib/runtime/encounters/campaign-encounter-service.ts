import type {
  CampaignMissionEncounterRuntimeState,
  CampaignMissionEncounterStatus,
  CampaignMissionRuntimeEvent
} from "@fuzzy-waddle/probable-waffle-protocol";
import type { MissionActionDefinition } from "../../contracts/mission-action-definition";
import type { MissionConditionDefinition } from "../../contracts/mission-condition-definition";
import type {
  MissionEncounterBlockedSpawnPolicy,
  MissionEncounterSpawnGroupDefinition,
  MissionEncounterWaveDefinition
} from "../../contracts/mission-encounter-definition";
import type { ResolvedMissionEncounterDefinition } from "../campaign-difficulty-resolver";

/**
 * Deterministic encounter/wave orchestration contract. Spawn placement and actor
 * creation remain adapter responsibilities; this layer records reproducible wave
 * progress and applies authored blocked-spawn policy.
 *
 * @see https://github.com/JernejHabjan/fuzzy-waddle/issues/707
 */
export interface CampaignEncounterSpawnedActor {
  /**
   * stable actor runtime id used by {@link CampaignEncounterSpawnedActor} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly actorRuntimeId: string;
  /**
   * Optional numeric owner player number carried by {@link CampaignEncounterSpawnedActor}. Its units and valid
   * range are defined by {@link CampaignEncounterSpawnedActor} and must remain consistent across producers and
   * consumers.
   */
  readonly ownerPlayerNumber?: number;
}

/**
 * Defines the closed campaign encounter spawn result value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type CampaignEncounterSpawnResult =
  | { readonly status: "spawned"; readonly actors: readonly CampaignEncounterSpawnedActor[] }
  | { readonly status: "blocked"; readonly reason: string }
  | { readonly status: "failed"; readonly reason: string };

/**
 * Defines the structured campaign encounter world adapter contract for this module. Its declared surface makes
 * spawn wave, is actor alive explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface CampaignEncounterWorldAdapter {
  /**
   * operation exposed by {@link CampaignEncounterWorldAdapter}. Its signature is the compatibility boundary for
   * implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  spawnWave(
    encounterId: string,
    waveId: string,
    groups: readonly MissionEncounterSpawnGroupDefinition[],
    spawnCursor: number
  ): CampaignEncounterSpawnResult;
  /**
   * operation exposed by {@link CampaignEncounterWorldAdapter}. Its signature is the compatibility boundary for
   * implementers and callers; keep ordering, return semantics, and error behavior aligned across
   * implementations.
   */
  isActorAlive(actorRuntimeId: string): boolean;
}

/**
 * Defines the structured campaign encounter advance context contract for this module. Its declared surface
 * makes tick, evaluate, execute actions, world explicit to every consumer. Use this shared shape rather than
 * an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignEncounterAdvanceContext {
  /**
   * temporal value for {@link CampaignEncounterAdvanceContext}. It anchors ordering, expiry, or presentation
   * timing and must use the time domain declared by the enclosing contract.
   */
  readonly tick: number;
  /**
   * evaluate value carried by {@link CampaignEncounterAdvanceContext}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly evaluate: (condition: MissionConditionDefinition) => boolean;
  /**
   * collection owned by {@link CampaignEncounterAdvanceContext}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly executeActions: (actions: readonly MissionActionDefinition[]) => boolean;
  /**
   * Optional world value carried by {@link CampaignEncounterAdvanceContext}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly world?: CampaignEncounterWorldAdapter;
}

/**
 * Defines the structured campaign encounter effect contract for this module. Its declared surface makes
 * encounter id, kind, tick, wave id, detail explicit to every consumer. Use this shared shape rather than an
 * ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface CampaignEncounterEffect {
  /**
   * stable encounter id used by {@link CampaignEncounterEffect} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly encounterId: string;
  /**
   * discriminator for {@link CampaignEncounterEffect}. It selects the valid branch and behavior, so producers
   * and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: "started" | "wave-warning" | "wave-spawned" | "wave-skipped" | "completed" | "failed";
  /**
   * temporal value for {@link CampaignEncounterEffect}. It anchors ordering, expiry, or presentation timing and
   * must use the time domain declared by the enclosing contract.
   */
  readonly tick: number;
  /**
   * Optional stable wave id used by {@link CampaignEncounterEffect} to correlate this value with related
   * records, events, or authored content; it is not a display label.
   */
  readonly waveId?: string;
  /**
   * Optional string detail carried by {@link CampaignEncounterEffect}. Treat it according to the owning
   * contract’s validation and presentation rules rather than assuming it is a stable identifier.
   */
  readonly detail?: string;
}

/**
 * Defines the structured encounter stop policy contract for this module. Its declared surface makes status,
 * spawned actors explicit to every consumer. Use this shared shape rather than an ad-hoc object so adapters,
 * persistence, and callers remain compatible.
 */
export interface EncounterStopPolicy {
  /**
   * discriminator for {@link EncounterStopPolicy}. It selects the valid branch and behavior, so producers and
   * consumers must keep it synchronized with the accompanying fields.
   */
  readonly status: Extract<CampaignMissionEncounterStatus, "completed" | "failed">;
  /** Documents the spawned actors member and its declared contract at this boundary. */
  readonly spawnedActors?: "retain" | "release";
}

export abstract class CampaignEncounterService {
  abstract start(encounterId: string, tick: number): CampaignMissionEncounterRuntimeState;
  abstract stop(encounterId: string, policy: EncounterStopPolicy): void;
  abstract advance(context: CampaignEncounterAdvanceContext): readonly CampaignEncounterEffect[];
  abstract observeEvent(event: CampaignMissionRuntimeEvent): void;
  abstract getState(encounterId: string): CampaignMissionEncounterRuntimeState | undefined;
  abstract restore(states: Readonly<Record<string, CampaignMissionEncounterRuntimeState>>): void;
}

/**
 * Advances authored encounter waves against a deterministic tick and mutable runtime
 * snapshot. Spawn mechanics stay behind {@link CampaignEncounterWorldAdapter}; this
 * service records delays, retries, completion, and trigger effects so restores can
 * continue the same encounter without re-spawning earlier waves.
 */
export class DefaultCampaignEncounterService extends CampaignEncounterService {
  private readonly definitionsById: ReadonlyMap<string, ResolvedMissionEncounterDefinition>;

  constructor(
    definitions: readonly ResolvedMissionEncounterDefinition[],
    private readonly states: Record<string, CampaignMissionEncounterRuntimeState>,
    private readonly branchSeed = "campaign-encounter"
  ) {
    super();
    this.definitionsById = new Map(definitions.map((definition) => [definition.id, definition] as const));
  }

  start(encounterId: string, tick: number): CampaignMissionEncounterRuntimeState {
    const definition = this.requireDefinition(encounterId);
    const state = (this.states[encounterId] ??= createCampaignEncounterRuntimeState());
    state.status = "active";
    state.nextEligibleTick ??= tick + definition.initialDelayTicks + (definition.waves[0]?.delayTicks ?? 0);
    return state;
  }

  stop(encounterId: string, policy: EncounterStopPolicy): void {
    const state = (this.states[encounterId] ??= createCampaignEncounterRuntimeState());
    state.status = policy.status;
    state.nextEligibleTick = undefined;
    if (policy.spawnedActors === "release") {
      state.livingSpawnedActorIds = [];
      state.spawnedActorOwners = {};
    }
  }

  /**
   * Advances every eligible encounter/wave once for the supplied tick. Ordering by
   * authored ID makes concurrent wave starts reproducible, while blocked-spawn policies
   * decide whether to retry, skip, or fail without letting adapter timing change state.
   */
  advance(context: CampaignEncounterAdvanceContext): readonly CampaignEncounterEffect[] {
    const effects: CampaignEncounterEffect[] = [];
    for (const definition of [...this.definitionsById.values()].sort((left, right) =>
      left.id.localeCompare(right.id)
    )) {
      let state = this.states[definition.id];
      if (!state || state.status === "inactive") {
        if (!context.evaluate(definition.start)) continue;
        state = this.start(definition.id, context.tick);
        effects.push({ encounterId: definition.id, kind: "started", tick: context.tick });
      }
      if (state.status !== "active") continue;
      this.pruneDeadActors(state, context.world);
      if (definition.completion && context.evaluate(definition.completion)) {
        this.stop(definition.id, { status: "completed" });
        effects.push({ encounterId: definition.id, kind: "completed", tick: context.tick });
        continue;
      }
      if (state.waveIndex >= definition.waves.length) {
        if (state.livingSpawnedActorIds.length === 0) {
          this.stop(definition.id, { status: "completed" });
          effects.push({ encounterId: definition.id, kind: "completed", tick: context.tick });
        }
        continue;
      }
      const wave = definition.waves[state.waveIndex];
      if (!wave) continue;
      state.nextEligibleTick ??=
        context.tick + (state.waveIndex === 0 ? definition.initialDelayTicks : 0) + wave.delayTicks;
      if (
        wave.warningTicks !== undefined &&
        context.tick >= state.nextEligibleTick - wave.warningTicks &&
        !state.warnedWaveIds.includes(wave.id)
      ) {
        state.warnedWaveIds.push(wave.id);
        state.warnedWaveIds.sort();
        effects.push({ encounterId: definition.id, kind: "wave-warning", tick: context.tick, waveId: wave.id });
      }
      if (context.tick < state.nextEligibleTick) continue;
      const spawns = this.resolveWaveSpawns(definition.id, wave, state);
      const spawnResult = context.world?.spawnWave(definition.id, wave.id, spawns, state.spawnCursor) ?? {
        status: "blocked" as const,
        reason: "Encounter world adapter is unavailable"
      };
      if (spawnResult.status === "failed") {
        state.status = "failed";
        state.failureReason = spawnResult.reason;
        state.nextEligibleTick = undefined;
        effects.push({
          encounterId: definition.id,
          kind: "failed",
          tick: context.tick,
          waveId: wave.id,
          detail: spawnResult.reason
        });
        continue;
      }
      if (spawnResult.status === "blocked") {
        this.handleBlockedSpawn(definition.id, wave, state, context.tick, spawnResult.reason, effects);
        continue;
      }
      state.blockedAttempts = 0;
      state.spawnCursor += spawnResult.actors.length;
      for (const actor of spawnResult.actors) {
        if (!state.livingSpawnedActorIds.includes(actor.actorRuntimeId)) {
          state.livingSpawnedActorIds.push(actor.actorRuntimeId);
        }
        if (actor.ownerPlayerNumber !== undefined) {
          state.spawnedActorOwners[actor.actorRuntimeId] = actor.ownerPlayerNumber;
        }
      }
      state.livingSpawnedActorIds.sort();
      state.waveIndex++;
      const nextWave = definition.waves[state.waveIndex];
      state.nextEligibleTick = nextWave ? context.tick + nextWave.delayTicks : undefined;
      effects.push({ encounterId: definition.id, kind: "wave-spawned", tick: context.tick, waveId: wave.id });
      if (wave.actions && !context.executeActions(wave.actions)) return effects;
    }
    return effects;
  }

  observeEvent(event: CampaignMissionRuntimeEvent): void {
    const payload = isRecord(event.payload) ? event.payload : undefined;
    const runtimeId = typeof payload?.["actorRuntimeId"] === "string" ? payload["actorRuntimeId"] : undefined;
    if (!runtimeId) return;
    for (const [encounterId, state] of Object.entries(this.states)) {
      if (!state.livingSpawnedActorIds.includes(runtimeId)) continue;
      if (event.kind === "actor.destroyed" || event.kind === "actor.killed") {
        state.livingSpawnedActorIds = state.livingSpawnedActorIds.filter((id) => id !== runtimeId);
        delete state.spawnedActorOwners[runtimeId];
      } else if (event.kind === "actor.owner-changed" && typeof payload?.["owner"] === "number") {
        if (this.definitionsById.get(encounterId)?.convertedActorPolicy === "release") {
          state.livingSpawnedActorIds = state.livingSpawnedActorIds.filter((id) => id !== runtimeId);
          delete state.spawnedActorOwners[runtimeId];
        } else {
          state.spawnedActorOwners[runtimeId] = payload["owner"];
        }
      }
    }
  }

  getState(encounterId: string): CampaignMissionEncounterRuntimeState | undefined {
    const state = this.states[encounterId];
    return state ? structuredClone(state) : undefined;
  }

  restore(states: Readonly<Record<string, CampaignMissionEncounterRuntimeState>>): void {
    for (const key of Object.keys(this.states)) delete this.states[key];
    for (const [id, state] of Object.entries(states)) this.states[id] = structuredClone(state);
  }

  private resolveWaveSpawns(
    encounterId: string,
    wave: MissionEncounterWaveDefinition,
    state: CampaignMissionEncounterRuntimeState
  ): readonly MissionEncounterSpawnGroupDefinition[] {
    if (!wave.branches?.length) return wave.spawns;
    let branchId = state.deterministicBranchIds[wave.id];
    if (!branchId) {
      const index = stableHash(`${this.branchSeed}:${encounterId}:${wave.id}`) % wave.branches.length;
      const selectedBranch = wave.branches[index];
      if (!selectedBranch) return wave.spawns;
      branchId = selectedBranch.id;
      state.deterministicBranchIds[wave.id] = branchId;
    }
    const branch = wave.branches.find((candidate) => candidate.id === branchId);
    return [...wave.spawns, ...(branch?.spawns ?? [])];
  }

  /**
   * Resolves a failed wave spawn according to its authored recovery policy. Delayed and
   * skipped waves stay explicit in runtime state/effects; a failed wave remains terminal
   * so save, replay, and recovery all observe the same encounter outcome.
   */
  private handleBlockedSpawn(
    encounterId: string,
    wave: MissionEncounterWaveDefinition,
    state: CampaignMissionEncounterRuntimeState,
    tick: number,
    reason: string,
    effects: CampaignEncounterEffect[]
  ): void {
    state.blockedAttempts++;
    const policy: MissionEncounterBlockedSpawnPolicy = wave.blockedSpawnPolicy ?? "fail";
    if (policy === "delay") {
      state.nextEligibleTick = tick + (wave.blockedRetryTicks ?? 1);
      return;
    }
    if (policy === "skip") {
      state.waveIndex++;
      state.nextEligibleTick = undefined;
      effects.push({ encounterId, kind: "wave-skipped", tick, waveId: wave.id, detail: reason });
      return;
    }
    state.status = "failed";
    state.failureReason = policy === "fallback" ? `Fallback spawn failed: ${reason}` : reason;
    state.nextEligibleTick = undefined;
    effects.push({ encounterId, kind: "failed", tick, waveId: wave.id, detail: state.failureReason });
  }

  private pruneDeadActors(
    state: CampaignMissionEncounterRuntimeState,
    world: CampaignEncounterWorldAdapter | undefined
  ): void {
    if (!world) return;
    for (const runtimeId of [...state.livingSpawnedActorIds]) {
      if (world.isActorAlive(runtimeId)) continue;
      state.livingSpawnedActorIds = state.livingSpawnedActorIds.filter((id) => id !== runtimeId);
      delete state.spawnedActorOwners[runtimeId];
    }
  }

  private requireDefinition(encounterId: string): ResolvedMissionEncounterDefinition {
    const definition = this.definitionsById.get(encounterId);
    if (!definition) throw new Error(`Unknown campaign encounter '${encounterId}'`);
    return definition;
  }
}

export function createCampaignEncounterRuntimeState(): CampaignMissionEncounterRuntimeState {
  return {
    status: "inactive",
    waveIndex: 0,
    livingSpawnedActorIds: [],
    spawnedActorOwners: {},
    spawnCursor: 0,
    deterministicBranchIds: {},
    warnedWaveIds: [],
    blockedAttempts: 0
  };
}

function stableHash(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
