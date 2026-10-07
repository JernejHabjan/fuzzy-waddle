import { isDeepStrictEqual } from "node:util";
import { OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionCaptureV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-capture-v1";
import type { AiRuntimeRouteOrderV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-route-order-v1";
import type { AiRuntimeCreatedActorV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-created-actor-v1";
import { matchRuntimeRouteServiceLineage } from "./skirmish-ai-runtime-route-service-lineage";

/** Inspect every admission/current sample and orphan rally claim, including overflow tails and failure terminals. */
export function validateRuntimeRouteOrders(capture: AiRuntimeProductionCaptureV1) {
  const facts = capture.facts.filter((fact) => fact.kind === "spatial_authority");
  const admissions = new Map<number, typeof facts[number]>(), rallies = new Map<number, typeof facts[number]>();
  const identities = new Map<number, { source: AiRuntimeCreatedActorV1; order: AiRuntimeRouteOrderV1 }>();
  const rallyOutputs = new Set<number>(), commandActors = new Set<string>();
  const failures: string[] = [];
  const integer = (value: number) => Number.isSafeInteger(value) && value >= 0;
  const id = (value: number) => integer(value) && value > 0 && value <= 8192;
  const actor = (value: AiRuntimeCreatedActorV1) => !!value.actorId && !!value.objectName && !!value.canonicalObjectName &&
    (value.playerNumber === null || integer(value.playerNumber)) &&
    [value.active, value.alive, value.finished, value.indexed].every((flag) => typeof flag === "boolean");
  for (const fact of facts) {
    const value = fact.spatial;
    if (!["route_order", "route_rally_order", "route_order_restore", "producer_path"].includes(value.kind) ||
      !("source" in value)) continue;
    if (fact.playerNumber !== capture.playerNumber || !integer(fact.tick) || fact.tick < capture.startedTick ||
      !id(fact.sequence) || value.clockTick !== null && value.clockTick !== fact.tick ||
      typeof value.sceneActive !== "boolean" || typeof value.snapshotRestoreInProgress !== "boolean" ||
      !actor(value.source) || value.source.playerNumber !== capture.playerNumber) failures.push("production_route_order_boundary_invalid");
    if (value.kind === "route_rally_order") {
      const admitted = admissions.get(value.orderId), output = facts.find((entry) => entry.spatial.kind === "output" &&
        entry.spatial.outputId === value.outputId);
      if (!id(value.orderId) || !id(value.outputId) || rallies.has(value.orderId) ||
        admitted?.spatial.kind !== "route_order" || output?.spatial.kind !== "output" ||
        output.sequence >= admitted.sequence || admitted.sequence >= fact.sequence ||
        output.tick !== fact.tick || admitted.tick !== fact.tick || admitted.spatial.order.commandContext ||
        output.spatial.product.actorId !== value.source.actorId ||
        output.spatial.product.canonicalObjectName !== value.source.canonicalObjectName ||
        admitted.spatial.source.actorId !== value.source.actorId ||
        admitted.spatial.source.canonicalObjectName !== value.source.canonicalObjectName ||
        (output.spatial.rallyMode === "tile_action" ? admitted.spatial.order.orderType !== OrderType.Move ||
          !!admitted.spatial.order.target || !isDeepStrictEqual(admitted.spatial.order.targetTile, output.spatial.targetTile) :
          output.spatial.rallyMode !== "actor_action" ||
          admitted.spatial.order.target?.actorId !== output.spatial.target?.actorId)) {
        failures.push("production_route_rally_order_identity_invalid");
      }
      if (rallyOutputs.has(value.outputId)) failures.push("production_route_rally_output_reused");
      rallyOutputs.add(value.outputId); rallies.set(value.orderId, fact); continue;
    }
    if (value.kind === "route_order_restore") {
      if (value.reason !== undefined && !["restore_attempt", "controller_replaced"].includes(value.reason)) {
        failures.push("production_route_order_reset_reason_invalid");
      }
      continue;
    }
    const order = value.kind === "route_order" ? value.order : value.kind === "producer_path" ? value.currentOrder : undefined;
    if (order == null) continue;
    const context = order.commandContext, execution = context?.execution;
    if (!id(order.orderId) || !Object.values(OrderType).includes(order.orderType) ||
      order.target === undefined || order.targetTile === undefined || order.commandContext === undefined ||
      typeof order.admissionObserved !== "boolean" || order.originOutputId !== null && !id(order.originOutputId) ||
      order.target && !actor(order.target) ||
      order.targetTile && (!integer(order.targetTile.x) || !integer(order.targetTile.y) || !Number.isFinite(order.targetTile.z)) ||
      context && (context.playerNumber !== capture.playerNumber || !context.actorIds.includes(value.source.actorId ?? "") ||
        !context.actorIds.length || context.actorIds.length > 256 || context.actorIds.some((entry) => !entry) ||
        new Set(context.actorIds).size !== context.actorIds.length || !execution || execution.schemaVersion !== 1 ||
        !execution.commandId || !execution.commitmentKey || !["human", "ai", "campaign", "replay"].includes(execution.source) ||
        !integer(execution.authorityEpoch) || !integer(execution.sequence) ||
        execution.intentId !== undefined && !execution.intentId || execution.effectId !== undefined && !execution.effectId)) {
      failures.push("production_route_order_payload_invalid"); continue;
    }
    const previous = identities.get(order.orderId);
    if (previous && (previous.source.actorId !== value.source.actorId ||
      previous.source.canonicalObjectName !== value.source.canonicalObjectName ||
      !isDeepStrictEqual(previous.order.commandContext, context) ||
      previous.order.admissionObserved && !order.admissionObserved)) failures.push("production_route_order_identity_conflict");
    identities.set(order.orderId, { source: value.source, order });
    if (value.kind === "route_order") {
      if (admissions.has(order.orderId) || !order.admissionObserved || order.originOutputId !== null) {
        failures.push("production_route_order_admission_invalid");
      }
      admissions.set(order.orderId, fact);
      if (context) {
        const key = `${value.source.actorId}:${context.execution.commandId}`;
        if (commandActors.has(key)) failures.push("production_route_service_order_effect_reused");
        commandActors.add(key);
      }
    }
    if (order.originOutputId !== null) {
      const rally = rallies.get(order.orderId);
      if (rally?.spatial.kind !== "route_rally_order" || rally.spatial.outputId !== order.originOutputId ||
        rally.sequence >= fact.sequence || context) failures.push("production_route_order_origin_invalid");
    }
  }
  // Missing queries/overflow do not excuse contradictions in an otherwise supplied service dispatch or demand.
  for (const admission of admissions.values()) {
    failures.push(...matchRuntimeRouteServiceLineage(capture, admission, (capture.facts.at(-1)?.sequence ?? 0) + 1).failures);
  }
  return { admissions, rallies, overflow: identities.size > 256, failures: [...new Set(failures)] };
}
