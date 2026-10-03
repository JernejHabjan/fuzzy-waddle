import type { ObjectNames, ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type {
  MissionCounterId,
  MissionEncounterId,
  MissionFactId,
  MissionObjectiveChecklistId,
  MissionObjectiveId,
  MissionPhaseId,
  MissionTimerId,
  ScenarioActorId,
  ScenarioGroupId,
  ScenarioRegionId,
  ScenarioTagId
} from "./campaign-content-id";

/**
 * Defines the closed mission numeric comparison value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type MissionNumericComparison =
  | "equal"
  | "not-equal"
  | "less"
  | "less-or-equal"
  | "greater"
  | "greater-or-equal";

/**
 * Defines the structured mission actor selector contract for this module. Its declared surface makes actor
 * ids, group id, tag, owner player number, actor type explicit to every consumer. Use this shared shape rather
 * than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
export interface MissionActorSelector {
  /**
   * Optional collection owned by {@link MissionActorSelector}. Preserve the declared element contract and any
   * ordering/uniqueness semantics when reading, serializing, or extending it.
   */
  readonly actorIds?: readonly ScenarioActorId[];
  /**
   * Optional stable group id used by {@link MissionActorSelector} to correlate this value with related records,
   * events, or authored content; it is not a display label.
   */
  readonly groupId?: ScenarioGroupId;
  /**
   * Optional tag value carried by {@link MissionActorSelector}. Its declared type is the compatibility boundary
   * for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly tag?: ScenarioTagId;
  /**
   * Optional numeric owner player number carried by {@link MissionActorSelector}. Its units and valid range are
   * defined by {@link MissionActorSelector} and must remain consistent across producers and consumers.
   */
  readonly ownerPlayerNumber?: number;
  /**
   * Optional discriminator for {@link MissionActorSelector}. It selects the valid branch and behavior, so
   * producers and consumers must keep it synchronized with the accompanying fields.
   */
  readonly actorType?: ObjectNames;
  /**
   * Optional alive value carried by {@link MissionActorSelector}. Its declared type is the compatibility
   * boundary for producers, validators, and consumers; do not replace it with a broader inferred shape.
   */
  readonly alive?: boolean;
}

/**
 * Defines the closed mission region occupancy policy value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type MissionRegionOccupancyPolicy =
  | { readonly kind: "any" }
  | { readonly kind: "specific-player"; readonly playerNumber: number }
  | { readonly kind: "specific-faction"; readonly faction: "tivara" | "skaduwee" }
  | { readonly kind: "all-connected-players" }
  | { readonly kind: "at-least"; readonly count: number }
  | { readonly kind: "entire-group"; readonly groupId: ScenarioGroupId };

/**
 * Defines the closed mission condition definition value set. Keeping this union named preserves exhaustive
 * handling and prevents incompatible free-form values at its boundaries.
 */
export type MissionConditionDefinition =
  | { readonly kind: "always" }
  | { readonly kind: "never" }
  | { readonly kind: "all"; readonly conditions: readonly MissionConditionDefinition[] }
  | { readonly kind: "any"; readonly conditions: readonly MissionConditionDefinition[] }
  | { readonly kind: "not"; readonly condition: MissionConditionDefinition }
  | { readonly kind: "fact"; readonly factId: MissionFactId; readonly equals: boolean | string }
  | {
      readonly kind: "counter";
      readonly counterId: MissionCounterId;
      readonly comparison: MissionNumericComparison;
      readonly value: number;
    }
  | {
      readonly kind: "mission-item-count";
      readonly itemId: string;
      readonly comparison: MissionNumericComparison;
      readonly value: number;
    }
  | { readonly kind: "timer"; readonly timerId: MissionTimerId; readonly state: "running" | "paused" | "elapsed" }
  | {
      readonly kind: "objective";
      readonly objectiveId: MissionObjectiveId;
      readonly state: "hidden" | "active" | "completed" | "failed" | "impossible";
    }
  | {
      readonly kind: "objective-checklist";
      readonly objectiveId: MissionObjectiveId;
      readonly checklistId: MissionObjectiveChecklistId;
      readonly state: "pending" | "completed";
    }
  | { readonly kind: "phase"; readonly phaseId: MissionPhaseId; readonly state: "active" | "completed" }
  | {
      readonly kind: "encounter";
      readonly encounterId: MissionEncounterId;
      readonly state: "inactive" | "active" | "completed" | "failed";
    }
  | { readonly kind: "actor-exists" | "actor-alive"; readonly actorId: ScenarioActorId }
  | { readonly kind: "actor-owner"; readonly actorId: ScenarioActorId; readonly playerNumber: number }
  | { readonly kind: "actor-type"; readonly actorId: ScenarioActorId; readonly actorType: ObjectNames }
  | { readonly kind: "actor-tag"; readonly actorId: ScenarioActorId; readonly tag: ScenarioTagId }
  | {
      readonly kind: "actor-health";
      readonly actorId: ScenarioActorId;
      readonly comparison: MissionNumericComparison;
      readonly value: number;
      readonly percentage?: boolean;
    }
  | {
      readonly kind: "actor-distance";
      readonly actorId: ScenarioActorId;
      readonly targetActorId: ScenarioActorId;
      readonly comparison: MissionNumericComparison;
      readonly value: number;
    }
  | {
      readonly kind: "actor-construction";
      readonly actorId: ScenarioActorId;
      readonly state: "not-started" | "constructing" | "finished";
    }
  | {
      readonly kind: "actor-count" | "produced-count" | "building-count";
      readonly selector: MissionActorSelector;
      readonly comparison: MissionNumericComparison;
      readonly value: number;
    }
  | {
      readonly kind: "region-occupancy";
      readonly regionId: ScenarioRegionId;
      readonly selector?: MissionActorSelector;
      readonly policy: MissionRegionOccupancyPolicy;
    }
  | {
      readonly kind: "player-resource";
      readonly playerNumber: number;
      readonly resourceType: ResourceType;
      readonly comparison: MissionNumericComparison;
      readonly value: number;
    }
  | { readonly kind: "research"; readonly playerNumber: number; readonly researchType: ResearchType }
  | { readonly kind: "difficulty"; readonly values: readonly string[] }
  | {
      readonly kind: "player-count";
      readonly comparison: MissionNumericComparison;
      readonly value: number;
      readonly connectedOnly?: boolean;
    }
  | {
      readonly kind: "content-cap";
      readonly playerNumber: number;
      readonly contentType: "actor" | "research";
      readonly contentId: ObjectNames | ResearchType;
      readonly allowed: boolean;
    };
