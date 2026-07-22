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

export interface CampaignEncounterSpawnedActor {
  readonly actorRuntimeId: string;
  readonly ownerPlayerNumber?: number;
}

export type CampaignEncounterSpawnResult =
  | { readonly status: "spawned"; readonly actors: readonly CampaignEncounterSpawnedActor[] }
  | { readonly status: "blocked"; readonly reason: string }
  | { readonly status: "failed"; readonly reason: string };

export interface CampaignEncounterWorldAdapter {
  spawnWave(
    encounterId: string,
    waveId: string,
    groups: readonly MissionEncounterSpawnGroupDefinition[],
    spawnCursor: number
  ): CampaignEncounterSpawnResult;
  isActorAlive(actorRuntimeId: string): boolean;
}

export interface CampaignEncounterAdvanceContext {
  readonly tick: number;
  readonly evaluate: (condition: MissionConditionDefinition) => boolean;
  readonly executeActions: (actions: readonly MissionActionDefinition[]) => boolean;
  readonly world?: CampaignEncounterWorldAdapter;
}

export interface CampaignEncounterEffect {
  readonly encounterId: string;
  readonly kind: "started" | "wave-warning" | "wave-spawned" | "wave-skipped" | "completed" | "failed";
  readonly tick: number;
  readonly waveId?: string;
  readonly detail?: string;
}

export interface EncounterStopPolicy {
  readonly status: Extract<CampaignMissionEncounterStatus, "completed" | "failed">;
  /** Releases encounter membership without destroying actors that a later story phase may own. */
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

/** Fixed-tick authored wave scheduler. It delegates spawning but owns all deterministic encounter state. */
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
