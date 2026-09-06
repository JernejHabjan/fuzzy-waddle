import type { AiBrainStateV1 } from "./ai-brain-state-v1";
import { assertAiNonNegativeFinite, assertAiNonNegativeInteger } from "./ai-core-types";
import type { AiWaitEdgeV1 } from "./ai-dependency-contracts";
import type { AiObservationV1 } from "./ai-observation-v1";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function assertUnique(values: readonly string[], field: string): void {
  if (new Set(values).size !== values.length) throw new Error(`duplicate_ai_identity:${field}`);
}

function assertDeadline(value: unknown, field: string): void {
  if (!isRecord(value) || value.clock !== "simulation" || value.unit !== "tick" || value.persistence !== "save") {
    throw new Error(`invalid_ai_deadline:${field}`);
  }
  if (typeof value.dueTick !== "number") throw new Error(`invalid_ai_deadline:${field}`);
  assertAiNonNegativeInteger(value.dueTick, field);
}

/** Structural guard used before a persisted state is trusted as V1. */
export function isAiBrainStateV1(value: unknown): value is AiBrainStateV1 {
  if (!isRecord(value) || value.schemaVersion !== 1) return false;
  if (!isRecord(value.strategy) || !isRecord(value.opening) || !isRecord(value.knowledge)) return false;
  if (!isRecord(value.economyProduction) || !isRecord(value.authority) || !isRecord(value.scheduler)) return false;
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
  assertAiNonNegativeInteger(value.playerNumber, "playerNumber");
  assertAiNonNegativeInteger(value.lastCommittedTick, "lastCommittedTick");
  assertAiNonNegativeInteger(value.scheduler.decisionSequence, "scheduler.decisionSequence");
  assertAiNonNegativeInteger(value.scheduler.accumulatorTicks, "scheduler.accumulatorTicks");
  assertAiNonNegativeInteger(value.authority.authorityEpoch, "authority.authorityEpoch");
  assertAiNonNegativeInteger(value.authority.processedSequenceWatermark, "authority.processedSequenceWatermark");
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
  for (const blocker of value.blockers) assertDeadline(blocker.deadline, `blockers.${blocker.blockerId}.deadline`);
  for (const episode of value.recoveryEpisodes) {
    assertDeadline(episode.deadline, `recovery.${episode.episodeId}.deadline`);
  }
  for (const query of value.queries) assertDeadline(query.deadline, `queries.${query.queryId}.deadline`);
  for (const support of value.support) {
    if (support.expiresAt !== null) assertDeadline(support.expiresAt, `support.${support.planId}.expiresAt`);
  }
  assertUnique(
    value.reservations.map((reservation) => reservation.claimId),
    "reservations.claimId"
  );
  assertAiWaitEdgesV1(value.waitEdges);
}

/** Rejects duplicate and immediate self-dependent plan edges at admission boundaries. */
export function assertAiWaitEdgesV1(edges: readonly AiWaitEdgeV1[]): void {
  assertUnique(
    edges.map((edge) => edge.edgeId),
    "waitEdges.edgeId"
  );
  if (edges.some((edge) => edge.toPlanId !== null && edge.fromPlanId === edge.toPlanId)) {
    throw new Error("invalid_ai_dependency:self_dependency");
  }
  for (const edge of edges) {
    assertAiNonNegativeInteger(edge.deadline.dueTick, `waitEdges.${edge.edgeId}.deadline`);
    if (edge.prerequisite.kind === "resource" || edge.prerequisite.kind === "supply") {
      assertAiNonNegativeFinite(edge.prerequisite.amount, `waitEdges.${edge.edgeId}.amount`);
    }
  }
}

/** Validates numeric/identity invariants before an observation reaches scoring. */
export function assertAiObservationV1(observation: AiObservationV1): void {
  if (observation.schemaVersion !== 1) throw new Error("unsupported_ai_observation_schema");
  assertAiNonNegativeInteger(observation.generation, "observation.generation");
  assertAiNonNegativeInteger(observation.tick, "observation.tick");
  assertAiNonNegativeInteger(observation.playerNumber, "observation.playerNumber");
  assertUnique(
    observation.actors.map((actor) => actor.actorId),
    "observation.actorId"
  );
  assertUnique(
    observation.effects.map((effect) => effect.effectId),
    "observation.effectId"
  );
  assertUnique(
    observation.modeGoals.map((goal) => goal.id),
    "observation.modeGoalId"
  );
  assertUnique(
    observation.accessProducts.map((query) => query.queryId),
    "observation.queryId"
  );
  assertUnique(
    observation.resources.map((resource) => resource.resourceType),
    "observation.resourceType"
  );
  for (const resource of observation.resources) {
    assertAiNonNegativeFinite(resource.stockpile, `resources.${resource.resourceType}.stockpile`);
    assertAiNonNegativeFinite(resource.reservedUnspent, `resources.${resource.resourceType}.reservedUnspent`);
    assertAiNonNegativeFinite(resource.obligationsDue, `resources.${resource.resourceType}.obligationsDue`);
  }
  for (const actor of observation.actors) {
    assertAiNonNegativeInteger(actor.observedTick, `actors.${actor.actorId}.observedTick`);
    if (actor.logicalPosition.status === "known") {
      const { x, y, z } = actor.logicalPosition.value;
      if (![x, y, z].every(Number.isFinite)) throw new Error(`invalid_ai_position:${actor.actorId}`);
    }
    if (actor.effectiveLevel.status === "known") {
      assertAiNonNegativeInteger(actor.effectiveLevel.value, `actors.${actor.actorId}.effectiveLevel`);
    }
    if (actor.queue.status === "known") {
      assertAiNonNegativeInteger(actor.queue.value.capacity, `actors.${actor.actorId}.queue.capacity`);
      assertAiNonNegativeInteger(actor.queue.value.occupied, `actors.${actor.actorId}.queue.occupied`);
      if (actor.queue.value.occupied > actor.queue.value.capacity) {
        throw new Error(`invalid_ai_queue_capacity:${actor.actorId}`);
      }
    }
  }
}
