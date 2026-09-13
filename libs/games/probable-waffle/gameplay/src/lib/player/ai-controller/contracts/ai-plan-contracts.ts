import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiDeadlineV1, AiDemandId, AiEffectId, AiPlanId, AiPlanStepId } from "./ai-core-types";

/** Persisted plan lifecycle; suspension preserves completed step identities. */
export type AiPlanLifecycleV1 = "proposed" | "active" | "suspended" | "completed" | "failed" | "cancelled";

/** One stateful opening or strategic plan step. */
export interface AiPlanStepV1 {
  readonly stepId: AiPlanStepId;
  readonly state: "pending" | "current" | "blocked" | "completed" | "skipped" | "fallback";
  readonly demandIds: readonly AiDemandId[];
  readonly deadline: AiDeadlineV1 | null;
  readonly completedTick: number | null;
}

/** Stable plan state shared by opening, economy and mission reducers. */
export interface AiPlanV1 {
  readonly planId: AiPlanId;
  readonly kind: string;
  readonly lifecycle: AiPlanLifecycleV1;
  readonly currentStepId: AiPlanStepId | null;
  readonly steps: readonly AiPlanStepV1[];
  readonly suspendedByPlanId: AiPlanId | null;
}

/** Unit used to measure demand fulfillment; duplicate actor types remain legal. */
export type AiDemandUnitV1 = "actor_count" | "population" | "cargo_seats" | "combat_contribution" | "work_per_horizon";

/** Demand ledger row with disjoint commitment identities. */
export interface AiDemandV1 {
  readonly demandId: AiDemandId;
  readonly purpose: string;
  readonly capabilityOrRole: string;
  readonly unit: AiDemandUnitV1;
  readonly desired: number;
  readonly satisfiedActorIds: readonly ActorId[];
  readonly queuedIds: readonly string[];
  readonly constructingIds: readonly string[];
  readonly acceptedNotObservedEffectIds: readonly AiEffectId[];
  readonly preferredObjectNames: readonly ObjectNames[];
  readonly resourceObligations: Readonly<Partial<Record<ResourceType, number>>>;
}
