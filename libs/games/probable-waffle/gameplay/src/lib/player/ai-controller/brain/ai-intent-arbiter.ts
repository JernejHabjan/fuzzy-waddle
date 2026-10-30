import { OrderType, type ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type {
  AiIntentClaimV1,
  AiIntentDecisionV1,
  AiIntentPreconditionV1,
  AiIntentV1
} from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import { aiSpendingBudgetConflict, type AiSpendingBudget } from "./ai-spending-budget";
import { aiIslandResourceReserve } from "./ai-island-resource-reserve";
import { canRenewAiSquadActorClaim } from "./ai-squad-actor-claims";
import { isSafeAiGathererRetask } from "../planning/ai-gatherer-retask";

/** One deterministic admission pass across proposals from all managers. */
export interface AiIntentArbitrationResult {
  readonly accepted: readonly AiIntentV1[];
  readonly decisions: readonly AiIntentDecisionV1[];
}

function compareIntents(left: AiIntentV1, right: AiIntentV1): number {
  return (
    left.urgencyClass - right.urgencyClass ||
    right.utility - left.utility ||
    left.intentId.localeCompare(right.intentId)
  );
}

function preconditionSatisfied(
  precondition: AiIntentPreconditionV1,
  observation: AiObservationV1,
  state: AiBrainStateV1
): boolean {
  switch (precondition.kind) {
    case "actor_exists":
      return observation.actors.some((actor) => actor.actorId === precondition.actorId);
    case "resource_at_least": {
      const resource = observation.resources.find((entry) => entry.resourceType === precondition.resourceType);
      return (
        resource !== undefined &&
        availableResource(observation, state, precondition.resourceType) >= precondition.amount
      );
    }
    case "supply_at_least": {
      let capacity = 0;
      let used = 0;
      for (const actor of observation.actors.filter((candidate) => candidate.relation === "self")) {
        if (actor.housingCapacity.status === "known") capacity += actor.housingCapacity.value;
        if (actor.housingCost.status === "known") used += actor.housingCost.value;
      }
      return capacity - used >= precondition.amount;
    }
    case "capability_supported":
      return observation.actors.some((actor) =>
        actor.capabilities.some((capability) => capability.id === precondition.capabilityId)
      );
    case "query_ready":
      return observation.accessProducts.some(
        (product) => product.queryId === precondition.queryId && product.status === "ready"
      );
    case "target_visible":
      return observation.actors.some(
        (actor) => actor.actorId === precondition.actorId && actor.visibility !== "last_seen"
      );
    case "plan_active":
      return (
        (state.opening.plan.planId === precondition.planId && state.opening.plan.lifecycle === "active") ||
        state.transport.some(
          (plan) =>
            `plan:${plan.planId}` === precondition.planId &&
            plan.phase !== "completed" &&
            plan.phase !== "cancelled" &&
            plan.phase !== "failed"
        ) ||
        state.squads.some(
          (squad) =>
            `plan:${squad.squadId}` === precondition.planId &&
            squad.state !== "completed" &&
            squad.state !== "cancelled"
        ) ||
        (precondition.planId === "plan:mode:concession" && state.skirmish.mode.state === "conceding")
      );
  }
}

/** A worker's applied gather lease may transfer to safe construction or a new gathering target. */
function canRetaskGatherer(
  intent: AiIntentV1,
  claim: AiIntentClaimV1,
  state: AiBrainStateV1,
  observation: AiObservationV1
): boolean {
  if ((intent.kind !== "construct" && intent.kind !== "assign_gatherers") || claim.kind !== "actor") return false;
  const actor = observation.actors.find(
    (candidate) =>
      candidate.actorId === claim.actorId && candidate.relation === "self" && candidate.visibility === "owned"
  );
  if (
    !actor ||
    !isSafeAiGathererRetask(actor) ||
    actor.activeOrder?.status !== "known" ||
    actor.activeOrder.value?.orderType !== OrderType.Gather
  )
    return false;
  if (intent.kind === "assign_gatherers") {
    const target = observation.actors.find((candidate) => candidate.actorId === intent.sourceActorId);
    if (
      !intent.actorIds.includes(claim.actorId) ||
      actor.activeOrder.value.targetActorId === intent.sourceActorId ||
      !target ||
      target.relation === "enemy" ||
      target.visibility === "last_seen" ||
      target.resourceState.status !== "known" ||
      target.resourceState.value.resourceType !== intent.resourceType ||
      target.resourceState.value.available.status !== "known" ||
      target.resourceState.value.available.value <= 0
    ) return false;
  }
  const actorReservations = state.reservations.filter(
    (reservation) => reservation.subjectKey === `actor:${claim.actorId}`
  );
  return (
    actorReservations.length > 0 &&
    actorReservations.every((reservation) => reservation.state.kind === "applied_spending")
  );
}

/** Stable exclusive-claim identity shared by admission and provisional reservation. */
export function aiClaimKey(claim: AiIntentClaimV1): string {
  switch (claim.kind) {
    case "actor":
      return `actor:${claim.actorId}`;
    case "resource":
      return `resource:${claim.resourceType}`;
    case "production_slot":
      return `production:${claim.producerId}:${claim.slot}`;
    case "site":
      return `site:${claim.siteKey}`;
    case "cargo_seat":
      return `cargo:${claim.transportId}`;
    case "effect":
      return `effect:${claim.effectId}`;
  }
}

function validateIntentNumbers(intent: AiIntentV1): boolean {
  if (!Number.isSafeInteger(intent.proposedTick) || intent.proposedTick < 0) return false;
  if (!Number.isSafeInteger(intent.urgencyClass) || intent.urgencyClass < 0) return false;
  if (!Number.isSafeInteger(intent.utility) || intent.utility < 0 || intent.utility > 1000) return false;
  return intent.claims.every((claim) => {
    if (claim.kind === "resource") return Number.isFinite(claim.amount) && claim.amount >= 0;
    if (claim.kind === "cargo_seat") return Number.isSafeInteger(claim.seats) && claim.seats > 0;
    if (claim.kind === "production_slot") return Number.isSafeInteger(claim.slot) && claim.slot >= 0;
    return true;
  });
}

function pendingResourceClaims(state: AiBrainStateV1, resourceType: ResourceType): number {
  let total = 0;
  for (const reservation of state.reservations) {
    if (
      reservation.subjectKey !== `resource:${resourceType}` ||
      (reservation.state.kind !== "provisional" && reservation.state.kind !== "dispatched")
    )
      continue;
    // Old saves have no amount for these leases. Fail closed until their owner reconciles or the lease expires.
    if (
      !Number.isFinite(reservation.resourceAmount) ||
      reservation.resourceAmount === undefined ||
      reservation.resourceAmount < 0
    )
      return Number.MAX_SAFE_INTEGER;
    total += reservation.resourceAmount;
  }
  return total;
}

function availableResource(observation: AiObservationV1, state: AiBrainStateV1, resourceType: ResourceType): number {
  const entry = observation.resources.find((resource) => resource.resourceType === resourceType);
  return entry
    ? entry.stockpile - entry.reservedUnspent - entry.obligationsDue - pendingResourceClaims(state, resourceType)
    : 0;
}

/** Applies preconditions, exclusive claims, shared stockpile and current strategic spending posture in that order. */
export function arbitrateAiIntents(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  proposals: readonly AiIntentV1[],
  preDecisions: readonly AiIntentDecisionV1[],
  profile: AiProfileConfigV1,
  spendingBudget: AiSpendingBudget | undefined
): AiIntentArbitrationResult {
  const intents = [...proposals].sort(compareIntents);
  const decisions: AiIntentDecisionV1[] = [...preDecisions];
  const accepted: AiIntentV1[] = [];
  const existingClaims = new Set<string>(
    state.reservations.flatMap((reservation) =>
      [reservation.claimId, reservation.subjectKey].filter((key): key is string => key !== undefined)
    )
  );
  const claimedThisStep = new Set<string>();
  const resourceClaims = new Map<ResourceType, number>();
  const categorySpend = { economy: new Map<ResourceType, number>(), defense: new Map<ResourceType, number>() };
  const pendingBudgetIntents = new Set(intents.map((intent) => intent.intentId));

  for (const intent of intents) {
    pendingBudgetIntents.delete(intent.intentId);
    if (!validateIntentNumbers(intent)) {
      decisions.push({ outcome: "rejected", intent, reason: "invalid_numeric_input", detail: "numeric_guard" });
      continue;
    }
    // Retain every unresolved effect; admission, rather than eviction, owns pending-outcome capacity.
    if (accepted.length >= Math.max(0, state.authority.pendingLimit - state.authority.pendingCommandIds.length)) {
      decisions.push({ outcome: "rejected", intent, reason: "profile_limit", detail: "authority_backpressure" });
      continue;
    }
    if (
      decisions.filter((decision) => decision.outcome === "accepted" || decision.reason !== "claim_conflict").length >=
        profile.maxIntentProposalsPerStep ||
      accepted.length >= profile.maxAcceptedCommandBatchesPerStep
    ) {
      decisions.push({ outcome: "rejected", intent, reason: "profile_limit", detail: "step_budget" });
      continue;
    }
    const failed = intent.preconditions.find(
      (precondition) => !preconditionSatisfied(precondition, observation, state)
    );
    if (failed) {
      decisions.push({ outcome: "rejected", intent, reason: "precondition_failed", detail: failed.kind });
      continue;
    }
    const exclusiveConflict = intent.claims.find(
      (claim) =>
        claim.kind !== "resource" &&
        (claimedThisStep.has(aiClaimKey(claim)) ||
          claimedThisStep.has(claim.claimId) ||
          ((existingClaims.has(aiClaimKey(claim)) || existingClaims.has(claim.claimId)) &&
            !canRenewAiSquadActorClaim(intent, claim, state, observation) &&
            !canRetaskGatherer(intent, claim, state, observation)))
    );
    if (exclusiveConflict) {
      decisions.push({ outcome: "rejected", intent, reason: "claim_conflict", detail: aiClaimKey(exclusiveConflict) });
      continue;
    }
    const resourceConflict = intent.claims.find(
      (claim) =>
        claim.kind === "resource" &&
        (resourceClaims.get(claim.resourceType) ?? 0) + claim.amount >
          availableResource(observation, state, claim.resourceType) -
            aiIslandResourceReserve(observation, state, intent, accepted, claim.resourceType)
    );
    if (resourceConflict?.kind === "resource") {
      decisions.push({
        outcome: "rejected",
        intent,
        reason: "resource_conflict",
        detail: resourceConflict.resourceType
      });
      continue;
    }
    const budgetConflict = aiSpendingBudgetConflict(
      intent,
      intents.filter(
        (candidate) =>
          pendingBudgetIntents.has(candidate.intentId) &&
          candidate.preconditions.every((condition) => preconditionSatisfied(condition, observation, state)) &&
          candidate.claims.every((claim) =>
            claim.kind === "resource"
              ? (resourceClaims.get(claim.resourceType) ?? 0) + claim.amount <=
                availableResource(observation, state, claim.resourceType)
              : !claimedThisStep.has(aiClaimKey(claim)) && !existingClaims.has(aiClaimKey(claim))
          )
      ),
      spendingBudget,
      (resourceType) => Math.max(0, availableResource(observation, state, resourceType)),
      resourceClaims,
      categorySpend
    );
    if (budgetConflict) {
      decisions.push({ outcome: "rejected", intent, reason: "posture_budget", detail: budgetConflict });
      continue;
    }
    for (const claim of intent.claims) {
      if (claim.kind === "resource") {
        resourceClaims.set(claim.resourceType, (resourceClaims.get(claim.resourceType) ?? 0) + claim.amount);
        if (intent.spendingCategory === "economy" || intent.spendingCategory === "defense") {
          const spend = categorySpend[intent.spendingCategory];
          spend.set(claim.resourceType, (spend.get(claim.resourceType) ?? 0) + claim.amount);
        }
      } else {
        claimedThisStep.add(aiClaimKey(claim));
        claimedThisStep.add(claim.claimId);
      }
    }
    accepted.push(intent);
    decisions.push({ outcome: "accepted", intent, reason: "accepted" });
  }
  return { accepted, decisions };
}
