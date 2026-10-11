import type { AiBrainStateV1 } from "./ai-brain-state-v1";
import { assertAiNonNegativeFinite, assertAiNonNegativeInteger } from "./ai-core-types";
import { assertDeadline, assertUnique } from "./ai-validation-primitives";

/** Validates persisted squad membership and tactical commitments before planning. */
export function assertAiSquadStateV1(value: AiBrainStateV1): void {
  assertUnique(
    value.squads.map((squad) => squad.squadId),
    "squads.squadId"
  );
  assertUnique(
    value.squads.filter((squad) => squad.tactics).flatMap((squad) => [...squad.actorIds]),
    "squads.primaryActorOwner"
  );
  for (const squad of value.squads) {
    assertUnique([...squad.actorIds], `squads.${squad.squadId}.actorIds`);
    if (squad.lifecycle) {
      assertAiNonNegativeInteger(squad.lifecycle.createdTick, `squads.${squad.squadId}.createdTick`);
      assertAiNonNegativeInteger(squad.lifecycle.recoveryAttempt, `squads.${squad.squadId}.recoveryAttempt`);
      assertDeadline(squad.lifecycle.assemblyDeadline, `squads.${squad.squadId}.assemblyDeadline`);
      assertDeadline(squad.lifecycle.effectDeadline, `squads.${squad.squadId}.effectDeadline`);
      if (squad.lifecycle.lastUsefulEffectTick !== null) {
        assertAiNonNegativeInteger(
          squad.lifecycle.lastUsefulEffectTick,
          `squads.${squad.squadId}.lastUsefulEffectTick`
        );
      }
    }
    if (squad.tactics) {
      assertAiNonNegativeInteger(squad.tactics.targetScore, `squads.${squad.squadId}.targetScore`);
      assertAiNonNegativeInteger(
        squad.tactics.engagementRatioPermille,
        `squads.${squad.squadId}.engagementRatioPermille`
      );
      assertAiNonNegativeInteger(squad.tactics.confidencePermille, `squads.${squad.squadId}.confidencePermille`);
      assertAiNonNegativeInteger(
        squad.tactics.predictedFriendlyLossPermille,
        `squads.${squad.squadId}.predictedFriendlyLossPermille`
      );
      assertAiNonNegativeInteger(
        squad.tactics.predictedEnemyLossPermille,
        `squads.${squad.squadId}.predictedEnemyLossPermille`
      );
      assertAiNonNegativeInteger(
        squad.tactics.lastObservedMemberCount,
        `squads.${squad.squadId}.lastObservedMemberCount`
      );
      assertAiNonNegativeInteger(squad.tactics.observedLossCount, `squads.${squad.squadId}.observedLossCount`);
      assertAiNonNegativeInteger(squad.tactics.lastTransitionTick, `squads.${squad.squadId}.lastTransitionTick`);
      assertAiNonNegativeInteger(squad.tactics.nextReconsiderTick, `squads.${squad.squadId}.nextReconsiderTick`);
      assertAiNonNegativeInteger(squad.tactics.oscillationCount, `squads.${squad.squadId}.oscillationCount`);
      if (
        squad.tactics.targetScore > 1000 ||
        squad.tactics.engagementRatioPermille > 4000 ||
        squad.tactics.confidencePermille > 1000 ||
        squad.tactics.predictedFriendlyLossPermille > 1000 ||
        squad.tactics.predictedEnemyLossPermille > 1000
      )
        throw new Error(`invalid_ai_tactical_estimate:${squad.squadId}`);
      assertUnique([...squad.tactics.orderedActorIds], `squads.${squad.squadId}.orderedActorIds`);
      if (squad.tactics.orderedActorIds.some((actorId) => !squad.actorIds.includes(actorId))) {
        throw new Error(`invalid_ai_tactical_order_owner:${squad.squadId}`);
      }
      assertUnique(
        squad.tactics.assignedPositions.map((entry) => entry.actorId),
        `squads.${squad.squadId}.assignedPositions`
      );
      assertUnique(
        squad.tactics.damageReservations.map((entry) => entry.actorId),
        `squads.${squad.squadId}.damageReservations`
      );
      for (const reservation of squad.tactics.damageReservations) {
        assertAiNonNegativeFinite(reservation.expectedDamage, `squads.${squad.squadId}.expectedDamage`);
        assertAiNonNegativeInteger(reservation.impactTick, `squads.${squad.squadId}.impactTick`);
      }
    }
  }
}
