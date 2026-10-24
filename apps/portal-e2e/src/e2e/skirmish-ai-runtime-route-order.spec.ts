import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { routeOrderFixture } from "./skirmish-ai-runtime-route-order-fixture";
import { runtimeRouteServiceOutcomeActors, validateRuntimeRouteServiceLifecycle } from "./skirmish-ai-runtime-route-service-outcomes";

/** Synthetic report contracts only, unrun until the final gate. No path execution, arrival or useful stability credit. */
test("service orders retain their own exact selected demand, separately from purchase demand and query-caller authority", () => {
  const f = routeOrderFixture(), result = normalizeRuntimeProductionCausality(f.capture);
  expect(result.failures).toEqual([]);
  const path = result.producerRoutes.paths[0];
  expect(path?.output?.commandScope?.acceptedIntent.demandId).toBe("demand:force");
  expect(path?.orderLineage.serviceCommand?.acceptedIntent.demandId).toBe("demand:service");
  expect(path?.orderLineage.selectedDemand).toMatchObject({ selectedTick: 10, demand: { demandId: "demand:service", desired: 1 } });
  expect(path?.orderLineage).toMatchObject({ sameCurrentOrderAtTerminal: true, queryCallerAttributed: false });
  expect(path?.orderLineage.admission?.spatial.kind).toBe("route_order");
  expect(result.gaps).toContain("production_route_query_order_caller_missing");
  expect(result.gaps).toContain("production_route_useful_arrival_missing");
});

test("unstamped native rally orders retain exact output/admission identity without borrowing purchase intent", () => {
  const f = routeOrderFixture(true), result = normalizeRuntimeProductionCausality(f.capture);
  expect(result.failures).toEqual([]);
  const lineage = result.producerRoutes.paths[0]?.orderLineage;
  expect(lineage?.rally?.spatial).toMatchObject({ kind: "route_rally_order", outputId: 1, orderId: 1 });
  expect(lineage?.serviceCommand).toBeNull(); expect(lineage?.selectedDemand).toBeNull();
  expect(lineage?.queryCallerAttributed).toBe(false);
  expect(result.gaps).toContain("production_route_rally_command_identity_missing");
});

test("native multi-pawn application preserves exact full command context and separate per-actor outcomes", () => {
  const f = routeOrderFixture(), actors = [...f.command.actorIds, "another_actor"];
  const facts = f.capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
    if (fact.kind === "spatial_authority" && fact.spatial.kind === "route_order" && fact.spatial.order.commandContext) {
      return [{ ...fact, spatial: { ...fact.spatial, order: { ...fact.spatial.order,
        commandContext: { ...fact.spatial.order.commandContext, actorIds: actors } } } }];
    }
    if (fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path" && fact.spatial.currentOrder?.commandContext) {
      return [{ ...fact, spatial: { ...fact.spatial, currentOrder: { ...fact.spatial.currentOrder,
        commandContext: { ...fact.spatial.currentOrder.commandContext, actorIds: actors } } } }];
    }
    if (fact.kind === "decision_selected" && fact.decision.identity.decisionSequence === 41) {
      const acceptedIntents = fact.decision.acceptedIntents.map((intent) => intent.kind === "move" ? { ...intent, actorIds: actors } : intent);
      return [{ ...fact, decision: { ...fact.decision, acceptedIntents,
        decisions: acceptedIntents.map((intent) => ({ outcome: "accepted", reason: "accepted", intent })) } }];
    }
    if (fact.kind === "intent_dispatch" && fact.event.correlation.intentId === "service") {
      if (fact.event.kind === "requested" && fact.event.acceptedIntent?.kind === "move") return [{ ...fact,
        event: { ...fact.event, command: { ...fact.event.command, actorIds: actors },
          acceptedIntent: { ...fact.event.acceptedIntent, actorIds: actors } } }];
      if (fact.event.kind === "finished" && fact.event.receipt.status === "dispatched") return [{ ...fact,
        event: { ...fact.event, receipt: { ...fact.event.receipt, command: { ...fact.event.receipt.command, actorIds: actors } } } }];
    }
    if (fact.kind === "command_delivered" && fact.command.execution?.commandId === "service") {
      return [{ ...fact, command: { ...fact.command, actorIds: actors } }];
    }
    if (fact.kind === "outcome" && fact.outcome.commandId === "service") {
      if (fact.outcome.kind === "dispatched") return [{ ...fact, outcome: { ...fact.outcome, actorIds: [...actors].sort() } }];
      return [fact, { ...fact, outcome: { ...fact.outcome, actorIds: ["another_actor"] } }];
    }
    return [fact];
  }).map((fact, index) => ({ ...fact, sequence: index + 1 }));
  const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
  expect(result.failures).toEqual([]);
  expect(result.producerRoutes.paths[0]?.orderLineage.serviceCommand?.outcomes.filter((fact) => fact.outcome.kind === "applied"))
    .toHaveLength(2);
  const applied = facts.find((fact) => fact.kind === "outcome" && fact.outcome.commandId === "service" && fact.outcome.kind === "applied");
  if (!applied || applied.kind !== "outcome") throw new Error("synthetic_actor_application_missing");
  expect(validateRuntimeRouteServiceLifecycle([applied.outcome, applied.outcome])).toHaveLength(1);
  expect(runtimeRouteServiceOutcomeActors({ ...applied.outcome, actorIds: ["foreign_actor"] }, f.command)).toBe(false);
});

test("a future dispatch receipt cannot fill an already-resolved query's service lineage", () => {
  const f = routeOrderFixture();
  const receipt = f.capture.facts.find((fact) => fact.kind === "intent_dispatch" && fact.event.kind === "finished" &&
    fact.event.receipt.status === "dispatched" && fact.event.receipt.command.execution?.commandId === "service");
  if (!receipt) throw new Error("synthetic_service_receipt_missing");
  const facts = [...f.capture.facts.filter((fact) => fact !== receipt), receipt]
    .map((fact, index) => ({ ...fact, sequence: index + 1 }));
  const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
  expect(result.failures).toEqual([]); expect(result.producerRoutes.paths[0]?.orderLineage.serviceCommand).toBeNull();
  expect(result.gaps).toContain("production_route_service_admission_interval_unavailable");
});

test("retargeted current orders retain original admission/demand without claiming that the new query serves that demand", () => {
  const f = routeOrderFixture();
  const facts = f.capture.facts.map((fact): AiRuntimeProductionFactV1 =>
    fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path" ? { ...fact, spatial: { ...fact.spatial,
      currentOrder: { ...f.currentOrder, targetTile: { x: 99, y: 99, z: 0 } } } } : fact);
  const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
  expect(result.failures).toEqual([]);
  expect(result.producerRoutes.paths[0]?.orderLineage.serviceCommand?.acceptedIntent.demandId).toBe("demand:service");
  expect(result.gaps).toContain("production_route_order_retargeted_since_admission");
  expect(result.producerRoutes.paths[0]?.orderLineage.queryCallerAttributed).toBe(false);
});

for (const missing of ["admission", "decision", "demand", "current", "legacy", "receipt", "delivery"] as const) {
  test(`missing ${missing} cannot be repaired from purchase lineage or a later world snapshot`, () => {
    const f = routeOrderFixture();
    const facts = f.capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
      if (missing === "admission" && fact.kind === "spatial_authority" && fact.spatial.kind === "route_order") return [];
      if (missing === "delivery" && fact.kind === "command_delivered" && fact.command.execution?.commandId === "service") return [];
      if (missing === "receipt" && fact.kind === "intent_dispatch" && fact.event.kind === "finished" &&
        fact.event.receipt.status === "dispatched" && fact.event.receipt.command.execution?.commandId === "service") return [];
      if (fact.kind === "decision_selected" && fact.decision.identity.decisionSequence === 41 && missing === "demand") {
        return [{ ...fact, decision: { ...fact.decision, economyProduction: { ...fact.decision.economyProduction, demands: [] } } }];
      }
      if (fact.kind === "intent_dispatch" && fact.event.kind === "requested" && fact.event.correlation.intentId === "service" &&
        missing === "decision") return [{ ...fact, event: { ...fact.event, decisionIdentity: undefined } }];
      if (fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path") {
        const spatial = { ...fact.spatial };
        if (missing === "current") spatial.currentOrder = null;
        if (missing === "legacy") delete spatial.currentOrder;
        return [{ ...fact, spatial }];
      }
      // A delivery is required for supplied applied outcome authority; remove both to represent a capture gap.
      if (missing === "delivery" && fact.kind === "outcome" && fact.outcome.commandId === "service" &&
        fact.outcome.kind === "applied") return [];
      return [fact];
    });
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures).toEqual([]);
    const lineage = result.producerRoutes.paths[0]?.orderLineage;
    if (missing === "decision" || missing === "demand") expect(lineage?.selectedDemand).toBeNull();
    else expect(lineage?.serviceCommand).toBeNull();
    expect(lineage?.queryCallerAttributed).toBe(false);
  });
}

for (const fence of ["restore", "reuse", "replacement_order", "mutated_target", "awaited"] as const) {
  test(`${fence} keeps sampled order continuity distinct from useful service`, () => {
    const f = routeOrderFixture();
    const facts = f.capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
      if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "producer_path" || fact.spatial.phase !== "resolved") return [fact];
      const spatial = { ...fact.spatial };
      if (fence === "replacement_order") spatial.currentOrder = { ...f.currentOrder, orderId: 2, admissionObserved: false };
      if (fence === "mutated_target") spatial.currentOrder = { ...f.currentOrder, targetTile: { x: 99, y: 99, z: 0 } };
      if (fence === "awaited") spatial.clockTick = 11;
      const changed = { ...fact, tick: fence === "awaited" ? 11 : fact.tick, spatial };
      if (fence === "restore") return [f.fact({ ...f.requested, kind: "route_order_restore", source: f.product }), changed];
      if (fence === "reuse") return [{ sequence: 0, tick: 10, playerNumber: 1, kind: "actor_unregistered",
        actorId: f.product.actorId ?? "", objectName: f.product.objectName }, changed];
      return [changed];
    }).map((fact, index) => ({ ...fact, sequence: index + 1 }));
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures).toEqual([]);
    const lineage = result.producerRoutes.paths[0]?.orderLineage;
    if (fence === "restore" || fence === "reuse") {
      expect(lineage?.admission).toBeNull(); expect(lineage?.serviceCommand).toBeNull();
    }
    if (fence !== "awaited") expect(lineage?.sameCurrentOrderAtTerminal).toBe(false);
    expect(lineage?.queryCallerAttributed).toBe(false);
    expect(result.gaps).toContain("production_route_order_useful_effect_missing");
  });
}

for (const defect of ["stamp", "actors", "payload", "selected_intent", "selected_demand", "orphan_rally", "duplicate_order",
  "orphan_terminal_stamp", "duplicate_rally_output"] as const) {
  test(`contradictory ${defect} suppresses routes and other normalized authority groups`, () => {
    const f = routeOrderFixture(defect === "duplicate_rally_output");
    let facts = f.capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
      if (fact.kind === "spatial_authority" && fact.spatial.kind === "route_order") {
        const order = { ...fact.spatial.order }, context = order.commandContext;
        if (context && defect === "stamp") order.commandContext = { ...context, execution: { ...context.execution, sequence: 42 } };
        if (context && defect === "actors") order.commandContext = { ...context, actorIds: [...context.actorIds, "borrowed"] };
        if (defect === "payload") order.targetTile = { x: 99, y: 99, z: 0 };
        if (defect === "duplicate_order") return [fact, fact];
        if (defect === "duplicate_rally_output") return [fact,
          { ...fact, spatial: { ...fact.spatial, order: { ...order, orderId: 2 } } }];
        return [{ ...fact, spatial: { ...fact.spatial, order } }];
      }
      if (defect === "duplicate_rally_output" && fact.kind === "spatial_authority" && fact.spatial.kind === "route_rally_order") {
        return [fact, { ...fact, spatial: { ...fact.spatial, orderId: 2 } }];
      }
      if (fact.kind === "decision_selected" && fact.decision.identity.decisionSequence === 41) {
        if (defect === "selected_intent") return [{ ...fact, decision: { ...fact.decision, acceptedIntents: [] } }];
        if (defect === "selected_demand") return [{ ...fact, decision: { ...fact.decision,
          economyProduction: { ...fact.decision.economyProduction, demands: [...fact.decision.economyProduction.demands,
            ...fact.decision.economyProduction.demands] } } }];
      }
      if (defect === "orphan_terminal_stamp" && fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path") {
        if (fact.spatial.phase === "requested") return [];
        return [{ ...fact, spatial: { ...fact.spatial, currentOrder: { ...f.currentOrder,
          commandContext: { ...f.currentOrder.commandContext!, playerNumber: 99 } } } }];
      }
      return [fact];
    });
    if (defect === "orphan_rally") facts.push(f.fact({ ...f.requested, kind: "route_rally_order", source: f.product,
      orderId: 999, outputId: 999 }));
    facts = facts.map((fact, index) => ({ ...fact, sequence: index + 1 }));
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures.length).toBeGreaterThan(0); expect(result.producerRoutes).toEqual({ outputs: [], paths: [] });
    expect(result.payments).toEqual([]); expect(result.completions).toEqual([]);
  });
}

test("order overflow discards the whole route group and still inspects an unqueried contradictory tail", () => {
  const f = routeOrderFixture(true);
  const base = f.capture.facts.filter((fact) => fact.kind !== "spatial_authority" ||
    !["route_order", "route_rally_order", "producer_path"].includes(fact.spatial.kind));
  const more = Array.from({ length: 257 }, (_, index) => f.fact({ ...f.requested, kind: "route_order", source: f.product,
    order: { ...f.order, orderId: index + 1 } }));
  const capture = { ...f.capture, facts: [...base, ...more].map((fact, index) => ({ ...fact, sequence: index + 1 })) };
  const result = normalizeRuntimeProductionCausality(capture);
  expect(result.failures).toEqual([]); expect(result.producerRoutes).toEqual({ outputs: [], paths: [] });
  expect(result.gaps).toContain("production_route_group_overflow");
  const tail = more.at(-1);
  if (!tail || tail.kind !== "spatial_authority" || tail.spatial.kind !== "route_order") throw new Error("synthetic_tail_missing");
  const corrupt = { ...capture, facts: [...capture.facts.slice(0, -1), { ...tail, sequence: capture.facts.length,
    spatial: { ...tail.spatial, order: { ...tail.spatial.order, orderId: 9000 } } }] };
  expect(normalizeRuntimeProductionCausality(corrupt).failures).toContain("production_route_order_payload_invalid");
});
