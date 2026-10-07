import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeRouteOrderLineageV1 } from "./skirmish-ai-runtime-route-order-lineage";
import type { validateRuntimeRouteOrders } from "./skirmish-ai-runtime-route-order-validation";
import { matchRuntimeRouteServiceLineage } from "./skirmish-ai-runtime-route-service-lineage";
import { runtimeRouteOrderFenced } from "./skirmish-ai-runtime-route-order-fence";

/** Prefer explicit invocation ownership; legacy current-order samples retain co-observation only. */
export function projectRuntimeRouteOrder(capture: AiRuntimeProductionCaptureV1,
  request: NonNullable<RuntimeRouteOrderLineageV1["admission"]>, terminal: typeof request,
  records: ReturnType<typeof validateRuntimeRouteOrders>) {
  const gaps = ["production_route_order_useful_effect_missing",
    "production_route_complete_order_history_missing"];
  const failures: string[] = [];
  let admission: RuntimeRouteOrderLineageV1["admission"] = null, rally: RuntimeRouteOrderLineageV1["rally"] = null;
  let serviceCommand: RuntimeRouteOrderLineageV1["serviceCommand"] = null;
  let selectedDemand: RuntimeRouteOrderLineageV1["selectedDemand"] = null;
  let sameCurrentOrderAtTerminal = false;
  let queryCaller: RuntimeRouteOrderLineageV1["queryCaller"] = null, queryCallerAttributed = false;
  const before = request.spatial, after = terminal.spatial;
  if (before.kind === "producer_path" && after.kind === "producer_path") {
    queryCaller = before.queryCaller ?? null;
    const pairedCaller = !!queryCaller && !!after.queryCaller &&
      isDeepStrictEqual({ ...queryCaller, lifetimeValid: false }, { ...after.queryCaller, lifetimeValid: false });
    if (!queryCaller) gaps.push("production_route_query_order_caller_missing");
    else if (!pairedCaller) gaps.push("production_route_query_order_caller_terminal_missing");
    if (queryCaller && (!queryCaller.lifetimeValid || !after.queryCaller?.lifetimeValid)) {
      gaps.push("production_route_query_order_caller_lifetime_unavailable");
    }
    const order = queryCaller ? queryCaller.order : before.currentOrder;
    const currentAdmission = before.currentOrder && records.admissions.get(before.currentOrder.orderId);
    const currentFenced = before.snapshotRestoreInProgress || after.snapshotRestoreInProgress ||
      !!currentAdmission?.spatial.snapshotRestoreInProgress || runtimeRouteOrderFenced(capture, before.source.actorId,
        currentAdmission && currentAdmission.sequence < request.sequence ? currentAdmission.sequence : request.sequence,
        terminal.sequence);
    sameCurrentOrderAtTerminal = !currentFenced && !!before.currentOrder && !!after.currentOrder &&
      isDeepStrictEqual(before.currentOrder, after.currentOrder);
    if (!sameCurrentOrderAtTerminal) gaps.push("production_route_order_changed_or_unavailable_at_terminal");
    if (order) {
      admission = records.admissions.get(order.orderId) ?? null;
      if (!admission || admission.sequence >= request.sequence) {
        admission = null; gaps.push("production_route_order_admission_missing");
      } else if (!order.admissionObserved) {
        if (queryCaller) {
          admission = null; gaps.push("production_route_query_caller_admission_unobserved");
        } else failures.push("production_route_order_admission_claim_invalid");
      }
      const intervalStart = admission?.sequence ?? request.sequence;
      const fenced = before.snapshotRestoreInProgress || after.snapshotRestoreInProgress ||
        admission?.spatial.snapshotRestoreInProgress ||
        !!queryCaller && (!queryCaller.lifetimeValid || !after.queryCaller?.lifetimeValid) ||
        runtimeRouteOrderFenced(capture, before.source.actorId, intervalStart, terminal.sequence);
      if (fenced) { admission = null; gaps.push("production_route_order_restore_or_reuse_fence"); }
      if (admission) {
        queryCallerAttributed = pairedCaller && !!queryCaller?.lifetimeValid && !!after.queryCaller?.lifetimeValid &&
          !records.failures.length && !records.overflow &&
          admission.spatial.sceneActive && admission.spatial.clockTick !== null &&
          before.sceneActive && after.sceneActive && before.clockTick !== null && after.clockTick !== null &&
          before.sourceInCaptureScene && after.sourceInCaptureScene &&
          [before.source, after.source].every((source) => source.indexed && source.active && source.alive && source.finished);
        const origin = records.rallies.get(order.orderId);
        if (origin && origin.sequence < request.sequence && order.originOutputId !== null &&
          origin.spatial.kind === "route_rally_order" && origin.spatial.outputId === order.originOutputId) rally = origin;
        const service = matchRuntimeRouteServiceLineage(capture, admission, request.sequence);
        failures.push(...service.failures); gaps.push(...service.gaps);
        serviceCommand = service.serviceCommand; selectedDemand = service.selectedDemand;
        if (admission.spatial.kind === "route_order" &&
          (!isDeepStrictEqual(admission.spatial.order.target, order.target) ||
            !isDeepStrictEqual(admission.spatial.order.targetTile, order.targetTile) ||
            admission.spatial.order.orderType !== order.orderType)) gaps.push("production_route_order_retargeted_since_admission");
      }
      if (order.originOutputId !== null && before.outputId !== order.originOutputId) gaps.push("production_route_rally_output_scope_changed");
    } else gaps.push(queryCaller ? "production_route_query_caller_unordered" :
      order === null ? "production_route_no_current_order" : "production_route_order_observation_unavailable");
    if (queryCaller && !queryCallerAttributed) gaps.push("production_route_query_order_caller_unattributed");
  }
  return { failures, lineage: { admission, rally, serviceCommand, selectedDemand, sameCurrentOrderAtTerminal,
    queryCaller, queryCallerAttributed, gaps: [...new Set(gaps)] } satisfies RuntimeRouteOrderLineageV1 };
}
