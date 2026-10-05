import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeCreatedActorV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-created-actor-v1";
import type { RuntimeProductionSpatialAuthorityV1 } from "./skirmish-ai-runtime-production-spatial-authority";
import { matchRuntimeConstructionPath } from "./skirmish-ai-runtime-construction-path-lineage";

/** Bounded native spatial lineage. Future checkpoints, placement acceptance and endpoint checks never fill a route. */
export function normalizeRuntimeProductionSpatial(capture: AiRuntimeProductionCaptureV1) {
  const authority: { placements: RuntimeProductionSpatialAuthorityV1["placements"][number][];
    spawns: RuntimeProductionSpatialAuthorityV1["spawns"][number][];
    paths: RuntimeProductionSpatialAuthorityV1["paths"][number][] } = { placements: [], spawns: [], paths: [] };
  const failures: string[] = [];
  const gaps = new Set<string>();
  const integer = (value: number) => Number.isSafeInteger(value) && value >= 0;
  const tile = (value: { readonly x: number; readonly y: number }) => integer(value.x) && integer(value.y);
  const actorValid = (actor: AiRuntimeCreatedActorV1) => !!actor.actorId && !!actor.objectName &&
    !!actor.canonicalObjectName && actor.playerNumber === capture.playerNumber &&
    [actor.active, actor.alive, actor.finished, actor.indexed].every((value) => typeof value === "boolean");
  const actorReady = (actor: AiRuntimeCreatedActorV1) => actor.active && actor.alive && actor.indexed;
  if (capture.facts.length > 8192 || capture.droppedFactCount) {
    return { authority, failures: ["production_spatial_capture_dropped"], gaps: [] };
  }
  const facts = capture.facts.filter((fact) => fact.kind === "spatial_authority");
  const requests = new Map<number, typeof facts[number]>();
  const completed = new Set<number>();
  for (const fact of facts) {
    const value = fact.spatial;
    value.gaps.forEach((gap) => gaps.add(gap));
    if (fact.playerNumber !== capture.playerNumber || !integer(fact.sequence) || fact.sequence === 0 ||
      !integer(fact.tick) || fact.tick < capture.startedTick || value.snapshotRestoreInProgress ||
      typeof value.snapshotRestoreInProgress !== "boolean" || typeof value.sceneActive !== "boolean" ||
      (value.clockTick !== null && value.clockTick !== fact.tick)) {
      failures.push("production_spatial_boundary_invalid"); continue;
    }
    const boundaryKnown = value.clockTick !== null && value.sceneActive;
    if (!boundaryKnown) gaps.add("production_spatial_clock_scene_missing");
    if (value.kind === "placement") {
      const command = value.command;
      if (!actorValid(value.site) || command.actorName !== value.site.canonicalObjectName ||
        command.playerNumber !== capture.playerNumber || command.type !== "CONSTRUCT" ||
        !command.execution?.commandId || command.execution.schemaVersion !== 1 ||
        !integer(command.execution.authorityEpoch) || !integer(command.execution.sequence) || command.execution.sequence === 0 ||
        !command.siteKey || command.actorIds.length === 0 ||
        new Set(command.actorIds).size !== command.actorIds.length || command.tick > fact.tick ||
        !integer(command.tick) || !Object.values(command.tileVec3).every(Number.isFinite) || typeof value.legal !== "boolean" ||
        (value.footprint !== null && (value.footprint.length > 128 || !value.footprint.every(tile) ||
          new Set(value.footprint.map((point) => `${point.x},${point.y}`)).size !== value.footprint.length)) ||
        (value.legal && value.footprint?.length === 0)) failures.push("production_spatial_placement_invalid");
      if (!value.footprint || !actorReady(value.site)) gaps.add("production_spatial_placement_binding_missing");
      else if (boundaryKnown) authority.placements.push(fact);
      continue;
    }
    if (value.kind === "spawn") {
      if (!actorValid(value.producer) || !value.item.itemId || !value.item.objectName || value.item.researchType !== null ||
        !integer(value.item.remainingTimeMs) || value.item.remainingTimeMs !== 0 || typeof value.waterUnit !== "boolean" ||
        (!!value.tile !== !!value.position) || (value.tile && !tile(value.tile)) ||
        (value.position && !Object.values(value.position).every(Number.isFinite))) failures.push("production_spatial_spawn_invalid");
      if (!actorReady(value.producer) || !value.producer.finished) gaps.add("production_spatial_spawn_binding_missing");
      if (!value.tile) gaps.add("production_spatial_spawn_not_found");
      if (boundaryKnown) authority.spawns.push(fact);
      continue;
    }
    if (value.kind !== "builder_path" || !integer(value.queryId) || value.queryId === 0 ||
      !actorValid(value.source) || !actorValid(value.target) || value.source.actorId === value.target.actorId ||
      (value.sourceTile && !tile(value.sourceTile)) || (value.targetTile && !tile(value.targetTile)) ||
      (value.radiusTiles !== null && (!Number.isFinite(value.radiusTiles) || value.radiusTiles < 0)) ||
      (value.path !== null && (value.path.length > 512 || !value.path.every(tile)))) {
      failures.push("production_spatial_path_invalid"); continue;
    }
    if (value.phase === "requested") {
      if (requests.has(value.queryId) || value.path !== null || value.result !== null) failures.push("production_spatial_path_duplicate");
      requests.set(value.queryId, fact); continue;
    }
    const request = requests.get(value.queryId);
    const before = request?.spatial;
    if (!request || !before || before.kind !== "builder_path" || completed.has(value.queryId) ||
      request.sequence >= fact.sequence || request.tick > fact.tick ||
      before.source.actorId !== value.source.actorId || before.target.actorId !== value.target.actorId ||
      before.source.canonicalObjectName !== value.source.canonicalObjectName ||
      before.target.canonicalObjectName !== value.target.canonicalObjectName || before.radiusTiles !== value.radiusTiles) {
      failures.push("production_spatial_path_interval_invalid"); continue;
    }
    completed.add(value.queryId);
    if (value.phase === "rejected" || value.phase === "threw") {
      if (value.path !== null || value.result !== null) failures.push("production_spatial_path_failed_value");
      gaps.add("production_spatial_path_service_failed"); continue;
    }
    if (value.phase !== "resolved" || !["path", "no_path"].includes(value.result ?? "") ||
      (value.result === "no_path" && value.path !== null) ||
      (value.result === "path" && value.path === null && !value.gaps.includes("production_spatial_path_overflow"))) {
      failures.push("production_spatial_path_result_invalid"); continue;
    }
    if (!boundaryKnown || before.clockTick === null || !before.sceneActive) continue;
    const sameTile = (left: typeof value.sourceTile, right: typeof value.sourceTile) =>
      !!left && !!right && left.x === right.x && left.y === right.y;
    const currentAtResolution = request.tick === fact.tick && actorReady(before.source) && actorReady(before.target) &&
      actorReady(value.source) && actorReady(value.target) && sameTile(before.sourceTile, value.sourceTile) &&
      sameTile(before.targetTile, value.targetTile);
    if (request.tick !== fact.tick) gaps.add("production_spatial_path_history_continuity_unverified");
    if (!currentAtResolution) gaps.add("production_spatial_path_stale_binding");
    if (value.result === "no_path") gaps.add("production_spatial_path_not_found");
    const construction = matchRuntimeConstructionPath(capture, request, fact);
    failures.push(...construction.failures);
    construction.gaps.forEach((gap) => gaps.add(gap));
    authority.paths.push({ requested: request, resolved: fact, currentAtResolution,
      constructionPlacement: construction.placement });
  }
  if (requests.size !== completed.size) gaps.add("production_spatial_path_pending_or_missing");
  if (!facts.length) gaps.add("production_spatial_authority_missing");
  gaps.add("production_spatial_full_producer_reachability_missing");
  gaps.add("production_spatial_navigation_revision_missing");
  if (!authority.paths.length) gaps.add("production_spatial_construction_command_path_join_missing");
  return structuredClone({ authority: failures.length ? { placements: [], spawns: [], paths: [] } : authority,
    failures: [...new Set(failures)], gaps: [...gaps].sort() });
}
