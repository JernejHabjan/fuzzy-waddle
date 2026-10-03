import type { AiCommandOutcomeV1 } from "../contracts/ai-command-contracts";
import type { AiReservationV1 } from "../contracts/ai-dependency-contracts";

/** Advances future-plan claims from actual outcomes before any optional-plan release; terminal authority releases them. */
export function reconcileAiProductionReservations(
  reservations: readonly AiReservationV1[],
  outcomes: readonly AiCommandOutcomeV1[]
): readonly AiReservationV1[] {
  return outcomes.reduce<readonly AiReservationV1[]>((current, outcome) => {
    const effectKey = `effect:${outcome.identity.effectId}`;
    const effect = current.find((reservation) => reservation.ownerPlanId.startsWith("plan:production-transition:") &&
      reservation.subjectKey === effectKey);
    if (!effect) return current;
    const claimStem = outcome.identity.effectId.replace(":effect:", ":claim:");
    return current.flatMap((reservation) => {
      if (reservation.ownerPlanId !== effect.ownerPlanId ||
        (reservation.claimId !== claimStem && !reservation.claimId.startsWith(`${claimStem}:`))) return [reservation];
      if (["completed", "rejected", "cancelled", "failed"].includes(outcome.kind)) return [];
      if (reservation.state.kind === "applied_spending" || reservation.state.kind === "refundable_work") return [reservation];
      if (outcome.kind === "dispatched") {
        return [{
          ...reservation, state: { kind: "dispatched" as const, commandId: outcome.identity.commandId }
        }];
      }
      return [{ ...reservation, state: { kind: "applied_spending" as const, appliedTick: outcome.tick } }];
    });
  }, reservations);
}
