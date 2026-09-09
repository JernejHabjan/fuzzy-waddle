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
  for (const transport of value.transport) {
    if (!transport.lifecycle) continue;
    if (!["island_establishment", "army_transfer", "evacuation"].includes(transport.lifecycle.missionKind)) {
      throw new Error(`invalid_ai_transport_mission:${transport.planId}`);
    }
    assertDeadline(transport.lifecycle.phaseDeadline, `transport.${transport.planId}.phaseDeadline`);
    assertAiNonNegativeInteger(transport.lifecycle.routeGeneration, `transport.${transport.planId}.routeGeneration`);
    assertAiNonNegativeInteger(transport.lifecycle.assignedCapacity, `transport.${transport.planId}.assignedCapacity`);
    assertAiNonNegativeInteger(transport.lifecycle.requiredCapacity, `transport.${transport.planId}.requiredCapacity`);
    assertAiNonNegativeInteger(
      transport.lifecycle.departureCapacityPermille,
      `transport.${transport.planId}.departureCapacityPermille`
    );
    assertAiNonNegativeInteger(
      transport.lifecycle.estimatedTravelTicks,
      `transport.${transport.planId}.estimatedTravelTicks`
    );
    assertAiNonNegativeInteger(transport.lifecycle.recoveryAttempt, `transport.${transport.planId}.recoveryAttempt`);
    assertAiNonNegativeInteger(
      transport.lifecycle.maxRecoveryAttempts,
      `transport.${transport.planId}.maxRecoveryAttempts`
    );
    assertAiNonNegativeInteger(transport.lifecycle.lastProgressTick, `transport.${transport.planId}.lastProgressTick`);
    if (transport.lifecycle.requiredCapacity === 0 || transport.lifecycle.departureCapacityPermille > 1000) {
      throw new Error(`invalid_ai_transport_capacity:${transport.planId}`);
    }
    assertUnique(
      transport.lifecycle.manifest.map((passenger) => passenger.actorId),
      `transport.${transport.planId}.manifest`
    );
    assertUnique([...transport.lifecycle.assignedTransportIds], `transport.${transport.planId}.assignedTransportIds`);
    assertUnique(
      transport.lifecycle.seatAssignments.map((assignment) => assignment.transportId),
      `transport.${transport.planId}.seatAssignments`
    );
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
  assertUnique(
    observation.researchCandidates.map((candidate) => `${candidate.producerId}:${candidate.researchType}`),
    "observation.researchCandidate"
  );
  for (const candidate of observation.researchCandidates) {
    assertAiNonNegativeInteger(candidate.durationTicks, `research.${candidate.researchType}.durationTicks`);
    assertAiNonNegativeInteger(candidate.refundPermille, `research.${candidate.researchType}.refundPermille`);
    if (candidate.refundPermille > 1000) throw new Error(`invalid_ai_research_refund:${candidate.researchType}`);
    for (const [resourceType, amount] of Object.entries(candidate.cost)) {
      assertAiNonNegativeFinite(amount, `research.${candidate.researchType}.${resourceType}`);
    }
  }
  for (const effect of observation.effects) {
    if (effect.radius !== undefined) assertAiNonNegativeFinite(effect.radius, `effects.${effect.effectId}.radius`);
    if (effect.expiresAt.status === "known")
      assertAiNonNegativeInteger(effect.expiresAt.value, `effects.${effect.effectId}.expiresAt`);
  }
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
    if (actor.combatProfile?.status === "known") {
      const profile = actor.combatProfile.value;
      assertAiNonNegativeFinite(profile.maxHealth, `actors.${actor.actorId}.combat.maxHealth`);
      assertAiNonNegativeFinite(profile.maxArmour, `actors.${actor.actorId}.combat.maxArmour`);
      assertAiNonNegativeFinite(
        profile.passiveRegenerationPerSecond,
        `actors.${actor.actorId}.combat.passiveRegenerationPerSecond`
      );
      assertAiNonNegativeInteger(profile.armourPermille, `actors.${actor.actorId}.combat.armourPermille`);
      if (profile.maxHealth <= 0 || profile.armourPermille > 1000)
        throw new Error(`invalid_ai_combat_durability:${actor.actorId}`);
      for (const attack of profile.attacks) {
        assertAiNonNegativeFinite(attack.damage, `actors.${actor.actorId}.combat.damage`);
        assertAiNonNegativeInteger(attack.cooldownTicks, `actors.${actor.actorId}.combat.cooldownTicks`);
        if (attack.remainingCooldownTicks != null)
          assertAiNonNegativeInteger(
            attack.remainingCooldownTicks,
            `actors.${actor.actorId}.combat.remainingCooldownTicks`
          );
        assertAiNonNegativeFinite(attack.range, `actors.${actor.actorId}.combat.range`);
        assertAiNonNegativeFinite(attack.minRange, `actors.${actor.actorId}.combat.minRange`);
        assertAiNonNegativeInteger(attack.impactDelayTicks, `actors.${actor.actorId}.combat.impactDelayTicks`);
        if (attack.cooldownTicks === 0 || attack.minRange > attack.range)
          throw new Error(`invalid_ai_combat_attack:${actor.actorId}`);
      }
      if (profile.healing) {
        assertAiNonNegativeFinite(profile.healing.amount, `actors.${actor.actorId}.combat.healing.amount`);
        assertAiNonNegativeInteger(
          profile.healing.cooldownTicks,
          `actors.${actor.actorId}.combat.healing.cooldownTicks`
        );
        assertAiNonNegativeInteger(
          profile.healing.remainingCooldownTicks,
          `actors.${actor.actorId}.combat.healing.remainingCooldownTicks`
        );
      }
      for (const spell of profile.spells) {
        assertAiNonNegativeFinite(spell.range, `actors.${actor.actorId}.combat.spell.range`);
        assertAiNonNegativeFinite(spell.areaRadius, `actors.${actor.actorId}.combat.spell.areaRadius`);
        assertAiNonNegativeFinite(spell.instantDamage, `actors.${actor.actorId}.combat.spell.instantDamage`);
        assertAiNonNegativeFinite(spell.periodicDamage, `actors.${actor.actorId}.combat.spell.periodicDamage`);
        assertAiNonNegativeFinite(spell.instantHeal, `actors.${actor.actorId}.combat.spell.instantHeal`);
        assertAiNonNegativeFinite(spell.periodicHeal, `actors.${actor.actorId}.combat.spell.periodicHeal`);
        assertAiNonNegativeInteger(spell.stunTicks, `actors.${actor.actorId}.combat.spell.stunTicks`);
        assertAiNonNegativeInteger(spell.slowTicks, `actors.${actor.actorId}.combat.spell.slowTicks`);
        assertAiNonNegativeInteger(spell.zoneDurationTicks, `actors.${actor.actorId}.combat.spell.zoneDurationTicks`);
        if (spell.summonDurationTicks !== null)
          assertAiNonNegativeInteger(
            spell.summonDurationTicks,
            `actors.${actor.actorId}.combat.spell.summonDurationTicks`
          );
      }
      for (const status of profile.statuses) {
        assertAiNonNegativeInteger(status.remainingTicks, `actors.${actor.actorId}.combat.status.remainingTicks`);
        assertAiNonNegativeInteger(
          status.movementSpeedPermille,
          `actors.${actor.actorId}.combat.status.movementSpeedPermille`
        );
      }
    }
  }
  if (observation.map) {
    assertAiNonNegativeInteger(observation.map.staticRevision, "map.staticRevision");
    assertAiNonNegativeInteger(observation.map.regionGeneration.generation, "map.regionGeneration.generation");
    assertAiNonNegativeInteger(
      observation.map.regionGeneration.continuationCursor,
      "map.regionGeneration.continuationCursor"
    );
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
      assertUnique(
        graph.nodes.map((node) => node.nodeId),
        "map.accessGraph.nodeId"
      );
      assertUnique(
        graph.links.map((link) => link.linkId),
        "map.accessGraph.linkId"
      );
      assertUnique(
        graph.transferPoints.map((point) => point.transferId),
        "map.accessGraph.transferId"
      );
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
