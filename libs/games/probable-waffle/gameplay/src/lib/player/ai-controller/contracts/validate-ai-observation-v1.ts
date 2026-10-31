import { assertAiNonNegativeFinite, assertAiNonNegativeInteger } from "./ai-core-types";
import type { AiObservationV1 } from "./ai-observation-v1";
import { assertUnique } from "./ai-validation-primitives";

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
      if (actor.queue.value.items && actor.queue.value.items.length !== actor.queue.value.occupied) {
        throw new Error(`invalid_ai_queue_item_count:${actor.actorId}`);
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
