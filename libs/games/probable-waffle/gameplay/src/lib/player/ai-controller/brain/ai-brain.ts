import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCommandOutcomeV1 } from "../contracts/ai-command-contracts";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import { assertAiBrainStateV1, assertAiObservationV1 } from "../contracts/validate-ai-contracts-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "../planning/ai-manager-proposal";
import { projectAiDebugSnapshot } from "../debug/project-ai-debug-snapshot";
import { planAiDecisions } from "../planning/ai-decision-planner";
import { AI_PROVISIONAL_LEASE_DURATION_TICKS } from "./create-ai-brain-state-v1";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiBrainV1 } from "./ai-brain-v1";
import type { AiBrainStepResultV1 } from "./ai-brain-step-result-v1";
import { projectAiManagerState } from "./project-ai-manager-state";
import { aiClaimKey, arbitrateAiIntents } from "./ai-intent-arbiter";

export type { AiBrainV1 } from "./ai-brain-v1";
export type { AiBrainStepResultV1 } from "./ai-brain-step-result-v1";

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

/**
 * Minimal deterministic Stage 2 reducer. It collects read-only manager proposals, applies
 * observation preconditions and claims, and publishes one immutable decision/debug result.
 */
export class PureAiBrain implements AiBrainV1 {
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
    const planning = planAiDecisions(observation, previousState, orderedOutcomes, proposalBatches, this.profile);
    // A proposer may own a persisted projection (opening/demand state) but never
    // mutates the previous brain directly. Stable manager order makes competing
    // narrow projections deterministic; Stage 7 is currently the sole owner.
    // Stage 8 extends that established seam with its non-overlapping transport projection.
    // Stage 9 appends only newly-created transport children after the owner has advanced them.
    // Stage 14 merges only its `demand:adapt:` rows and saved rationale after the macro ledger.
    const projectedState = projectAiManagerState(planning.state, proposalBatches);
    const modeIsTerminal = observation.modeGoals.some(
      (goal) => goal.owner === observation.playerNumber && (goal.state === "completed" || goal.state === "failed")
    );
    // Once authoritative mode rules have resolved the player, keep projecting the
    // final debug/state snapshot but never enqueue post-game economy or combat work.
    const intents = modeIsTerminal ? [] : planning.proposals;
    const spendingBudget = proposalBatches.find((batch) => batch.spendingBudget)?.spendingBudget;
    const { accepted, decisions } = arbitrateAiIntents(
      observation, projectedState, intents, planning.preDecisions, this.profile, spendingBudget
    );

    const acceptedReservations = accepted.flatMap((intent) =>
      intent.claims.map((claim) => ({
        claimId: claim.claimId,
        subjectKey: aiClaimKey(claim),
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
