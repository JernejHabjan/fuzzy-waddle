import type { AiBrainStateV1 } from "./ai-brain-state-v1";
import { assertAiNonNegativeFinite, assertAiNonNegativeInteger } from "./ai-core-types";
import { assertDeadline, assertUnique, isRecord } from "./ai-validation-primitives";
import { assertAiSquadStateV1 } from "./validate-ai-squad-state-v1";
import { assertAiTransportStateV1 } from "./validate-ai-transport-state-v1";
import { assertAiWaitEdgesV1 } from "./validate-ai-wait-edges-v1";
import { assertAiProductionTransitionV1 } from "./validate-ai-production-transition-v1";

/** Structural guard used before a persisted state is trusted as V1. */
export function isAiBrainStateV1(value: unknown): value is AiBrainStateV1 {
  if (!isRecord(value) || value.schemaVersion !== 1) return false;
  if (!isRecord(value.strategy) || !isRecord(value.opening) || !isRecord(value.knowledge) || !isRecord(value.skirmish))
    return false;
  if (
    !isRecord(value.economyProduction) ||
    !isRecord(value.recovery) ||
    !isRecord(value.authority) ||
    !isRecord(value.scheduler)
  )
    return false;
  if (!isRecord(value.identities)) return false;
  return [
    "bases",
    "reservations",
    "waitEdges",
    "pendingOutcomes",
    "squads",
    "transport",
    "fortifications",
    "support",
    "progress",
    "blockers",
    "recoveryEpisodes",
    "lanes",
    "queries"
  ].every((field) => Array.isArray(value[field]));
}

/** Rejects malformed counters and duplicate identities in a typed brain state. */
export function assertAiBrainStateV1(value: unknown): asserts value is AiBrainStateV1 {
  if (!isAiBrainStateV1(value)) throw new Error("malformed_ai_state:v1_shape");
  assertAiProductionTransitionV1(value.economyProduction.transition);
  assertAiNonNegativeInteger(value.playerNumber, "playerNumber");
  assertAiNonNegativeInteger(value.lastCommittedTick, "lastCommittedTick");
  assertAiNonNegativeInteger(value.scheduler.decisionSequence, "scheduler.decisionSequence");
  assertAiNonNegativeInteger(value.scheduler.accumulatorTicks, "scheduler.accumulatorTicks");
  assertAiNonNegativeInteger(value.authority.authorityEpoch, "authority.authorityEpoch");
  if (
    !Number.isSafeInteger(value.authority.processedSequenceWatermark) ||
    value.authority.processedSequenceWatermark < -1
  ) {
    throw new Error("invalid_ai_integer:authority.processedSequenceWatermark");
  }
  assertDeadline(value.strategy.commitmentDeadline, "strategy.commitmentDeadline");
  if (value.authority.reconciliationDeadline !== null) {
    assertDeadline(value.authority.reconciliationDeadline, "authority.reconciliationDeadline");
  }
  for (const reservation of value.reservations) {
    if (reservation.state.kind === "provisional") {
      assertDeadline(reservation.state.expiresAt, `reservations.${reservation.claimId}.expiresAt`);
    }
  }
  for (const progress of value.progress) {
    assertDeadline(progress.milestoneDeadline, `progress.${progress.planId}.milestoneDeadline`);
  }
  if (!Array.isArray(value.recovery.records)) throw new Error("malformed_ai_recovery_state");
  const posture = value.economyProduction.posture;
  if (posture !== undefined) {
    if (!isRecord(posture) || !["safe", "pressured", "emergency"].includes(posture.status as string)) {
      throw new Error("malformed_ai_economy_posture");
    }
    assertAiNonNegativeInteger(posture.enteredTick, "economyProduction.posture.enteredTick");
    if (posture.lastThreatTick !== null) {
      assertAiNonNegativeInteger(posture.lastThreatTick, "economyProduction.posture.lastThreatTick");
    }
  }
  const workforce = value.economyProduction.workforce;
  if (workforce !== undefined) {
    if (!isRecord(workforce) || (workforce.blocker !== null && workforce.blocker !== "resource_saturation")) {
      throw new Error("malformed_ai_economy_workforce");
    }
    for (const field of [
      "workers",
      "queuedWorkers",
      "assignedWorkers",
      "desiredWorkers",
      "desiredFoodSources",
      "foodRunwayTicks",
      "economyPermille",
      "defensePermille"
    ] as const) {
      const value = workforce[field];
      if (typeof value !== "number") throw new Error(`invalid_ai_integer:economyProduction.workforce.${field}`);
      assertAiNonNegativeInteger(value, `economyProduction.workforce.${field}`);
    }
    if (Number(workforce.economyPermille) + Number(workforce.defensePermille) !== 1000) {
      throw new Error("invalid_ai_economy_budget");
    }
    if (Number(workforce.assignedWorkers) > Number(workforce.workers)) {
      throw new Error("invalid_ai_economy_assignment_count");
    }
  }
  if (
    !isRecord(value.economyProduction.adaptation) ||
    !Array.isArray(value.economyProduction.adaptation.evidence) ||
    !Array.isArray(value.economyProduction.adaptation.activeRoleTargets)
  ) {
    throw new Error("malformed_ai_adaptation_state");
  }
  assertUnique(
    value.economyProduction.adaptation.evidence.map((entry) => entry.evidenceId),
    "adaptation.evidence"
  );
  assertUnique(
    value.economyProduction.adaptation.activeRoleTargets.map((entry) => entry.role),
    "adaptation.activeRoleTargets"
  );
  for (const evidence of value.economyProduction.adaptation.evidence) {
    assertAiNonNegativeInteger(evidence.observedTick, `adaptation.${evidence.evidenceId}.observedTick`);
    assertAiNonNegativeInteger(evidence.confidencePermille, `adaptation.${evidence.evidenceId}.confidencePermille`);
    assertAiNonNegativeInteger(
      evidence.consecutiveEvaluations,
      `adaptation.${evidence.evidenceId}.consecutiveEvaluations`
    );
    if (evidence.confidencePermille > 1000 || evidence.consecutiveEvaluations > 2)
      throw new Error(`invalid_ai_adaptation_evidence:${evidence.evidenceId}`);
    assertUnique([...evidence.permittedFacts], `adaptation.${evidence.evidenceId}.permittedFacts`);
  }
  for (const target of value.economyProduction.adaptation.activeRoleTargets) {
    assertAiNonNegativeInteger(target.desired, `adaptation.${target.role}.desired`);
    assertUnique([...target.evidenceIds], `adaptation.${target.role}.evidenceIds`);
  }
  if (value.economyProduction.adaptation.lastTransitionTick !== null) {
    assertAiNonNegativeInteger(value.economyProduction.adaptation.lastTransitionTick, "adaptation.lastTransitionTick");
  }
  if (value.economyProduction.adaptation.selectedResearchScore !== null) {
    assertAiNonNegativeInteger(
      value.economyProduction.adaptation.selectedResearchScore,
      "adaptation.selectedResearchScore"
    );
    if (value.economyProduction.adaptation.selectedResearchScore > 1000)
      throw new Error("invalid_ai_adaptation_research_score");
  }
  assertUnique(
    value.recovery.records.map((record) => record.recoveryKey),
    "recovery.records"
  );
  for (const record of value.recovery.records) {
    assertAiNonNegativeInteger(record.enteredTick, `recovery.${record.recoveryKey}.enteredTick`);
    assertAiNonNegativeInteger(record.lastProgressTick, `recovery.${record.recoveryKey}.lastProgressTick`);
    assertAiNonNegativeInteger(record.nextRetryTick, `recovery.${record.recoveryKey}.nextRetryTick`);
    assertAiNonNegativeInteger(record.attempt, `recovery.${record.recoveryKey}.attempt`);
    assertDeadline(record.phaseDeadline, `recovery.${record.recoveryKey}.phaseDeadline`);
  }
  for (const blocker of value.blockers) assertDeadline(blocker.deadline, `blockers.${blocker.blockerId}.deadline`);
  for (const episode of value.recoveryEpisodes) {
    assertDeadline(episode.deadline, `recovery.${episode.episodeId}.deadline`);
  }
  for (const query of value.queries) assertDeadline(query.deadline, `queries.${query.queryId}.deadline`);
  assertUnique(
    value.support.map((support) => support.planId),
    "support.planId"
  );
  assertUnique(
    value.support.map((support) => support.effectId).filter((effectId): effectId is string => effectId != null),
    "support.effectId"
  );
  for (const support of value.support) {
    if (support.expiresAt !== null) assertDeadline(support.expiresAt, `support.${support.planId}.expiresAt`);
    if (support.usefulCapacity !== undefined)
      assertAiNonNegativeFinite(support.usefulCapacity, `support.${support.planId}.usefulCapacity`);
  }
  assertAiTransportStateV1(value);
  assertAiSquadStateV1(value);
  if (!Array.isArray(value.skirmish.incidents) || !Array.isArray(value.skirmish.timeline)) {
    throw new Error("malformed_ai_skirmish_state");
  }
  for (const incident of value.skirmish.incidents) {
    assertAiNonNegativeInteger(incident.createdTick, `skirmish.${incident.incidentId}.createdTick`);
    assertAiNonNegativeInteger(incident.confidencePermille, `skirmish.${incident.incidentId}.confidencePermille`);
    assertAiNonNegativeInteger(incident.severity, `skirmish.${incident.incidentId}.severity`);
    assertDeadline(incident.expiresAt, `skirmish.${incident.incidentId}.expiresAt`);
    assertUnique([...incident.hostileActorIds], `skirmish.${incident.incidentId}.hostileActorIds`);
  }
  if (!["active", "winning", "hopeless", "conceding", "conceded", "finished"].includes(value.skirmish.mode.state)) {
    throw new Error("invalid_ai_skirmish_mode");
  }
  if (value.skirmish.mode.hopelessSinceTick !== null) {
    assertAiNonNegativeInteger(value.skirmish.mode.hopelessSinceTick, "skirmish.mode.hopelessSinceTick");
  }
  assertUnique(
    value.reservations.map((reservation) => reservation.claimId),
    "reservations.claimId"
  );
  assertAiWaitEdgesV1(value.waitEdges);
}
