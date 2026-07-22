import type { MissionActionDefinition, MissionActorSpawnDefinition } from "./mission-action-definition";
import type { MissionConditionDefinition } from "./mission-condition-definition";
import type {
  MissionEncounterBranchId,
  MissionEncounterId,
  MissionEncounterWaveId,
  ScenarioSpawnSetId
} from "./campaign-content-id";
import type { CampaignDifficulty } from "./mission-difficulty-definition";

export type MissionEncounterBlockedSpawnPolicy = "fallback" | "delay" | "skip" | "fail";
export type MissionEncounterConvertedActorPolicy = "retain" | "release";

export interface MissionEncounterSpawnGroupDefinition {
  readonly spawnSetId: ScenarioSpawnSetId;
  readonly actors: readonly MissionActorSpawnDefinition[];
  readonly fallbackSpawnSetId?: ScenarioSpawnSetId;
}

export interface MissionEncounterBranchDefinition {
  readonly id: MissionEncounterBranchId;
  readonly spawns: readonly MissionEncounterSpawnGroupDefinition[];
}

export interface MissionEncounterWaveDefinition {
  readonly id: MissionEncounterWaveId;
  readonly delayTicks: number;
  readonly warningTicks?: number;
  readonly spawns: readonly MissionEncounterSpawnGroupDefinition[];
  readonly branches?: readonly MissionEncounterBranchDefinition[];
  readonly actions?: readonly MissionActionDefinition[];
  readonly blockedSpawnPolicy?: MissionEncounterBlockedSpawnPolicy;
  readonly blockedRetryTicks?: number;
}

export interface MissionEncounterOverride {
  readonly initialDelayTicks?: number;
  readonly waveSizeScale?: number;
  readonly warningTicks?: number;
  readonly waves?: readonly MissionEncounterWaveDefinition[];
}

export interface MissionEncounterPlayerCountOverride extends MissionEncounterOverride {
  readonly playerCount: number;
}

export interface MissionEncounterDefinition {
  readonly id: MissionEncounterId;
  readonly start: MissionConditionDefinition;
  readonly waves: readonly MissionEncounterWaveDefinition[];
  readonly completion?: MissionConditionDefinition;
  readonly initialDelayTicks?: number;
  readonly convertedActorPolicy?: MissionEncounterConvertedActorPolicy;
  readonly difficultyOverrides?: Readonly<Partial<Record<CampaignDifficulty, MissionEncounterOverride>>>;
  readonly playerCountOverrides?: readonly MissionEncounterPlayerCountOverride[];
}
