import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCommandOutcomeV1 } from "../contracts/ai-command-contracts";
import type { AiDebugSnapshotV1 } from "../contracts/ai-debug-snapshot-v1";
import type {
  AiIntentClaimV1,
  AiIntentDecisionV1,
  AiIntentPreconditionV1,
  AiIntentV1
} from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import { assertAiBrainStateV1, assertAiObservationV1 } from "../contracts/validate-ai-contracts-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "../planning/ai-manager-proposal";
import { projectAiDebugSnapshot } from "../debug/project-ai-debug-snapshot";

/** Result of one pure decision boundary. */
export interface AiBrainStepResultV1 {
  readonly nextState: AiBrainStateV1;
  readonly acceptedIntents: readonly AiIntentV1[];
  readonly decisions: readonly AiIntentDecisionV1[];
  readonly trace: readonly AiIntentDecisionV1[];
  readonly debugSnapshot: AiDebugSnapshotV1;
}

/** Pure brain boundary used by the host runtime adapter. */
export interface AiBrainV1 {
  step(
    observation: AiObservationV1,
    previousState: AiBrainStateV1,
    orderedOutcomes: readonly AiCommandOutcomeV1[]
  ): AiBrainStepResultV1;
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
        resource.stockpile - resource.reservedUnspent - resource.obligationsDue >= precondition.amount
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
      return state.opening.plan.planId === precondition.planId && state.opening.plan.lifecycle === "active";
  }
}

function claimKey(claim: AiIntentClaimV1): string {
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

function availableResource(observation: AiObservationV1, resourceType: ResourceType): number {
  const entry = observation.resources.find((resource) => resource.resourceType === resourceType);
  return entry ? entry.stockpile - entry.reservedUnspent - entry.obligationsDue : 0;
}

/**
 * Minimal deterministic Stage 2 reducer. It collects read-only manager proposals, applies
 * observation preconditions and claims, and publishes one immutable decision/debug result.
 */
export class PureAiBrainV1 implements AiBrainV1 {
  constructor(
    private readonly profile: AiProfileConfigV1,
    private readonly managers: readonly AiProposalManagerV1[]
  ) {}

  step(
    observation: AiObservationV1,
    previousState: AiBrainStateV1,
    orderedOutcomes: readonly AiCommandOutcomeV1[]
  ): AiBrainStepResultV1 {
    assertAiObservationV1(observation);
    assertAiBrainStateV1(previousState);
    if (observation.playerNumber !== previousState.playerNumber || observation.faction !== previousState.faction) {
      throw new Error("ai_observation_owner_mismatch");
    }
    if (observation.tick < previousState.lastCommittedTick) throw new Error("stale_ai_observation");
    for (let index = 1; index < orderedOutcomes.length; index += 1) {
      const previousOutcome = orderedOutcomes[index - 1];
      const currentOutcome = orderedOutcomes[index];
      if (!previousOutcome || !currentOutcome) continue;
      const previous = previousOutcome.identity;
      const current = currentOutcome.identity;
      if (
        previous.authorityEpoch > current.authorityEpoch ||
        (previous.authorityEpoch === current.authorityEpoch && previous.sequence > current.sequence)
      ) {
        throw new Error("unordered_ai_outcomes");
      }
    }

    const proposalBatches: AiManagerProposalV1[] = [...this.managers]
      .sort((left, right) => left.managerId.localeCompare(right.managerId))
      .map((manager) => manager.propose(observation, previousState));
    const intents = proposalBatches.flatMap((batch) => batch.intents).sort(compareIntents);
    const decisions: AiIntentDecisionV1[] = [];
    const accepted: AiIntentV1[] = [];
    const claimedKeys = new Set<string>();
    const resourceClaims = new Map<ResourceType, number>();

    for (const intent of intents) {
      if (!validateIntentNumbers(intent)) {
        decisions.push({ outcome: "rejected", intent, reason: "invalid_numeric_input", detail: "numeric_guard" });
        continue;
      }
      if (
        decisions.length >= this.profile.maxIntentProposalsPerStep ||
        accepted.length >= this.profile.maxAcceptedCommandBatchesPerStep
      ) {
        decisions.push({ outcome: "rejected", intent, reason: "profile_limit", detail: "step_budget" });
        continue;
      }
      const failed = intent.preconditions.find(
        (precondition) => !preconditionSatisfied(precondition, observation, previousState)
      );
      if (failed) {
        decisions.push({ outcome: "rejected", intent, reason: "precondition_failed", detail: failed.kind });
        continue;
      }

      const exclusiveConflict = intent.claims.find(
        (claim) => claim.kind !== "resource" && claimedKeys.has(claimKey(claim))
      );
      if (exclusiveConflict) {
        decisions.push({ outcome: "rejected", intent, reason: "claim_conflict", detail: claimKey(exclusiveConflict) });
        continue;
      }
      const resourceConflict = intent.claims.find((claim) => {
        if (claim.kind !== "resource") return false;
        const committed = resourceClaims.get(claim.resourceType) ?? 0;
        return committed + claim.amount > availableResource(observation, claim.resourceType);
      });
      if (resourceConflict?.kind === "resource") {
        decisions.push({
          outcome: "rejected",
          intent,
          reason: "resource_conflict",
          detail: resourceConflict.resourceType
        });
        continue;
      }

      for (const claim of intent.claims) {
        if (claim.kind === "resource") {
          resourceClaims.set(claim.resourceType, (resourceClaims.get(claim.resourceType) ?? 0) + claim.amount);
        } else {
          claimedKeys.add(claimKey(claim));
        }
      }
      accepted.push(intent);
      decisions.push({ outcome: "accepted", intent, reason: "accepted" });
    }

    const nextState: AiBrainStateV1 = {
      ...previousState,
      lastCommittedTick: observation.tick,
      scheduler: {
        ...previousState.scheduler,
        decisionSequence: previousState.scheduler.decisionSequence + 1
      }
    };
    const debugSnapshot = projectAiDebugSnapshot(observation, nextState, decisions);
    return { nextState, acceptedIntents: accepted, decisions, trace: decisions, debugSnapshot };
  }
}
