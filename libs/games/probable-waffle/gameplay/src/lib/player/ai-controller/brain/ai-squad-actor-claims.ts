import type { AiBrainState } from "../contracts/ai-brain-state";
import type { AiIntentClaim, AiIntent } from "../contracts/ai-intent";
import type { AiObservation } from "../contracts/ai-observation";

/** A squad may replace its own provisional lease, or interrupt its own dispatched order to cast; other commitments stay exclusive. */
export function canRenewAiSquadActorClaim(
  intent: AiIntent,
  claim: AiIntentClaim,
  state: AiBrainState,
  observation: AiObservation
): boolean {
  if (claim.kind !== "actor" || !["move", "attack", "stop", "cast", "scout"].includes(intent.kind)) return false;
  if (
    !observation.actors.some(
      (actor) => actor.actorId === claim.actorId && actor.relation === "self" && actor.visibility === "owned"
    )
  )
    return false;
  if (
    !state.squads.some(
      (squad) =>
        `plan:${squad.squadId}` === intent.planId &&
        !["completed", "cancelled"].includes(squad.state) &&
        squad.actorIds.includes(claim.actorId)
    )
  )
    return false;
  const reservations = state.reservations.filter(
    (reservation) => reservation.subjectKey === `actor:${claim.actorId}` || reservation.claimId === claim.claimId
  );
  return (
    reservations.length > 0 &&
    reservations.every(
      (reservation) =>
        reservation.subjectKey === `actor:${claim.actorId}` &&
        reservation.ownerPlanId === intent.planId &&
        (reservation.state.kind === "provisional" ||
          (intent.kind === "cast" && reservation.state.kind === "dispatched"))
    )
  );
}
