import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeProductionWorldSnapshotV1 } from "./skirmish-ai-runtime-production-world-snapshot";

/** Normalizes exact owned snapshots without borrowing a later observation, effective price or navigation answer. */
export function normalizeRuntimeProductionWorld(capture: AiRuntimeProductionCaptureV1) {
  const snapshots: RuntimeProductionWorldSnapshotV1[] = [];
  const failures: string[] = [];
  const gaps = new Set<string>();
  if (capture.snapshots.length > 256) return { snapshots, failures: ["production_world_snapshot_overflow"], gaps: [] };
  for (const [index, snapshot] of capture.snapshots.entries()) {
    if (!Number.isSafeInteger(snapshot.tick) || snapshot.tick < capture.startedTick ||
      (index > 0 && snapshot.tick < capture.snapshots[index - 1].tick)) {
      failures.push("production_world_snapshot_order"); continue;
    }
    const world = snapshot.world;
    if (!world) { gaps.add("production_world_authority_missing"); continue; }
    world.gaps.forEach((gap) => gaps.add(gap));
    if (world.snapshotRestoreInProgress || world.actors.length > 256 || world.catalog.length > 512) {
      failures.push("production_world_restore_or_overflow"); continue;
    }
    const ids = world.actors.map((actor) => actor.actorId);
    if (new Set(snapshot.ownedActors.map((actor) => actor.actorId)).size !== snapshot.ownedActors.length ||
      new Set(ids).size !== ids.length || ids.some((id) => !id) || world.actors.some((actor) =>
      actor.playerNumber !== capture.playerNumber || !actor.indexed || !actor.objectName || !actor.canonicalObjectName ||
      !Number.isSafeInteger(actor.currentLevel) || actor.currentLevel < 1 ||
      !snapshot.ownedActors.some((owned) => owned.actorId === actor.actorId && owned.objectName === actor.objectName)) ||
      (!world.gaps.length && snapshot.ownedActors.length !== world.actors.length)) {
      failures.push("production_world_owned_identity_mismatch"); continue;
    }
    const keys = world.catalog.map((entry) => `${entry.producerActorId}:${entry.kind}:${entry.productKey}`);
    if (new Set(keys).size !== keys.length || world.catalog.some((entry) => !ids.includes(entry.producerActorId) ||
      !entry.productKey || !Number.isFinite(entry.durationMs) || entry.durationMs < 0 ||
      !Number.isSafeInteger(entry.durationTicks) || entry.durationTicks !== Math.ceil(entry.durationMs / 50) ||
      Object.entries(entry.cost).some(([resource, amount]) => !Object.values(ResourceType).includes(resource as ResourceType) ||
        !Number.isFinite(amount) || amount < 0) ||
      (entry.kind === "production" ? entry.productKey !== entry.objectName || entry.researchType !== null ||
        entry.priceSource !== "base_production_definition" || !Number.isSafeInteger(entry.effectiveLevel) ||
        (entry.effectiveLevel ?? 0) < 1 || !["immediate", "per_successful_tick"].includes(entry.payment)
        : entry.kind !== "research" || entry.productKey !== entry.researchType || entry.objectName !== null ||
          entry.priceSource !== "research_definition" || entry.effectiveLevel !== null || entry.payment !== "immediate"))) {
      failures.push("production_world_catalog_invalid"); continue;
    }
    const observation = snapshot.observation;
    if (observation && (observation.playerNumber !== capture.playerNumber || !Number.isSafeInteger(observation.tick) ||
      observation.tick < capture.startedTick || observation.tick > snapshot.tick ||
      new Set(observation.actors.map((actor) => actor.actorId)).size !== observation.actors.length)) {
      failures.push("production_world_observation_identity"); continue;
    }
    const current = observation?.tick === snapshot.tick;
    if (!current) gaps.add("production_world_current_observation_missing");
    gaps.add("production_world_reachability_missing");
    const producers: RuntimeProductionWorldSnapshotV1["producers"][number][] = [];
    const physicalItems = snapshot.queues.flatMap((queue) => queue.lanes.flatMap((lane) => lane.items));
    if (snapshot.queues.length > 256 || physicalItems.length > 2048 ||
      new Set(snapshot.queues.map((queue) => queue.actorId)).size !== snapshot.queues.length ||
      new Set(physicalItems.map((item) => item.itemId)).size !== physicalItems.length || snapshot.queues.some((queue) =>
        new Set(queue.lanes.map((lane) => lane.laneId)).size !== queue.lanes.length || queue.lanes.some((lane) =>
          !lane.laneId || !Number.isSafeInteger(lane.capacity) || lane.capacity <= 0 || lane.items.length > lane.capacity))) {
      failures.push("production_world_queue_shape_invalid"); continue;
    }
    for (const queue of snapshot.queues) {
      const actor = world.actors.find((entry) => entry.actorId === queue.actorId);
      if (!actor || actor.objectName !== queue.objectName) { failures.push("production_world_queue_identity"); continue; }
      const observed = current ? observation?.actors.find((entry) => entry.actorId === queue.actorId) : undefined;
      if (observed && (observed.owner !== capture.playerNumber || observed.relation !== "self" ||
        observed.visibility !== "owned" || observed.objectName !== actor.objectName || observed.observedTick !== snapshot.tick)) {
        failures.push("production_world_fair_actor_identity"); continue;
      }
      const logical = observed?.logicalPosition;
      if (logical?.status === "known" && logical.observedTick !== snapshot.tick) {
        failures.push("production_world_position_tick_mismatch"); continue;
      }
      const position = logical?.status === "known" && logical.observedTick === snapshot.tick ? logical.value : null;
      if (position && (!Number.isFinite(position.x) || !Number.isFinite(position.y))) {
        failures.push("production_world_position_invalid"); continue;
      }
      if (!position) gaps.add("production_world_fair_position_missing");
      producers.push({ actorId: queue.actorId, objectName: actor.objectName,
        ready: actor.active && actor.alive && actor.finished && actor.indexed, currentLevel: actor.currentLevel,
        position: position ? { x: position.x, y: position.y } : null, reachable: null, lanes: queue.lanes });
    }
    if (world.catalog.some((entry) => !snapshot.queues.some((queue) => queue.actorId === entry.producerActorId))) {
      gaps.add("production_world_producer_queue_missing");
    }
    snapshots.push({ tick: snapshot.tick, observationTick: observation?.tick ?? null,
      actors: world.actors, catalog: world.catalog, producers });
  }
  return structuredClone({ snapshots: failures.length ? [] : snapshots, failures: [...new Set(failures)], gaps: [...gaps].sort() });
}
