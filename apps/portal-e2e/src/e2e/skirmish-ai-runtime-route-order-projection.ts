import { isDeepStrictEqual } from "node:util";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { RuntimeRouteOrderLineageV1 } from "./skirmish-ai-runtime-route-order-lineage";
import type { validateRuntimeRouteOrders } from "./skirmish-ai-runtime-route-order-validation";
import { matchRuntimeRouteServiceLineage } from "./skirmish-ai-runtime-route-service-lineage";

/** Co-observed order ownership is explicit; a native query-caller link and useful arrival remain separate open gates. */
export function projectRuntimeRouteOrder(capture: AiRuntimeProductionCaptureV1,
  request: NonNullable<RuntimeRouteOrderLineageV1["admission"]>, terminal: typeof request,
  records: ReturnType<typeof validateRuntimeRouteOrders>) {
  const gaps = ["production_route_query_order_caller_missing", "production_route_order_useful_effect_missing",
    "production_route_complete_order_history_missing"];
  const failures: string[] = [];
  let admission: RuntimeRouteOrderLineageV1["admission"] = null, rally: RuntimeRouteOrderLineageV1["rally"] = null;
  let serviceCommand: RuntimeRouteOrderLineageV1["serviceCommand"] = null;
  let selectedDemand: RuntimeRouteOrderLineageV1["selectedDemand"] = null;
  let sameCurrentOrderAtTerminal = false;
  const before = request.spatial, after = terminal.spatial;
  if (before.kind === "producer_path" && after.kind === "producer_path") {
    const order = before.currentOrder;
    if (order) {
      admission = records.admissions.get(order.orderId) ?? null;
      if (!admission || admission.sequence >= request.sequence) {
        admission = null; gaps.push("production_route_order_admission_missing");
      } else if (!order.admissionObserved) failures.push("production_route_order_admission_claim_invalid");
      const intervalStart = admission?.sequence ?? request.sequence;
      const fenced = before.snapshotRestoreInProgress || after.snapshotRestoreInProgress ||
        admission?.spatial.snapshotRestoreInProgress || capture.facts.some((fact) => fact.sequence > intervalStart &&
          fact.sequence <= terminal.sequence && (fact.kind === "actor_unregistered" && fact.actorId === before.source.actorId ||
          fact.kind === "actor_registered" && fact.actor.actorId === before.source.actorId ||
          fact.kind === "spatial_authority" && fact.spatial.kind === "route_order_restore" &&
            fact.spatial.source.actorId === before.source.actorId));
      sameCurrentOrderAtTerminal = !fenced && !!after.currentOrder && isDeepStrictEqual(order, after.currentOrder);
      if (!sameCurrentOrderAtTerminal) gaps.push("production_route_order_changed_or_unavailable_at_terminal");
      if (fenced) { admission = null; gaps.push("production_route_order_restore_or_reuse_fence"); }
      if (admission) {
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
    } else gaps.push(order === null ? "production_route_no_current_order" : "production_route_order_observation_unavailable");
  }
  return { failures, lineage: { admission, rally, serviceCommand, selectedDemand, sameCurrentOrderAtTerminal,
    queryCallerAttributed: false, gaps: [...new Set(gaps)] } satisfies RuntimeRouteOrderLineageV1 };
}
