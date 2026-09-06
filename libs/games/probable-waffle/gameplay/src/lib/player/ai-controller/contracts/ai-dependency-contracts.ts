import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiClaimId, AiDeadlineV1, AiPlanId, AiSimulationTick, AiWaitEdgeId } from "./ai-core-types";

/** Typed prerequisite edge used for admission and bounded cycle detection. */
export type AiPrerequisiteEdgeV1 =
  | { readonly kind: "resource"; readonly resourceType: ResourceType; readonly amount: number }
  | { readonly kind: "supply"; readonly amount: number }
  | { readonly kind: "worker"; readonly capabilityId: string }
  | { readonly kind: "producer"; readonly capabilityId: string }
  | { readonly kind: "route"; readonly queryId: string }
  | { readonly kind: "service_slot"; readonly serviceId: string };

/** Directed wait edge between stable plans; unknown edges retain a deadline. */
export interface AiWaitEdgeV1 {
  readonly edgeId: AiWaitEdgeId;
  readonly fromPlanId: AiPlanId;
  readonly toPlanId: AiPlanId | null;
  readonly prerequisite: AiPrerequisiteEdgeV1;
  readonly status: "known" | "unknown" | "infeasible";
  readonly deadline: AiDeadlineV1;
}

/** Reservation states distinguish forecasts, reversible leases and applied spending. */
export type AiReservationStateV1 =
  | { readonly kind: "forecast" }
  | { readonly kind: "provisional"; readonly expiresAt: AiDeadlineV1 }
  | { readonly kind: "dispatched"; readonly commandId: string }
  | { readonly kind: "applied_spending"; readonly appliedTick: AiSimulationTick }
  | { readonly kind: "refundable_work"; readonly refundPending: boolean };

/** One atomic resource/actor/service claim owned by a plan. */
export interface AiReservationV1 {
  readonly claimId: AiClaimId;
  readonly ownerPlanId: AiPlanId;
  readonly state: AiReservationStateV1;
  readonly prerequisites: readonly AiPrerequisiteEdgeV1[];
  readonly createdTick: AiSimulationTick;
}
