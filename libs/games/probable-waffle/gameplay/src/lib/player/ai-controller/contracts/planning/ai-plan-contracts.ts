import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiDeadline, AiDemandId, AiEffectId, AiPlanId, AiPlanStepId } from "../ai-core-types";

/** Persisted plan lifecycle; suspension preserves completed step identities. */
export type AiPlanLifecycle = "proposed" | "active" | "suspended" | "completed" | "failed" | "cancelled";

/** One stateful opening or strategic plan step. */
export interface AiPlanStep {
  readonly stepId: AiPlanStepId;
  readonly state: "pending" | "current" | "blocked" | "completed" | "skipped" | "fallback";
  readonly demandIds: readonly AiDemandId[];
  readonly deadline: AiDeadline | null;
  readonly completedTick: number | null;
}

/** Stable plan state shared by opening, economy and mission reducers. */
export interface AiPlan {
  readonly planId: AiPlanId;
  readonly kind: string;
  readonly lifecycle: AiPlanLifecycle;
  readonly currentStepId: AiPlanStepId | null;
  readonly steps: readonly AiPlanStep[];
  readonly suspendedByPlanId: AiPlanId | null;
}

/** Unit used to measure demand fulfillment; duplicate actor types remain legal. */
export type AiDemandUnit = "actor_count" | "population" | "cargo_seats" | "combat_contribution" | "work_per_horizon";

/** Demand ledger row with disjoint commitment identities. */
export interface AiDemand {
  readonly demandId: AiDemandId;
  readonly purpose: string;
  readonly capabilityOrRole: string;
  readonly unit: AiDemandUnit;
  readonly desired: number;
  readonly satisfiedActorIds: readonly ActorId[];
  readonly queuedIds: readonly string[];
  readonly constructingIds: readonly string[];
  readonly acceptedNotObservedEffectIds: readonly AiEffectId[];
  readonly preferredObjectNames: readonly ObjectNames[];
  readonly resourceObligations: Readonly<Partial<Record<ResourceType, number>>>;
}
