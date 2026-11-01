import type { AiBrainState } from "../contracts/ai-brain-state";
import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiCapabilityCatalog } from "../contracts/ai-capability-catalog";
import type { AiProductionTransition } from "../contracts/brain-state/ai-production-transition";
import type { AiReservation } from "../contracts/ai-dependency-contracts";
import type { AiPlanId } from "../contracts/ai-core-types";
import type { AiDemand } from "../contracts/ai-plan-contracts";

/** Forecast identity makes the optional commitment observable without pretending its budget is spent or reserved cash. */
export function productionTransitionClaims(
  transition: AiProductionTransition | undefined,
  state: AiBrainState,
  catalog: AiCapabilityCatalog,
  demands: readonly AiDemand[]
): { readonly forecastReservations: readonly AiReservation[]; readonly releasedOptionalPlanIds: readonly AiPlanId[] } {
  const previous = state.economyProduction.transition;
  const releasedOptionalPlanIds = previous && (transition?.planId !== previous.planId || transition.status !== "committed")
    ? [previous.planId] : [];
  if (!transition || transition.status !== "committed" || transition.planId === previous?.planId) {
    return { forecastReservations: [], releasedOptionalPlanIds };
  }
  const cost = catalog.entries.find((entry) => entry.sourceObjectName === transition.productObjectName)
    ?.constructionProfile?.resourceCost ?? {};
  const demand = demands.find((entry) => entry.demandId === transition.demandId);
  const missing = demand ? Math.max(0, demand.desired - demand.satisfiedActorIds.length - demand.queuedIds.length -
    demand.acceptedNotObservedEffectIds.length) : 0;
  return {
    releasedOptionalPlanIds,
    forecastReservations: [{
      claimId: `claim:${transition.planId}:forecast`,
      subjectKey: `future:${transition.planId}`,
      ownerPlanId: transition.planId,
      state: { kind: "forecast" },
      prerequisites: Object.entries(cost).map(([resourceType, amount]) => ({
        kind: "resource" as const,
        resourceType: resourceType as ResourceType,
        amount: (amount ?? 0) * missing
      })),
      createdTick: transition.committedTick
    }]
  };
}
