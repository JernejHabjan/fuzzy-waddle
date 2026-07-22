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

export type MissionNumericComparison =
  | "equal"
  | "not-equal"
  | "less"
  | "less-or-equal"
  | "greater"
  | "greater-or-equal";

export interface MissionActorSelector {
  readonly actorIds?: readonly ScenarioActorId[];
  readonly groupId?: ScenarioGroupId;
  readonly tag?: ScenarioTagId;
  readonly ownerPlayerNumber?: number;
  readonly actorType?: ObjectNames;
  readonly alive?: boolean;
}

export type MissionRegionOccupancyPolicy =
  | { readonly kind: "any" }
  | { readonly kind: "specific-player"; readonly playerNumber: number }
  | { readonly kind: "specific-faction"; readonly faction: "tivara" | "skaduwee" }
  | { readonly kind: "all-connected-players" }
  | { readonly kind: "at-least"; readonly count: number }
  | { readonly kind: "entire-group"; readonly groupId: ScenarioGroupId };

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
