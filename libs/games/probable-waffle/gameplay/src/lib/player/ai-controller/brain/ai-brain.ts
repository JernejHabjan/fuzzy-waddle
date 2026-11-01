import type { AiBrainState } from "../contracts/state/ai-state-contracts";
import { aiTransportReleasedClaimIds } from "./arbitration/ai-transport-released-claims";
import type { AiCommandOutcome } from "../contracts/commands/ai-command-contracts";
import type { AiIntent } from "../contracts/commands/ai-intent";
import type { AiObservation } from "../contracts/observation/ai-observation";
import type { AiProfileConfig } from "../contracts/ai-profile-config";
import { assertAiBrainState, assertAiObservation } from "../contracts/validation/validate-ai-contracts";
import type { AiProposalManager } from "../planning/coordination/ai-manager-proposal";
import { projectAiDebugSafely } from "../debug/project-ai-debug-safely";
import { collectAiProposals } from "./arbitration/ai-optional-boundaries";
import type { AiBrainBoundaryHooks } from "./ai-brain-boundary-hooks";
import { planAiDecisions, reconcileAiDecisionReservations } from "../planning/coordination/ai-decision-planner";
import { AI_PROVISIONAL_LEASE_DURATION_TICKS } from "./state/create-ai-brain-state";
import { aiDeadline } from "../contracts/ai-core-types";
import type { AiBrain } from "./ai-brain-contract";
import type { AiBrainStepResult } from "./ai-brain-step-result";
import { projectAiManagerState } from "./state/project-ai-manager-state";
import { aiClaimKey, arbitrateAiIntents } from "./arbitration/ai-intent-arbiter";

export type { AiBrain } from "./ai-brain-contract";
export type { AiBrainStepResult } from "./ai-brain-step-result";

function normalizePrimarySquadOwnership(squads: AiBrainState["squads"]): AiBrainState["squads"] {
  const rolePriority: Record<AiBrainState["squads"][number]["role"], number> = {
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
export class PureAiBrain implements AiBrain {
  constructor(
    private readonly profile: AiProfileConfig,
    private readonly managers: readonly AiProposalManager[],
    private readonly boundaryHooks?: AiBrainBoundaryHooks
  ) {}

  step(
    observation: AiObservation,
    previousState: AiBrainState,
    orderedOutcomes: readonly AiCommandOutcome[]
  ): AiBrainStepResult {
    this.boundaryHooks?.assertAuthority?.(observation);
    assertAiObservation(observation);
    assertAiBrainState(previousState);
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

    const proposalState: AiBrainState = {
      ...previousState,
      reservations: reconcileAiDecisionReservations(previousState, orderedOutcomes, observation.tick)
    };
    const collected = collectAiProposals(
      this.managers,
      observation,
      proposalState,
      this.profile.decisionIntervalTicks,
      this.profile.maxIntentProposalsPerStep,
      this.boundaryHooks
    );
    const proposalBatches = collected.batches;
    const planning = planAiDecisions(
      observation,
      { ...proposalState, scheduler: { ...proposalState.scheduler, boundaryFaults: collected.faults } },
      orderedOutcomes,
      proposalBatches,
      this.profile
    );
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
      observation,
      projectedState,
      intents,
      planning.preDecisions,
      this.profile,
      spendingBudget
    );

    const acceptedReservations = accepted.flatMap((intent) =>
      intent.claims.map((claim) => ({
        claimId: claim.claimId,
        subjectKey: aiClaimKey(claim),
        ...(claim.kind === "resource" ? { resourceAmount: claim.amount } : {}),
        ownerPlanId: intent.planId,
        state: {
          kind: "provisional" as const,
          expiresAt: aiDeadline(observation.tick + AI_PROVISIONAL_LEASE_DURATION_TICKS)
        },
        prerequisites: [],
        createdTick: observation.tick,
        priority: { urgencyClass: intent.urgencyClass, utility: intent.utility }
      }))
    );
    const releasedRecoveryClaims = new Set(
      projectedState.recovery.records
        .filter((record) => record.state === "abandoned")
        // Saved release lists are advisory: reconciliation may since have paid/dispatched a claim or changed its owner.
        .flatMap((record) =>
          projectedState.reservations
            .filter(
              (claim) =>
                claim.ownerPlanId === record.planId &&
                (claim.state.kind === "forecast" || claim.state.kind === "provisional") &&
                record.releasedClaimIds.includes(claim.claimId)
            )
            .map((claim) => claim.claimId)
        )
    );
    const acceptedEffectIds = new Set(accepted.map((intent) => intent.effectId));
    const retaskedActorKeys = new Set(
      accepted.flatMap((intent) =>
        intent.claims.filter((claim) => claim.kind === "actor").map((claim) => aiClaimKey(claim))
      )
    );
    const releasedTransportClaims = aiTransportReleasedClaimIds(projectedState);
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
    const nextState: AiBrainState = {
      ...projectedState,
      lanes: projectedState.lanes.map((lane) =>
        accepted.some((intent) => intent.lane === lane.lane) ? { ...lane, lastServicedTick: observation.tick } : lane
      ),
      support: projectedState.support.filter(
        (plan) =>
          previousSupportIds.has(plan.planId) ||
          plan.effectId == null ||
          acceptedEffectIds.has(plan.effectId as AiIntent["effectId"])
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
                acceptedEffectIds.has(reservation.effectId as AiIntent["effectId"])
            )
          }
        };
      }),
      reservations: [
        ...projectedState.reservations.filter(
          (existing) =>
            !releasedRecoveryClaims.has(existing.claimId) &&
            !releasedTransportClaims.has(existing.claimId) &&
            !retaskedActorKeys.has(existing.subjectKey ?? "") &&
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
    const debug = projectAiDebugSafely(
      observation,
      nextState,
      decisions,
      proposalBatches,
      this.profile.decisionIntervalTicks,
      this.boundaryHooks?.projectDebug
    );
    return {
      nextState: debug.state,
      acceptedIntents: accepted,
      decisions,
      trace: decisions,
      debugSnapshot: debug.snapshot
    };
  }
}
