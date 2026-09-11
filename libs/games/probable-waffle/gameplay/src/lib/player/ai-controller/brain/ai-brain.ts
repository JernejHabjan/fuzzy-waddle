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
import { planAiStage6V1 } from "../planning/ai-stage-6-planner";
import { AI_PROVISIONAL_LEASE_DURATION_TICKS } from "./create-ai-brain-state-v1";
import { aiDeadline } from "../contracts/ai-core-types";

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

function normalizePrimarySquadOwnership(squads: AiBrainStateV1["squads"]): AiBrainStateV1["squads"] {
  const rolePriority: Record<AiBrainStateV1["squads"][number]["role"], number> = {
    defense: 0,
    escort: 1,
    attack: 2,
    reinforcement: 3,
    reserve: 4,
    scout: 5
  };
  const claimed = new Set<string>();
  return [...squads]
    .sort(
      (left, right) =>
        rolePriority[left.role] - rolePriority[right.role] ||
        Number(right.squadId.includes(":domain:")) - Number(left.squadId.includes(":domain:")) ||
        left.squadId.localeCompare(right.squadId)
    )
    .map((squad) => {
      const actorIds = squad.actorIds.filter((actorId) => !claimed.has(actorId));
      actorIds.forEach((actorId) => claimed.add(actorId));
      const owned = new Set(actorIds);
      return {
        ...squad,
        actorIds,
        ...(squad.tactics
          ? {
              tactics: {
                ...squad.tactics,
                orderedActorIds: squad.tactics.orderedActorIds.filter((actorId) => owned.has(actorId)),
                assignedPositions: squad.tactics.assignedPositions.filter((entry) => owned.has(entry.actorId)),
                damageReservations: squad.tactics.damageReservations.filter((entry) => owned.has(entry.actorId)),
                mobileReserveActorIds: squad.tactics.mobileReserveActorIds.filter((actorId) => owned.has(actorId))
              }
            }
          : {})
      };
    })
    .sort((left, right) => left.squadId.localeCompare(right.squadId));
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
      .map((manager) => {
        try {
          return manager.propose(observation, previousState);
        } catch (error) {
          return {
            managerId: manager.managerId,
            lane: "optional_infrastructure_tech",
            evaluated: false,
            intents: [],
            reasons: [`technical_fault:${error instanceof Error ? error.name : "unknown"}`]
          } satisfies AiManagerProposalV1;
        }
      });
    const planning = planAiStage6V1(observation, previousState, orderedOutcomes, proposalBatches, this.profile);
    // A proposer may own a persisted projection (opening/demand state) but never
    // mutates the previous brain directly. Stable manager order makes competing
    // narrow projections deterministic; Stage 7 is currently the sole owner.
    // Stage 8 extends that established seam with its non-overlapping transport projection.
    // Stage 9 appends only newly-created transport children after the owner has advanced them.
    // Stage 14 merges only its `demand:adapt:` rows and saved rationale after the macro ledger.
    const projectedState = proposalBatches.reduce<AiBrainStateV1>((state, batch) => {
      const patch = batch.statePatch;
      if (!patch) return state;
      const { transportAppend, squadUpdates, adaptation, adaptationDemands, openingArchetypeId, ...replacePatch } =
        patch;
      return {
        ...state,
        ...replacePatch,
        ...(openingArchetypeId ? { opening: { ...state.opening, archetypeId: openingArchetypeId } } : {}),
        ...(adaptation || adaptationDemands
          ? {
              economyProduction: {
                ...state.economyProduction,
                ...(adaptation ? { adaptation } : {}),
                ...(adaptationDemands
                  ? {
                      demands: [
                        ...state.economyProduction.demands.filter(
                          (demand) => !demand.demandId.startsWith("demand:adapt:")
                        ),
                        ...adaptationDemands
                      ].sort((left, right) => left.demandId.localeCompare(right.demandId))
                    }
                  : {})
              }
            }
          : {}),
        ...(transportAppend?.length
          ? {
              transport: [
                ...state.transport,
                ...transportAppend.filter(
                  (candidate) => !state.transport.some((current) => current.planId === candidate.planId)
                )
              ]
            }
          : {}),
        ...(squadUpdates?.length
          ? {
              squads: [
                ...state.squads.filter((squad) => !squadUpdates.some((update) => update.squadId === squad.squadId)),
                ...squadUpdates
              ].sort((left, right) => left.squadId.localeCompare(right.squadId))
            }
          : {})
      };
    }, planning.state);
    const modeIsTerminal = observation.modeGoals.some(
      (goal) => goal.owner === observation.playerNumber && (goal.state === "completed" || goal.state === "failed")
    );
    // Once authoritative mode rules have resolved the player, keep projecting the
    // final debug/state snapshot but never enqueue post-game economy or combat work.
    const intents = modeIsTerminal ? [] : [...planning.proposals].sort(compareIntents);
    const decisions: AiIntentDecisionV1[] = [...planning.preDecisions];
    const accepted: AiIntentV1[] = [];
    const existingClaims = new Set<string>(
      planning.state.reservations.flatMap((reservation) =>
        [reservation.claimId, reservation.subjectKey].filter((key): key is string => key !== undefined)
      )
    );
    const claimedThisStep = new Set<string>();
    const resourceClaims = new Map<ResourceType, number>();

    for (const intent of intents) {
      if (!validateIntentNumbers(intent)) {
        decisions.push({ outcome: "rejected", intent, reason: "invalid_numeric_input", detail: "numeric_guard" });
        continue;
      }
      if (
        decisions.filter((decision) => decision.outcome === "accepted" || decision.reason !== "claim_conflict")
          .length >= this.profile.maxIntentProposalsPerStep ||
        accepted.length >= this.profile.maxAcceptedCommandBatchesPerStep
      ) {
        decisions.push({ outcome: "rejected", intent, reason: "profile_limit", detail: "step_budget" });
        continue;
      }
      const failed = intent.preconditions.find(
        (precondition) => !preconditionSatisfied(precondition, observation, projectedState)
      );
      if (failed) {
        decisions.push({ outcome: "rejected", intent, reason: "precondition_failed", detail: failed.kind });
        continue;
      }

      const exclusiveConflict = intent.claims.find(
        (claim) =>
          claim.kind !== "resource" &&
          (claimedThisStep.has(claimKey(claim)) ||
            claimedThisStep.has(claim.claimId) ||
            existingClaims.has(claimKey(claim)) ||
            existingClaims.has(claim.claimId))
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
          claimedThisStep.add(claimKey(claim));
          claimedThisStep.add(claim.claimId);
        }
      }
      accepted.push(intent);
      decisions.push({ outcome: "accepted", intent, reason: "accepted" });
    }

    const acceptedReservations = accepted.flatMap((intent) =>
      intent.claims.map((claim) => ({
        claimId: claim.claimId,
        subjectKey: claimKey(claim),
        ownerPlanId: intent.planId,
        state: {
          kind: "provisional" as const,
          expiresAt: aiDeadline(observation.tick + AI_PROVISIONAL_LEASE_DURATION_TICKS)
        },
        prerequisites: [],
        createdTick: observation.tick
      }))
    );
    const releasedRecoveryClaims = new Set(
      projectedState.recovery.records
        .filter((record) => record.state === "abandoned")
        .flatMap((record) => record.releasedClaimIds)
    );
    const acceptedEffectIds = new Set(accepted.map((intent) => intent.effectId));
    const previousSupportIds = new Set(previousState.support.map((plan) => plan.planId));
    const previousDamageEffectIds = new Set(
      previousState.squads.flatMap(
        (squad) =>
          squad.tactics?.damageReservations
            .map((reservation) => reservation.effectId)
            .filter((effectId): effectId is string => effectId !== undefined) ?? []
      )
    );
    const normalizedSquads = normalizePrimarySquadOwnership(projectedState.squads);
    const nextState: AiBrainStateV1 = {
      ...projectedState,
      support: projectedState.support.filter(
        (plan) =>
          previousSupportIds.has(plan.planId) ||
          plan.effectId == null ||
          acceptedEffectIds.has(plan.effectId as AiIntentV1["effectId"])
      ),
      squads: normalizedSquads.map((squad) => {
        if (!squad.tactics) return squad;
        const previousSquad = previousState.squads.find((candidate) => candidate.squadId === squad.squadId);
        const retainedOrderedActorIds =
          previousSquad?.tactics?.orderSignature === squad.tactics.orderSignature
            ? previousSquad.tactics.orderedActorIds
            : [];
        const acceptedOrderedActorIds = accepted
          .filter(
            (intent) =>
              intent.planId === `plan:${squad.squadId}` && (intent.kind === "move" || intent.kind === "attack")
          )
          .flatMap((intent) => ("actorIds" in intent ? [...intent.actorIds] : []));
        return {
          ...squad,
          tactics: {
            ...squad.tactics,
            orderedActorIds: [...new Set([...retainedOrderedActorIds, ...acceptedOrderedActorIds])]
              .filter((actorId) => squad.actorIds.includes(actorId))
              .sort(),
            damageReservations: squad.tactics.damageReservations.filter(
              (reservation) =>
                reservation.effectId === undefined ||
                previousDamageEffectIds.has(reservation.effectId) ||
                acceptedEffectIds.has(reservation.effectId as AiIntentV1["effectId"])
            )
          }
        };
      }),
      reservations: [
        ...projectedState.reservations.filter(
          (existing) =>
            !releasedRecoveryClaims.has(existing.claimId) &&
            !acceptedReservations.some(
              (acceptedReservation) =>
                acceptedReservation.ownerPlanId === existing.ownerPlanId &&
                (acceptedReservation.claimId === existing.claimId ||
                  acceptedReservation.subjectKey === existing.subjectKey)
            )
        ),
        ...acceptedReservations
      ].sort((left, right) => left.claimId.localeCompare(right.claimId))
    };
    const debugSnapshot = projectAiDebugSnapshot(observation, nextState, decisions, proposalBatches);
    return { nextState, acceptedIntents: accepted, decisions, trace: decisions, debugSnapshot };
  }
}
