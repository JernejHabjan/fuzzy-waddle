import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeCreatedActorV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-created-actor-v1";
import type { RuntimeServiceAttemptV1 } from "./skirmish-ai-runtime-service-attempt";
import { validateRuntimeRouteOrders } from "./skirmish-ai-runtime-route-order-validation";
import { runtimeRouteOrderFenced } from "./skirmish-ai-runtime-route-order-fence";
import { matchRuntimeRouteServiceLineage } from "./skirmish-ai-runtime-route-service-lineage";

/** Scan every supplied attempt, including orphan/error/overflow tails, before assigning native caller ownership. */
export function normalizeRuntimeServiceAttempts(capture: AiRuntimeProductionCaptureV1) {
  if (capture.facts.length > 8192 || capture.droppedFactCount) {
    return { attempts: [], failures: ["production_service_attempt_capture_dropped"], gaps: [] };
  }
  const groups = new Map<number, RuntimeServiceAttemptV1["started"][]>();
  const failures: string[] = [], gaps = new Set(["production_service_actual_credit_missing",
    "production_service_resource_type_and_beneficiary_missing", "production_service_cargo_history_missing",
    "production_service_useful_fulfillment_missing", "production_service_continuous_stability_missing",
    "production_service_complete_history_missing"]);
  const orders = validateRuntimeRouteOrders(capture);
  failures.push(...orders.failures);
  const integer = (value: number) => Number.isSafeInteger(value) && value >= 0;
  const actorValid = (actor: AiRuntimeCreatedActorV1) => !!actor && !!actor.actorId && !!actor.objectName &&
    !!actor.canonicalObjectName && (actor.playerNumber === null || integer(actor.playerNumber)) &&
    [actor.active, actor.alive, actor.finished, actor.indexed].every((flag) => typeof flag === "boolean");
  const actorReady = (actor: AiRuntimeCreatedActorV1) => actor.active && actor.alive && actor.finished && actor.indexed;
  for (const fact of capture.facts) {
    if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "service_attempt") continue;
    const value = fact.spatial;
    value.gaps.forEach((gap) => gaps.add(gap));
    if (!integer(value.attemptId) || value.attemptId < 1 || value.attemptId > 8192 ||
      !["gather", "drop_off"].includes(value.operation) || !["started", "resolved", "rejected", "threw"].includes(value.phase) ||
      typeof value.lifetimeValid !== "boolean" || typeof value.sourceInCaptureScene !== "boolean" ||
      typeof value.targetInCaptureScene !== "boolean" || !actorValid(value.target) ||
      value.order === null ||
      (value.phase === "resolved" ? typeof value.amount !== "number" || !Number.isFinite(value.amount) || value.amount < 0 :
        value.amount !== null)) {
      failures.push("production_service_attempt_payload_invalid"); continue;
    }
    const records = groups.get(value.attemptId) ?? [], first = records[0], previous = records.at(-1);
    if (!first && value.phase !== "started" || first && (value.phase === "started" || records.length >= 2)) {
      failures.push("production_service_attempt_interval_invalid");
    }
    if (first?.spatial.kind === "service_attempt") {
      const before = first.spatial;
      if (before.source.actorId !== value.source.actorId || before.source.canonicalObjectName !== value.source.canonicalObjectName ||
        before.target.actorId !== value.target.actorId || before.target.canonicalObjectName !== value.target.canonicalObjectName ||
        before.operation !== value.operation || !isDeepStrictEqual(before.order, value.order)) {
        failures.push("production_service_attempt_identity_conflict");
      }
    }
    const admission = value.order && orders.admissions.get(value.order.orderId);
    if (value.lifetimeValid && (previous?.spatial.kind === "service_attempt" && !previous.spatial.lifetimeValid ||
      runtimeRouteOrderFenced(capture, value.source.actorId, admission?.sequence ?? first?.sequence ?? fact.sequence, fact.sequence))) {
      failures.push("production_service_attempt_lifetime_revived");
    }
    records.push(fact); groups.set(value.attemptId, records);
  }
  const attempts: RuntimeServiceAttemptV1[] = [];
  for (const [attemptId, records] of groups) {
    const started = records[0], candidate = records[1];
    if (!started || started.spatial.kind !== "service_attempt" || started.spatial.phase !== "started") continue;
    const before = started.spatial;
    const terminal = candidate?.spatial.kind === "service_attempt" && candidate.spatial.phase !== "started" ? candidate : null;
    const after = terminal?.spatial.kind === "service_attempt" ? terminal.spatial : null;
    const localGaps = new Set<string>();
    let admission = before.order ? orders.admissions.get(before.order.orderId) ?? null : null;
    if (!admission || admission.sequence >= started.sequence || !before.order?.admissionObserved) {
      admission = null; localGaps.add("production_service_attempt_admission_missing");
    }
    const lastSequence = terminal?.sequence ?? started.sequence;
    const fenced = runtimeRouteOrderFenced(capture, before.source.actorId, admission?.sequence ?? started.sequence, lastSequence) ||
      runtimeRouteOrderFenced(capture, before.target.actorId, started.sequence, lastSequence);
    const ready = records.every((record) => record.spatial.kind === "service_attempt" && record.spatial.clockTick !== null &&
      record.spatial.sceneActive && !record.spatial.snapshotRestoreInProgress && record.spatial.lifetimeValid &&
      record.spatial.sourceInCaptureScene && record.spatial.targetInCaptureScene && actorReady(record.spatial.source) &&
      actorReady(record.spatial.target));
    if (fenced || !ready || admission && (admission.spatial.snapshotRestoreInProgress ||
      !admission.spatial.sceneActive || admission.spatial.clockTick === null)) {
      admission = null; localGaps.add("production_service_attempt_lifetime_or_boundary_unavailable");
    }
    if (!terminal) localGaps.add("production_service_attempt_terminal_missing");
    const callerAttributed = !!terminal && !!admission && !orders.overflow && !orders.failures.length;
    if (!callerAttributed) localGaps.add("production_service_attempt_caller_unattributed");
    let serviceCommand: RuntimeServiceAttemptV1["serviceCommand"] = null;
    let selectedDemand: RuntimeServiceAttemptV1["selectedDemand"] = null;
    if (callerAttributed) {
      const service = matchRuntimeRouteServiceLineage(capture, admission, started.sequence);
      failures.push(...service.failures); service.gaps.forEach((gap) => localGaps.add(gap));
      serviceCommand = service.serviceCommand; selectedDemand = service.selectedDemand;
    }
    if (admission?.spatial.kind === "route_order" && before.order &&
      (admission.spatial.order.orderType !== before.order.orderType ||
        !isDeepStrictEqual(admission.spatial.order.target, before.order.target))) {
      localGaps.add("production_service_attempt_order_retargeted_since_admission");
    }
    if (before.order && (before.order.target?.actorId !== before.target.actorId ||
      before.order.target?.canonicalObjectName !== before.target.canonicalObjectName)) {
      localGaps.add("production_service_attempt_target_differs_from_order_snapshot");
    }
    if (after?.phase === "rejected" || after?.phase === "threw") localGaps.add("production_service_attempt_native_failed");
    attempts.push({ attemptId, started, terminal, admission, callerAttributed,
      nativeResultAmount: after?.phase === "resolved" ? after.amount : null, serviceCommand, selectedDemand, gaps: [...localGaps] });
    localGaps.forEach((gap) => gaps.add(gap));
  }
  const overflow = groups.size > 256 || orders.overflow;
  if (overflow) gaps.add("production_service_attempt_group_overflow");
  if (!groups.size) gaps.add("production_service_attempt_observation_missing");
  return { attempts: failures.length || overflow ? [] : attempts, failures: [...new Set(failures)], gaps: [...gaps] };
}
