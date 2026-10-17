import type { AiCommandOutcomeV1 } from "../contracts/ai-command-contracts";
import type { AiReservationV1 } from "../contracts/ai-dependency-contracts";

/** Advances future-plan claims from actual outcomes before any optional-plan release; terminal authority releases them. */
export function reconcileAiProductionReservations(
  reservations: readonly AiReservationV1[],
  outcomes: readonly AiCommandOutcomeV1[]
): readonly AiReservationV1[] {
  return outcomes.reduce<readonly AiReservationV1[]>((current, outcome) => {
    const effectKey = `effect:${outcome.identity.effectId}`;
    const ownedEffects = current.filter(
      (reservation) =>
        reservation.ownerPlanId.startsWith("plan:production-transition:") &&
        reservation.subjectKey?.startsWith("effect:")
    );
    const matches = ownedEffects.filter(
      (reservation) =>
        reservation.subjectKey?.slice("effect:".length).replace(/^effect:/, "") ===
        outcome.identity.effectId.replace(/^effect:/, "")
    );
    const effect =
      ownedEffects.find((reservation) => reservation.subjectKey === effectKey) ??
      (matches.length === 1 ? matches[0] : undefined);
    const subject = effect?.subjectKey;
    if (!effect || !subject) return current;
    const claimStem = subject.slice("effect:".length).replace(":effect:", ":claim:");
    return current.flatMap((reservation) => {
      if (
        reservation.ownerPlanId !== effect.ownerPlanId ||
        (reservation.claimId !== claimStem && !reservation.claimId.startsWith(`${claimStem}:`))
      )
        return [reservation];
      if (["completed", "rejected", "cancelled", "failed"].includes(outcome.kind)) return [];
      if (reservation.state.kind === "applied_spending" || reservation.state.kind === "refundable_work")
        return [reservation];
      if (outcome.kind === "dispatched") {
        return [
          {
            ...reservation,
            state: { kind: "dispatched" as const, commandId: outcome.identity.commandId }
          }
        ];
      }
      return [{ ...reservation, state: { kind: "applied_spending" as const, appliedTick: outcome.tick } }];
    });
  }, reservations);
}
