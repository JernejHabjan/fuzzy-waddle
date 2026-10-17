import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiIntentClaimV1, AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";

/** A squad may replace its own provisional movement/attack lease to retreat; other owners and commitments stay exclusive. */
export function canRenewAiSquadActorClaim(
  intent: AiIntentV1,
  claim: AiIntentClaimV1,
  state: AiBrainStateV1,
  observation: AiObservationV1
): boolean {
  if (claim.kind !== "actor" || !["move", "attack", "stop"].includes(intent.kind)) return false;
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
        reservation.state.kind === "provisional"
    )
  );
}
