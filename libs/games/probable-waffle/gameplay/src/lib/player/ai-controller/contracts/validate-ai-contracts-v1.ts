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
  if (!isRecord(value.strategy) || !isRecord(value.opening) || !isRecord(value.knowledge) || !isRecord(value.skirmish)) return false;
  if (!isRecord(value.economyProduction) || !isRecord(value.recovery) || !isRecord(value.authority) || !isRecord(value.scheduler)) return false;
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
  assertUnique(value.recovery.records.map((record) => record.recoveryKey), "recovery.records");
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
  for (const support of value.support) {
    if (support.expiresAt !== null) assertDeadline(support.expiresAt, `support.${support.planId}.expiresAt`);
  }
  for (const transport of value.transport) {
    if (!transport.lifecycle) continue;
    if (!["island_establishment", "army_transfer", "evacuation"].includes(transport.lifecycle.missionKind)) {
      throw new Error(`invalid_ai_transport_mission:${transport.planId}`);
    }
    assertDeadline(transport.lifecycle.phaseDeadline, `transport.${transport.planId}.phaseDeadline`);
    assertAiNonNegativeInteger(transport.lifecycle.routeGeneration, `transport.${transport.planId}.routeGeneration`);
    assertAiNonNegativeInteger(transport.lifecycle.assignedCapacity, `transport.${transport.planId}.assignedCapacity`);
    assertAiNonNegativeInteger(transport.lifecycle.requiredCapacity, `transport.${transport.planId}.requiredCapacity`);
    assertAiNonNegativeInteger(transport.lifecycle.departureCapacityPermille, `transport.${transport.planId}.departureCapacityPermille`);
    assertAiNonNegativeInteger(transport.lifecycle.estimatedTravelTicks, `transport.${transport.planId}.estimatedTravelTicks`);
    assertAiNonNegativeInteger(transport.lifecycle.recoveryAttempt, `transport.${transport.planId}.recoveryAttempt`);
    assertAiNonNegativeInteger(transport.lifecycle.maxRecoveryAttempts, `transport.${transport.planId}.maxRecoveryAttempts`);
    assertAiNonNegativeInteger(transport.lifecycle.lastProgressTick, `transport.${transport.planId}.lastProgressTick`);
    if (transport.lifecycle.requiredCapacity === 0 || transport.lifecycle.departureCapacityPermille > 1000) {
      throw new Error(`invalid_ai_transport_capacity:${transport.planId}`);
    }
    assertUnique(transport.lifecycle.manifest.map((passenger) => passenger.actorId), `transport.${transport.planId}.manifest`);
    assertUnique([...transport.lifecycle.assignedTransportIds], `transport.${transport.planId}.assignedTransportIds`);
    assertUnique(transport.lifecycle.seatAssignments.map((assignment) => assignment.transportId), `transport.${transport.planId}.seatAssignments`);
    assertUnique(
      transport.lifecycle.seatAssignments.flatMap((assignment) => [...assignment.passengerIds]),
      `transport.${transport.planId}.assignedPassengers`
    );
    const manifestIds = new Set(transport.lifecycle.manifest.map((passenger) => passenger.actorId));
    for (const passenger of transport.lifecycle.manifest) {
      assertAiNonNegativeInteger(passenger.seats, `transport.${transport.planId}.${passenger.actorId}.seats`);
      if (passenger.seats === 0) throw new Error(`invalid_ai_transport_seats:${transport.planId}:${passenger.actorId}`);
    }
    if (
      transport.lifecycle.seatAssignments.some(
        (assignment) =>
          !transport.lifecycle?.assignedTransportIds.includes(assignment.transportId) ||
          assignment.passengerIds.some((passengerId) => !manifestIds.has(passengerId))
      )
    ) {
      throw new Error(`invalid_ai_transport_assignment:${transport.planId}`);
    }
  }
  assertUnique(value.squads.map((squad) => squad.squadId), "squads.squadId");
  for (const squad of value.squads) {
    assertUnique([...squad.actorIds], `squads.${squad.squadId}.actorIds`);
    if (!squad.lifecycle) continue;
    assertAiNonNegativeInteger(squad.lifecycle.createdTick, `squads.${squad.squadId}.createdTick`);
    assertAiNonNegativeInteger(squad.lifecycle.recoveryAttempt, `squads.${squad.squadId}.recoveryAttempt`);
    assertDeadline(squad.lifecycle.assemblyDeadline, `squads.${squad.squadId}.assemblyDeadline`);
    assertDeadline(squad.lifecycle.effectDeadline, `squads.${squad.squadId}.effectDeadline`);
    if (squad.lifecycle.lastUsefulEffectTick !== null) {
      assertAiNonNegativeInteger(squad.lifecycle.lastUsefulEffectTick, `squads.${squad.squadId}.lastUsefulEffectTick`);
    }
  }
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
  assertAiNonNegativeInteger(observation.threatSummary.observedTick, "threatSummary.observedTick");
  assertUnique([...observation.threatSummary.visibleEnemyActorIds], "threatSummary.visibleEnemyActorIds");
  assertUnique([...observation.threatSummary.rememberedEnemyActorIds], "threatSummary.rememberedEnemyActorIds");
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
    if (actor.containerState?.status === "known") {
      const container = actor.containerState.value;
      assertAiNonNegativeInteger(container.capacity, `actors.${actor.actorId}.container.capacity`);
      assertUnique([...container.passengerIds], `actors.${actor.actorId}.container.passengerIds`);
      assertUnique([...container.pendingPassengerIds], `actors.${actor.actorId}.container.pendingPassengerIds`);
      if (container.passengerIds.length > container.capacity) {
        throw new Error(`invalid_ai_container_capacity:${actor.actorId}`);
      }
    }
  }
  if (observation.map) {
    assertAiNonNegativeInteger(observation.map.staticRevision, "map.staticRevision");
    assertAiNonNegativeInteger(observation.map.regionGeneration.generation, "map.regionGeneration.generation");
    assertAiNonNegativeInteger(observation.map.regionGeneration.continuationCursor, "map.regionGeneration.continuationCursor");
    assertUnique([...observation.map.scoutCoverageAccessNodeIds], "map.scoutCoverageAccessNodeIds");
    if (observation.map.bounds.status === "known") {
      assertAiNonNegativeInteger(observation.map.bounds.value.width, "map.bounds.width");
      assertAiNonNegativeInteger(observation.map.bounds.value.height, "map.bounds.height");
    }
    const graph = observation.map.accessGraph;
    if (graph) {
      assertAiNonNegativeInteger(graph.generation, "map.accessGraph.generation");
      assertAiNonNegativeInteger(graph.staticRevision, "map.accessGraph.staticRevision");
      assertAiNonNegativeInteger(graph.dynamicRevision, "map.accessGraph.dynamicRevision");
      assertAiNonNegativeInteger(graph.threatRevision, "map.accessGraph.threatRevision");
      assertAiNonNegativeInteger(graph.builtTick, "map.accessGraph.builtTick");
      assertUnique(graph.nodes.map((node) => node.nodeId), "map.accessGraph.nodeId");
      assertUnique(graph.links.map((link) => link.linkId), "map.accessGraph.linkId");
      assertUnique(graph.transferPoints.map((point) => point.transferId), "map.accessGraph.transferId");
      const nodeIds = new Set(graph.nodes.map((node) => node.nodeId));
      for (const node of graph.nodes) {
        assertAiNonNegativeInteger(node.tileCount, `map.accessGraph.${node.nodeId}.tileCount`);
        assertAiNonNegativeInteger(node.clearance, `map.accessGraph.${node.nodeId}.clearance`);
      }
      for (const transfer of graph.transferPoints) {
        if (!nodeIds.has(transfer.fromNodeId) || !nodeIds.has(transfer.toNodeId)) {
          throw new Error(`invalid_ai_access_transfer:${transfer.transferId}`);
        }
        assertAiNonNegativeInteger(transfer.clearance, `map.accessGraph.${transfer.transferId}.clearance`);
      }
      for (const link of graph.links) {
        if (!nodeIds.has(link.fromNodeId) || !nodeIds.has(link.toNodeId)) {
          throw new Error(`invalid_ai_access_link:${link.linkId}`);
        }
        assertAiNonNegativeInteger(link.clearance, `map.accessGraph.${link.linkId}.clearance`);
        assertAiNonNegativeInteger(link.distanceCost, `map.accessGraph.${link.linkId}.distanceCost`);
      }
    }
  }
}
