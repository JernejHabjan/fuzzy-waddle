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

/**
 * Defines the closed mission action missing reference policy value set. Keeping this union named preserves
 * exhaustive handling and prevents incompatible free-form values at its boundaries.
 */
export type MissionActionMissingReferencePolicy = "fail-mission" | "skip" | "wait" | "fallback";

/**
 * Defines the structured mission action definition base contract for this module. Its declared surface makes
 * id, scope, missing reference policy, fallback action explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionActionDefinitionBase {
  /**
   * stable id used by {@link MissionActionDefinitionBase} to correlate this value with related records, events,
   * or authored content; it is not a display label.
   */
  readonly id: MissionActionId;
  /**
   * Optional discriminator for {@link MissionActionDefinitionBase}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly scope?: "phase" | "mission";
  /**
   * Optional discriminator for {@link MissionActionDefinitionBase}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly missingReferencePolicy?: MissionActionMissingReferencePolicy;
  /**
   * Optional fallback action value carried by {@link MissionActionDefinitionBase}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  readonly fallbackAction?: MissionActionDefinition;
}

/**
 * Defines the structured mission actor spawn definition contract for this module. Its declared surface makes
 * actor name, owner player number, scenario role id, tags explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionActorSpawnDefinition {
  /**
   * human-facing actor name for {@link MissionActorSpawnDefinition}. It supports UI, narration, or diagnostics
   * and must not be used as the stable identity of the record.
   */
  readonly actorName: ObjectNames;
  /**
   * Optional numeric owner player number carried by {@link MissionActorSpawnDefinition}. Its units and valid
   * range are defined by {@link MissionActorSpawnDefinition} and must remain consistent across producers and
   * consumers.
   */
  readonly ownerPlayerNumber?: number;
  /**
   * Optional stable scenario role id used by {@link MissionActorSpawnDefinition} to correlate this value with
   * related records, events, or authored content; it is not a display label.
   */
  readonly scenarioRoleId?: ScenarioActorId;
  /**
   * Optional collection value on {@link MissionActorSpawnDefinition}. Its element type defines the records that
   * may cross this boundary; preserve ordering or uniqueness whenever the owning workflow relies on it.
   */
  readonly tags?: readonly ScenarioTagId[];
}

/**
 * Defines the structured mission composite action definition contract for this module. Its declared surface
 * makes kind, actions explicit to every consumer. Use this shared shape rather than an ad-hoc object so
 * adapters, persistence, and callers remain compatible.
 */
export interface MissionCompositeActionDefinition extends MissionActionDefinitionBase {
  /**
   * discriminator for {@link MissionCompositeActionDefinition}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly kind: "sequence" | "parallel" | "race";
  /**
   * collection owned by {@link MissionCompositeActionDefinition}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly actions: readonly MissionActionDefinition[];
}

/**
 * Defines the closed mission action definition value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
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
      readonly kind: "add-mission-item" | "consume-mission-item" | "set-mission-item";
      readonly itemId: string;
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
      readonly kind: "set-control-perspective";
      readonly playerNumber: number;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "carry-actor";
      readonly actorId: ScenarioActorId;
      readonly carrierActorId: ScenarioActorId;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "drop-carried-actor";
      readonly actorId: ScenarioActorId;
      readonly pointId: ScenarioPointId;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "apply-disguise";
      readonly disguiseId: string;
      readonly actorIds: readonly ScenarioActorId[];
      readonly opacity?: number;
    })
  | (MissionActionDefinitionBase & { readonly kind: "remove-disguise"; readonly disguiseId: string })
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
      /** Documents the presentation only member and its declared contract at this boundary. */
      readonly presentationOnly?: true;
    })
  | (MissionActionDefinitionBase & {
      readonly kind: "start-cinematic";
      readonly cinematicId: MissionCinematicId;
      readonly waitForCompletion?: boolean;
      /** Documents the presentation only member and its declared contract at this boundary. */
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
