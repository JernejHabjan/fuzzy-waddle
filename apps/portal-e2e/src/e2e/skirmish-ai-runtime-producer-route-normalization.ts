import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeNavigationBoundaryV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-navigation-boundary-v1";
import type { RuntimeProductionCausalityV1 } from "./skirmish-ai-runtime-production-causality";
import type { RuntimeProductionSpatialAuthorityV1 } from "./skirmish-ai-runtime-production-spatial-authority";
import type { RuntimeProducerRoutesV1 } from "./skirmish-ai-runtime-producer-routes";
import { validateRuntimeProducerRoute } from "./skirmish-ai-runtime-producer-route-validation";
import { matchRuntimeProducerOutput } from "./skirmish-ai-runtime-producer-output-lineage";
import { projectRuntimeNavigationInterval, validateRuntimeNavigationBoundary } from "./skirmish-ai-runtime-navigation-boundary";

/** Every route is native-observed and bounded. Missing producer-service intent cannot be filled by producer/name equality. */
export function normalizeRuntimeProducerRoutes(
  capture: AiRuntimeProductionCaptureV1, commands: RuntimeProductionCausalityV1["commands"],
  completions: RuntimeProductionCausalityV1["completions"], spatial: RuntimeProductionSpatialAuthorityV1
) {
  const outputs: RuntimeProducerRoutesV1["outputs"][number][] = [];
  const paths: RuntimeProducerRoutesV1["paths"][number][] = [];
  const failures: string[] = [];
  const gaps = new Set(["production_route_complete_query_history_missing", "production_route_useful_arrival_missing",
    "production_route_native_cache_provenance_missing", "production_route_native_navigation_revision_missing"]);
  if (capture.facts.length > 8192 || capture.droppedFactCount) {
    return { routes: { outputs: [], paths: [] } satisfies RuntimeProducerRoutesV1,
      failures: ["production_route_capture_dropped"], gaps: [...gaps] };
  }
  const facts = capture.facts.filter((fact) => fact.kind === "spatial_authority");
  const requests = new Map<number, typeof facts[number]>();
  const completed = new Set<number>();
  const outputIds = new Set<number>();
  const productIds = new Set<string>();
  const consumedItems = new Set<string>();
  let lastNavigation: AiRuntimeNavigationBoundaryV1 | undefined;
  let overflow = false;
  for (const fact of facts) {
    const value = fact.spatial;
    if (value.kind !== "output" && value.kind !== "producer_path") continue;
    value.gaps.forEach((gap) => gaps.add(gap));
    if (fact.playerNumber !== capture.playerNumber || !Number.isSafeInteger(fact.tick) || fact.tick < capture.startedTick ||
      !Number.isSafeInteger(fact.sequence) || fact.sequence <= 0 ||
      (value.clockTick !== null && value.clockTick !== fact.tick) || !validateRuntimeProducerRoute(capture, value)) {
      failures.push("production_route_boundary_invalid"); continue;
    }
    if (value.clockTick === null || !value.sceneActive) gaps.add("production_route_clock_scene_missing");
    if (value.snapshotRestoreInProgress) gaps.add("production_route_restore_binding_unavailable");
    if (value.kind === "output") {
      if (outputIds.has(value.outputId)) failures.push("production_route_output_identity_duplicate");
      const itemKey = `${value.producer.actorId}:${value.item.itemId}`;
      const productId = value.product.actorId ?? "";
      if (productIds.has(productId) || consumedItems.has(itemKey)) failures.push("production_route_output_effect_reused");
      outputIds.add(value.outputId); productIds.add(productId); consumedItems.add(itemKey);
      if (outputIds.size > 256 || value.gaps.includes("production_route_output_binding_overflow")) overflow = true;
      const joined = matchRuntimeProducerOutput(capture, fact, commands, completions, spatial);
      failures.push(...joined.failures); joined.gaps.forEach((gap) => gaps.add(gap));
      if (!overflow) outputs.push({ boundary: fact, spawn: joined.spawn, completion: joined.completion,
        commandScope: joined.commandScope, gaps: joined.gaps });
      continue;
    }
    const navigationFailures = validateRuntimeNavigationBoundary(value.navigation, lastNavigation);
    failures.push(...navigationFailures);
    if (!navigationFailures.length && value.navigation !== undefined) {
      lastNavigation = value.navigation.updateRequestCount === null ? value.navigation : { ...value.navigation,
        graphObservationId: value.navigation.graphObservationId ?? lastNavigation?.graphObservationId ?? null };
    }
    if (value.phase === "requested") {
      if (requests.has(value.queryId) || value.path !== null || value.result !== null) {
        failures.push("production_route_query_identity_duplicate");
      }
      requests.set(value.queryId, fact);
      if (requests.size > 256) overflow = true;
      continue;
    }
    const request = requests.get(value.queryId);
    const before = request?.spatial;
    if (!request || before?.kind !== "producer_path" || completed.has(value.queryId) ||
      request.sequence >= fact.sequence || request.tick > fact.tick || before.purpose !== value.purpose ||
      before.outputId !== value.outputId || before.method !== value.method || before.radiusTiles !== value.radiusTiles ||
      before.dynamicBlockerCount !== value.dynamicBlockerCount || before.source.actorId !== value.source.actorId ||
      before.source.canonicalObjectName !== value.source.canonicalObjectName ||
      before.target?.actorId !== value.target?.actorId || before.target?.playerNumber !== value.target?.playerNumber ||
      before.target?.canonicalObjectName !== value.target?.canonicalObjectName ||
      (value.method !== "object_radius" && (before.targetTile?.x !== value.targetTile?.x ||
        before.targetTile?.y !== value.targetTile?.y))) {
      failures.push("production_route_query_interval_invalid"); continue;
    }
    completed.add(value.queryId);
    if (value.phase === "resolved" ?
      (value.result === "no_path" ? value.path !== null : value.result !== "path" ||
        value.path === null && !value.gaps.includes("production_route_path_overflow")) :
      value.path !== null || value.result !== null) failures.push("production_route_query_result_invalid");
    const entryGaps = ["production_route_useful_arrival_missing", "production_route_native_cache_provenance_missing"];
    if (value.phase !== "resolved") entryGaps.push("production_route_native_query_failed");
    if (value.result === "no_path") entryGaps.push("production_route_native_path_not_found");
    const candidate = outputs.find((entry) => entry.boundary.spatial.kind === "output" &&
      entry.boundary.spatial.outputId === before.outputId);
    let output: RuntimeProducerRoutesV1["outputs"][number] | null = candidate ?? null;
    if (before.outputId !== null && candidate?.boundary.spatial.kind === "output") {
      const bound = candidate.boundary.spatial;
      if (candidate.boundary.sequence >= request.sequence || bound.product.actorId !== before.source.actorId ||
        bound.product.canonicalObjectName !== before.source.canonicalObjectName ||
        bound.product.playerNumber !== before.source.playerNumber) failures.push("production_route_output_query_binding_invalid");
    } else if (before.outputId !== null) entryGaps.push("production_route_output_query_binding_missing");
    else entryGaps.push("production_route_service_demand_identity_missing");
    const actorIds = [before.source.actorId, before.target?.actorId];
    const intervalStart = candidate?.boundary.sequence ?? request.sequence;
    const fenced = before.snapshotRestoreInProgress || value.snapshotRestoreInProgress ||
      candidate?.boundary.spatial.snapshotRestoreInProgress || capture.facts.some((entry) =>
        entry.sequence > intervalStart && entry.sequence <= fact.sequence &&
        (entry.kind === "actor_unregistered" && actorIds.includes(entry.actorId) ||
          entry.kind === "actor_registered" && actorIds.includes(entry.actor.actorId) ||
          entry.kind === "construction_authority" && actorIds.includes(entry.construction.site.actorId) &&
            (entry.construction.snapshotRestoreInProgress || entry.construction.kind === "lifecycle" &&
              entry.construction.transition === "restored")));
    if (fenced) { output = null; entryGaps.push("production_route_restore_or_reuse_fence"); }
    const ready = (actor: typeof value.source) => actor.active && actor.alive && actor.finished && actor.indexed;
    const sameTile = (left: typeof value.sourceTile, right: typeof value.sourceTile) =>
      !!left && !!right && left.x === right.x && left.y === right.y;
    const currentAtResolution = !fenced && request.tick === fact.tick && before.clockTick !== null &&
      value.clockTick !== null && before.sceneActive && value.sceneActive &&
      before.sourceInCaptureScene && value.sourceInCaptureScene &&
      (!before.target || before.targetInCaptureScene === true && value.targetInCaptureScene === true) && ready(before.source) && ready(value.source) &&
      (!before.target || !!value.target && ready(before.target) && ready(value.target)) &&
      sameTile(before.sourceTile, value.sourceTile) && sameTile(before.targetTile, value.targetTile);
    if (!currentAtResolution) entryGaps.push("production_route_stale_or_missing_actor_binding");
    if (request.tick !== fact.tick) entryGaps.push("production_route_awaited_history_unverified");
    const topologyObservation = projectRuntimeNavigationInterval(before.navigation, value.navigation);
    if (topologyObservation !== "same_observed") entryGaps.push(`production_route_topology_${topologyObservation}`);
    entryGaps.forEach((gap) => gaps.add(gap));
    if (!overflow) paths.push({ requested: request, terminal: fact, output, currentAtResolution, topologyObservation,
      gaps: entryGaps });
  }
  if (requests.size !== completed.size) gaps.add("production_route_pending_or_missing_queries");
  if (!outputIds.size && !requests.size) gaps.add("production_route_authority_missing");
  if (overflow) gaps.add("production_route_group_overflow");
  return structuredClone({ routes: { outputs: failures.length || overflow ? [] : outputs,
    paths: failures.length || overflow ? [] : paths } satisfies RuntimeProducerRoutesV1,
    failures: [...new Set(failures)], gaps: [...gaps].sort() });
}
