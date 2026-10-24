import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";

/** Dropping optional cargo releases only its reversible actor lease; paid/uncertain commands retain their authority. */
export function aiTransportReleasedClaimIds(state: AiBrainStateV1) {
  return new Set(state.reservations.filter((claim) => {
    if (!claim.subjectKey?.startsWith("actor:") || !["forecast", "provisional"].includes(claim.state.kind)) return false;
    const plan = state.transport.find((entry) => `plan:${entry.planId}` === claim.ownerPlanId && entry.lifecycle);
    if (!plan?.lifecycle) return false;
    const actors = ["completed", "cancelled", "failed"].includes(plan.phase) ? [] :
      [...plan.passengerIds, ...plan.transportIds, ...plan.lifecycle.escortIds];
    return !actors.some((id) => claim.subjectKey === `actor:${id}`);
  }).map((claim) => claim.claimId));
}
