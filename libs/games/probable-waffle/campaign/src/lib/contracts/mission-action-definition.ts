import type {
  DamageType,
  ObjectNames,
  ResearchType,
  ResourceType,
  StatusEffectData
} from "@fuzzy-waddle/probable-waffle-protocol";
import type {
  MissionActionId,
  MissionCheckpointId,
  MissionCinematicId,
  MissionCounterId,
  MissionDialogueLineId,
  MissionEncounterId,
  MissionFactId,
  MissionObjectiveChecklistId,
  MissionObjectiveId,
  MissionReasonId,
  MissionRewardId,
  MissionTimerId,
  MissionTrustedHookId,
  ScenarioActorId,
  ScenarioPointId,
  ScenarioRegionId,
  ScenarioRouteId,
  ScenarioSpawnSetId,
  ScenarioTagId
} from "./campaign-content-id";

export type MissionActionMissingReferencePolicy = "fail-mission" | "skip" | "wait" | "fallback";

export interface MissionActionDefinitionBase {
  readonly id: MissionActionId;
  readonly scope?: "phase" | "mission";
  readonly missingReferencePolicy?: MissionActionMissingReferencePolicy;
  readonly fallbackAction?: MissionActionDefinition;
}

export interface MissionActorSpawnDefinition {
  readonly actorName: ObjectNames;
  readonly ownerPlayerNumber?: number;
  readonly scenarioRoleId?: ScenarioActorId;
  readonly tags?: readonly ScenarioTagId[];
}

export interface MissionCompositeActionDefinition extends MissionActionDefinitionBase {
  readonly kind: "sequence" | "parallel" | "race";
  readonly actions: readonly MissionActionDefinition[];
}

export type MissionActionDefinition =
  | (MissionActionDefinitionBase & {
      readonly kind: "set-fact";
      readonly factId: MissionFactId;
      readonly value: boolean | string;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "set-counter";
      readonly counterId: MissionCounterId;
      readonly value: number;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "increment-counter";
      readonly counterId: MissionCounterId;
      readonly amount: number;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "start-timer";
      readonly timerId: MissionTimerId;
      readonly durationTicks: number;
    })
  | (MissionActionDefinitionBase & { readonly kind: "pause-timer"; readonly timerId: MissionTimerId })
  | (MissionActionDefinitionBase & { readonly kind: "cancel-timer"; readonly timerId: MissionTimerId })
  | (MissionActionDefinitionBase & { readonly kind: "wait-ticks"; readonly durationTicks: number })
  | MissionCompositeActionDefinition
  | (MissionActionDefinitionBase & {
      readonly kind: "spawn-actor";
      readonly actor: MissionActorSpawnDefinition;
      readonly pointId: ScenarioPointId;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "spawn-set";
      readonly spawnSetId: ScenarioSpawnSetId;
      readonly actors: readonly MissionActorSpawnDefinition[];
    })
  | (MissionActionDefinitionBase & { readonly kind: "despawn-actor"; readonly actorId: ScenarioActorId })
  | (MissionActionDefinitionBase & {
      readonly kind: "convert-owner";
      readonly actorId: ScenarioActorId;
      readonly ownerPlayerNumber: number;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "assign-scenario-role";
      readonly actorRuntimeId: string;
      readonly scenarioRoleId: ScenarioActorId;
      readonly tags?: readonly ScenarioTagId[];
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "move-along-route";
      readonly actorId: ScenarioActorId;
      readonly routeId: ScenarioRouteId;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "issue-order";
      readonly actorIds: readonly ScenarioActorId[];
      readonly order: "move" | "attack" | "stop" | "patrol";
      readonly targetActorId?: ScenarioActorId;
      readonly targetPointId?: ScenarioPointId;
      readonly queue?: boolean;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "teleport-actor";
      readonly actorId: ScenarioActorId;
      readonly pointId: ScenarioPointId;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "face-actor";
      readonly actorId: ScenarioActorId;
      readonly targetActorId?: ScenarioActorId;
      readonly targetPointId?: ScenarioPointId;
      readonly angle?: number;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "set-actor-flag";
      readonly actorId: ScenarioActorId;
      readonly flag: "invulnerable" | "selectable" | "controllable";
      readonly value: boolean;
    })
  | (MissionActionDefinitionBase & { readonly kind: "revive-actor"; readonly actorId: ScenarioActorId })
  | (MissionActionDefinitionBase & {
      readonly kind: "damage-actor";
      readonly actorId: ScenarioActorId;
      readonly amount: number;
      readonly damageType: DamageType;
      readonly sourceActorId?: ScenarioActorId;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "heal-actor";
      readonly actorId: ScenarioActorId;
      readonly amount: number;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "begin-attack";
      readonly actorId: ScenarioActorId;
      readonly targetActorId: ScenarioActorId;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "create-aoe";
      readonly effectId: string;
      readonly pointId?: ScenarioPointId;
      readonly regionId?: ScenarioRegionId;
      readonly spellType: string;
      readonly radiusTiles: number;
      readonly durationTicks: number;
      readonly tickIntervalTicks: number;
      readonly sourcePlayerNumber: number;
      readonly affectsAllies: boolean;
      readonly affectsEnemies: boolean;
      readonly effectWhileInside?: StatusEffectData;
    })
  | (MissionActionDefinitionBase & { readonly kind: "remove-aoe"; readonly effectId: string })
  | (MissionActionDefinitionBase & {
      readonly kind: "construct-building";
      readonly actor: MissionActorSpawnDefinition;
      readonly pointId: ScenarioPointId;
    })
  | (MissionActionDefinitionBase & { readonly kind: "complete-construction"; readonly actorId: ScenarioActorId })
  | (MissionActionDefinitionBase & { readonly kind: "destroy-building"; readonly actorId: ScenarioActorId })
  | (MissionActionDefinitionBase & {
      readonly kind: "toggle-world-object";
      readonly actorId: ScenarioActorId;
      readonly value: boolean;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "add-resource" | "remove-resource";
      readonly playerNumber: number;
      readonly resourceType: ResourceType;
      readonly amount: number;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "transfer-resource";
      readonly fromPlayerNumber: number;
      readonly toPlayerNumber: number;
      readonly resourceType: ResourceType;
      readonly amount: number;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "grant-research";
      readonly playerNumber: number;
      readonly researchType: ResearchType;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "update-alliance";
      readonly playerNumber: number;
      readonly otherPlayerNumber: number;
      readonly allied: boolean;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "set-ai-enabled";
      readonly playerNumber: number;
      readonly enabled: boolean;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "ai-directive";
      readonly playerNumber: number;
      readonly directive: "attack" | "retreat" | "patrol" | "move" | "stop";
      readonly actorIds: readonly ScenarioActorId[];
      readonly targetActorId?: ScenarioActorId;
      readonly targetPointId?: ScenarioPointId;
      readonly queue?: boolean;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "set-content-allowance";
      readonly playerNumber: number;
      readonly contentType: "actor" | "research";
      readonly contentId: ObjectNames | ResearchType;
      readonly allowed: boolean;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "grant-temporary-modifier";
      readonly modifierId: string;
      readonly playerNumber?: number;
      readonly actorId?: ScenarioActorId;
      readonly value: number;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "discover-reward";
      readonly rewardId: MissionRewardId;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "grant-content";
      readonly grantId: string;
      readonly playerNumber: number;
      readonly contentType: "actor" | "research";
      readonly contentId: ObjectNames | ResearchType;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "revoke-content-grant";
      readonly grantId: string;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "set-objective-state";
      readonly objectiveId: MissionObjectiveId;
      readonly state: "active" | "completed" | "failed" | "impossible";
      readonly reasonId?: MissionReasonId;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "set-objective-checklist-state";
      readonly objectiveId: MissionObjectiveId;
      readonly checklistId: MissionObjectiveChecklistId;
      readonly state: "pending" | "completed";
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "set-encounter-state";
      readonly encounterId: MissionEncounterId;
      readonly state: "active" | "completed" | "failed" | "inactive";
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "set-dialogue-state";
      readonly lineId: MissionDialogueLineId;
      readonly state: "presenting" | "acknowledged";
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "set-cinematic-stage";
      readonly cinematicId: MissionCinematicId;
      readonly stage: "prelude" | "presenting" | "finalizing" | "completed";
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "start-dialogue";
      readonly lineId: MissionDialogueLineId;
      readonly waitForAcknowledgement?: boolean;
      /** Runtime-generated presentation leaf; not part of authored JSON. */
      readonly presentationOnly?: true;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "start-cinematic";
      readonly cinematicId: MissionCinematicId;
      readonly waitForCompletion?: boolean;
      /** Runtime-generated presentation leaf; not part of authored JSON. */
      readonly presentationOnly?: true;
    })
  | (MissionActionDefinitionBase & { readonly kind: "create-checkpoint"; readonly checkpointId: MissionCheckpointId })
  | (MissionActionDefinitionBase & {
      readonly kind: "request-outcome";
      readonly outcome: "victory" | "defeat";
      readonly reasonId: MissionReasonId;
    })
  | (MissionActionDefinitionBase & { readonly kind: "trusted-hook"; readonly hookId: MissionTrustedHookId });

export function isCompositeMissionAction(action: MissionActionDefinition): action is MissionCompositeActionDefinition {
  return action.kind === "sequence" || action.kind === "parallel" || action.kind === "race";
}
