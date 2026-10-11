import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeMovementV1 } from "./skirmish-ai-runtime-movement";
import { validateRuntimeRouteOrders } from "./skirmish-ai-runtime-route-order-validation";
import { runtimeRouteOrderFenced } from "./skirmish-ai-runtime-route-order-fence";

/** Inspect all supplied executions, including contradictory overflow tails, before exposing physical arrival. */
export function normalizeRuntimeMovement(capture: AiRuntimeProductionCaptureV1) {
  if (capture.facts.length > 8192 || capture.droppedFactCount) {
    return { movements: [], failures: ["production_movement_capture_dropped"], gaps: [] };
  }
  const groups = new Map<number, RuntimeMovementV1["observations"][number][]>();
  const failures: string[] = [], gaps = new Set(["production_movement_service_effect_missing",
    "production_movement_continuous_stability_missing", "production_movement_complete_history_missing"]);
  const orders = validateRuntimeRouteOrders(capture);
  failures.push(...orders.failures);
  const integer = (value: number) => Number.isSafeInteger(value) && value >= 0;
  const tile = (value: { x: number; y: number } | null) => value === null || !!value && integer(value.x) && integer(value.y);
  for (const fact of capture.facts) {
    if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "movement") continue;
    const value = fact.spatial;
    value.gaps.forEach((gap) => gaps.add(gap));
    if (!integer(value.executionId) || value.executionId < 1 || value.executionId > 8192 ||
      !["started", "destination", "arrived", "stopped", "returned_true", "returned_false", "threw"].includes(value.phase) ||
      !["path", "direct"].includes(value.mode) || typeof value.fallback !== "boolean" ||
      typeof value.sourceInCaptureScene !== "boolean" || !tile(value.actualTile) ||
      !tile(value.originalDestination) || !tile(value.selectedDestination)) {
      failures.push("production_movement_payload_invalid"); continue;
    }
    const observations = groups.get(value.executionId) ?? [];
    const first = observations[0]?.spatial, previous = observations.at(-1)?.spatial;
    const returned = observations.some((entry) => ["returned_true", "returned_false", "threw"].includes(entry.spatial.phase));
    const terminal = observations.some((entry) => ["arrived", "stopped"].includes(entry.spatial.phase));
    if (!first && value.phase !== "started" || first && value.phase === "started" || returned ||
      terminal && ["destination", "arrived", "stopped"].includes(value.phase) ||
      value.phase === "started" && (value.selectedDestination !== null || value.fallback) ||
      ["destination", "arrived"].includes(value.phase) && (!value.selectedDestination || !value.originalDestination)) {
      failures.push("production_movement_interval_invalid");
    }
    if (first && (first.source.actorId !== value.source.actorId ||
      first.source.canonicalObjectName !== value.source.canonicalObjectName || first.mode !== value.mode ||
      !isDeepStrictEqual(first.caller && { ...first.caller, lifetimeValid: false },
        value.caller && { ...value.caller, lifetimeValid: false })) ||
      previous && (previous.fallback && !value.fallback ||
        !isDeepStrictEqual(previous.originalDestination, value.originalDestination) &&
          !(value.phase === "destination" && previous.originalDestination === null) ||
        value.phase !== "destination" && !isDeepStrictEqual(previous.selectedDestination, value.selectedDestination) ||
        value.phase !== "destination" && previous.fallback !== value.fallback)) {
      failures.push("production_movement_identity_conflict");
    }
    observations.push({ ...fact, spatial: value }); groups.set(value.executionId, observations);
  }
  const movements: RuntimeMovementV1[] = [];
  for (const [executionId, observations] of groups) {
    const started = observations[0], last = observations.at(-1);
    if (!started || !last || started.spatial.phase !== "started") continue;
    const localGaps = new Set<string>();
    const caller = started.spatial.caller, order = caller?.order;
    let admission = order ? orders.admissions.get(order.orderId) ?? null : null;
    if (!admission || admission.sequence >= started.sequence || !order?.admissionObserved) {
      admission = null; localGaps.add("production_movement_order_admission_missing");
    }
    const ready = observations.every(({ spatial: value }) => value.clockTick !== null && value.sceneActive &&
      !value.snapshotRestoreInProgress && value.sourceInCaptureScene && value.source.active && value.source.alive &&
      value.source.indexed && value.source.finished && !!value.caller?.lifetimeValid);
    const fenced = runtimeRouteOrderFenced(capture, started.spatial.source.actorId,
      admission?.sequence ?? started.sequence, last.sequence);
    if (!ready || fenced || admission?.spatial.snapshotRestoreInProgress || admission &&
      (!admission.spatial.sceneActive || admission.spatial.clockTick === null)) {
      admission = null; localGaps.add("production_movement_boundary_or_lifetime_unavailable");
    }
    const callerAttributed = !!caller && !!admission && !orders.failures.length && !orders.overflow;
    if (!callerAttributed) localGaps.add("production_movement_caller_unattributed");
    const physical = observations.find((entry) => ["arrived", "stopped"].includes(entry.spatial.phase));
    const returnedFact = observations.find((entry) => ["returned_true", "returned_false", "threw"].includes(entry.spatial.phase));
    const returned = returnedFact?.spatial.phase === "returned_true" ? "true" :
      returnedFact?.spatial.phase === "returned_false" ? "false" : returnedFact ? "threw" : null;
    if (!returnedFact) localGaps.add("production_movement_return_missing");
    let arrival: RuntimeMovementV1["arrival"] = "unavailable";
    if (physical?.spatial.phase === "stopped") arrival = "stopped";
    else if (physical && ready && !fenced && physical.spatial.actualTile && physical.spatial.selectedDestination &&
      isDeepStrictEqual(physical.spatial.actualTile, physical.spatial.selectedDestination)) {
      arrival = physical.spatial.fallback ? "fallback_destination" :
        isDeepStrictEqual(physical.spatial.actualTile, physical.spatial.originalDestination) ?
          "original_destination" : "other_destination";
    } else localGaps.add("production_movement_physical_arrival_unavailable");
    if (arrival === "fallback_destination") localGaps.add("production_movement_original_destination_not_reached");
    movements.push({ executionId, started, observations, admission, callerAttributed, arrival, returned, gaps: [...localGaps] });
    localGaps.forEach((gap) => gaps.add(gap));
  }
  const overflow = groups.size > 256 || orders.overflow;
  if (overflow) gaps.add("production_movement_group_overflow");
  if (!groups.size) gaps.add("production_movement_observation_missing");
  return { movements: failures.length || overflow ? [] : movements, failures: [...new Set(failures)], gaps: [...gaps] };
}
