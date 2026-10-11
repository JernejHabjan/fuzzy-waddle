import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import type { AiRuntimeRouteCallerV1 } from "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-route-caller-v1";
import { routeOrderFixture } from "./skirmish-ai-runtime-route-order-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { validateRuntimeRouteOrders } from "./skirmish-ai-runtime-route-order-validation";
import { projectRuntimeRouteOrder } from "./skirmish-ai-runtime-route-order-projection";

/** Synthetic contract evidence only; no fixture proves useful native movement. */
function callerFixture(rally = false) {
  const f = routeOrderFixture(rally);
  const caller = {
    invocationId: 1,
    caller: "location_movement",
    stage: "initial",
    order: f.currentOrder,
    lifetimeValid: true
  } satisfies AiRuntimeRouteCallerV1;
  const facts = f.capture.facts.map(
    (fact): AiRuntimeProductionFactV1 =>
      fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path"
        ? { ...fact, spatial: { ...fact.spatial, queryCaller: caller } }
        : fact
  );
  return { ...f, caller, capture: { ...f.capture, facts } };
}

test("paired native caller joins its service demand independently of replacement current orders and query endpoints", () => {
  const f = callerFixture();
  const facts = f.capture.facts.map((fact): AiRuntimeProductionFactV1 => {
    if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "producer_path") return fact;
    return {
      ...fact,
      spatial: {
        ...fact.spatial,
        targetTile: { x: 4, y: 5 },
        currentOrder:
          fact.spatial.phase === "requested"
            ? f.currentOrder
            : { ...f.currentOrder, orderId: 2, admissionObserved: false },
        queryCaller: { ...f.caller, caller: "tending_movement" }
      }
    };
  });
  const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
  expect(result.failures).toEqual([]);
  expect(result.producerRoutes.paths[0]?.orderLineage).toMatchObject({
    queryCallerAttributed: true,
    sameCurrentOrderAtTerminal: false,
    queryCaller: { order: { orderId: 1 } },
    selectedDemand: { demand: { demandId: "demand:service" } }
  });
  expect(result.gaps).toContain("production_route_order_useful_effect_missing");
  expect(result.gaps).toContain("production_route_complete_order_history_missing");
  expect(result.gaps).not.toContain("production_route_query_order_caller_missing");
});

test("exact rally caller retains unstamped origin without borrowing purchase demand", () => {
  const result = normalizeRuntimeProductionCausality(callerFixture(true).capture);
  expect(result.failures).toEqual([]);
  expect(result.producerRoutes.paths[0]?.orderLineage).toMatchObject({
    queryCallerAttributed: true,
    serviceCommand: null,
    selectedDemand: null,
    rally: { spatial: { outputId: 1 } }
  });
});

for (const caller of ["range_probe", "reachability_probe", "actor_movement", "boarding_adjacent"] as const) {
  test(`${caller} object query can own an order without claiming movement success`, () => {
    const f = callerFixture();
    const facts = f.capture.facts.map(
      (fact): AiRuntimeProductionFactV1 =>
        fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path"
          ? {
              ...fact,
              spatial: {
                ...fact.spatial,
                method: "object_radius",
                target: f.producer,
                targetInCaptureScene: true,
                radiusTiles: 1,
                queryCaller: { ...f.caller, caller, order: { ...f.currentOrder, target: f.producer, targetTile: null } }
              }
            }
          : fact
    );
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures).toEqual([]);
    expect(result.producerRoutes.paths[0]?.orderLineage.queryCallerAttributed).toBe(true);
    expect(result.gaps).toContain("production_route_useful_arrival_missing");
  });
}

for (const stage of ["repath", "fallback"] as const) {
  test(`${stage} uses its retained order even when the actual endpoint differs from admission`, () => {
    const f = callerFixture();
    const facts = f.capture.facts.map(
      (fact): AiRuntimeProductionFactV1 =>
        fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path"
          ? {
              ...fact,
              spatial: {
                ...fact.spatial,
                method: "tile_dynamic",
                dynamicBlockerCount: 0,
                targetTile: { x: 5, y: 6 },
                queryCaller: { ...f.caller, stage, order: { ...f.currentOrder, targetTile: { x: 7, y: 8, z: 0 } } }
              }
            }
          : fact
    );
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures).toEqual([]);
    expect(result.producerRoutes.paths[0]?.orderLineage.queryCallerAttributed).toBe(true);
    expect(result.gaps).toContain("production_route_order_retargeted_since_admission");
  });
}

test("an invocation snapshot taken before admission cannot borrow a later admitted sample", () => {
  const f = callerFixture();
  const facts = f.capture.facts.map(
    (fact): AiRuntimeProductionFactV1 =>
      fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path"
        ? {
            ...fact,
            spatial: {
              ...fact.spatial,
              queryCaller: { ...f.caller, order: { ...f.currentOrder, admissionObserved: false } }
            }
          }
        : fact
  );
  const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
  expect(result.failures).toEqual([]);
  expect(result.producerRoutes.paths[0]?.orderLineage.queryCallerAttributed).toBe(false);
  expect(result.gaps).toContain("production_route_query_caller_admission_unobserved");
});

for (const missing of ["legacy", "terminal", "admission", "unordered", "clock"] as const) {
  test(`caller ${missing} remains explicit and cannot borrow current-order attribution`, () => {
    const f = callerFixture();
    const facts = f.capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
      if (missing === "admission" && fact.kind === "spatial_authority" && fact.spatial.kind === "route_order")
        return [];
      if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "producer_path") return [fact];
      const queryCaller =
        missing === "legacy" || (missing === "terminal" && fact.spatial.phase !== "requested")
          ? undefined
          : missing === "unordered"
            ? { ...f.caller, caller: "boarding_container_shore" as const, order: null }
            : f.caller;
      return [{ ...fact, spatial: { ...fact.spatial, queryCaller, clockTick: missing === "clock" ? null : 10 } }];
    });
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures).toEqual([]);
    expect(result.producerRoutes.paths[0]?.orderLineage.queryCallerAttributed).toBe(false);
    if (missing === "unordered") expect(result.producerRoutes.paths[0]?.orderLineage.serviceCommand).toBeNull();
  });
}

for (const reason of ["restore_attempt", "controller_replaced", "unregister", "register"] as const) {
  test(`${reason} fences original caller, while a true terminal revival is contradictory`, () => {
    const f = callerFixture();
    const facts = f.capture.facts
      .flatMap((fact): AiRuntimeProductionFactV1[] => {
        if (
          fact.kind !== "spatial_authority" ||
          fact.spatial.kind !== "producer_path" ||
          fact.spatial.phase === "requested"
        ) {
          return [fact];
        }
        const fence: AiRuntimeProductionFactV1 =
          reason === "unregister"
            ? {
                sequence: 0,
                tick: 10,
                playerNumber: 1,
                kind: "actor_unregistered",
                actorId: f.product.actorId ?? "",
                objectName: f.product.objectName
              }
            : reason === "register"
              ? {
                  sequence: 0,
                  tick: 10,
                  playerNumber: 1,
                  kind: "actor_registered",
                  actor: f.product,
                  snapshotRestoreInProgress: false
                }
              : f.fact({ ...f.requested, kind: "route_order_restore", source: f.product, reason });
        return [fence, { ...fact, spatial: { ...fact.spatial, queryCaller: { ...f.caller, lifetimeValid: false } } }];
      })
      .map((fact, index) => ({ ...fact, sequence: index + 1 }));
    const capture = { ...f.capture, facts };
    const records = validateRuntimeRouteOrders(capture);
    const request = facts.find(
      (fact) =>
        fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path" && fact.spatial.phase === "requested"
    );
    const terminal = facts.find(
      (fact) =>
        fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path" && fact.spatial.phase !== "requested"
    );
    if (request?.kind !== "spatial_authority" || terminal?.kind !== "spatial_authority") {
      throw new Error("route_caller_fixture_interval_missing");
    }
    expect(records.failures).toEqual([]);
    const route = projectRuntimeRouteOrder(capture, request, terminal, records);
    expect(route.failures).toEqual([]);
    expect(route.lineage).toMatchObject({ queryCallerAttributed: false, admission: null });
    const result = normalizeRuntimeProductionCausality(capture);
    if (reason === "register") {
      // Re-registering this completed product also contradicts its once-only creation authority.
      expect(result.failures).toEqual(["production_ai_completion_actor_authority_invalid"]);
      expect(result.producerRoutes.paths).toEqual([]);
    } else {
      expect(result.failures).toEqual([]);
      expect(result.producerRoutes.paths[0]?.orderLineage).toMatchObject({
        queryCallerAttributed: false,
        admission: null
      });
    }
    const revived = facts.map(
      (fact): AiRuntimeProductionFactV1 =>
        fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path"
          ? { ...fact, spatial: { ...fact.spatial, queryCaller: f.caller } }
          : fact
    );
    expect(normalizeRuntimeProductionCausality({ ...f.capture, facts: revived }).failures).toContain(
      "production_route_query_caller_lifetime_revived"
    );
  });
}

for (const invalid of ["id", "caller", "method", "stage", "stamp", "source", "terminal_only"] as const) {
  test(`contradictory ${invalid} is inspected even on an orphan failure terminal`, () => {
    const f = callerFixture();
    const orphan = f.fact({
      ...f.resolved,
      queryId: 99,
      phase: "rejected",
      path: null,
      result: null,
      source: invalid === "source" ? { ...f.product, actorId: "other" } : f.product,
      queryCaller: {
        ...f.caller,
        invocationId: invalid === "id" ? 8193 : 1,
        caller: invalid === "caller" ? "boarding_container_shore" : "location_movement",
        stage: invalid === "stage" ? "repath" : "initial",
        order:
          invalid === "stamp"
            ? {
                ...f.currentOrder,
                commandContext: f.currentOrder.commandContext && {
                  ...f.currentOrder.commandContext,
                  execution: { ...f.command.execution!, authorityEpoch: 8 }
                }
              }
            : f.currentOrder
      },
      method: invalid === "method" ? "object_radius" : "tile_static"
    });
    const facts = [...f.capture.facts, { ...orphan, sequence: f.capture.facts.length + 1 }];
    const records = validateRuntimeRouteOrders({ ...f.capture, facts });
    expect(records.failures.length).toBeGreaterThan(0);
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.producerRoutes.paths).toEqual([]);
    expect(result.producerRoutes.outputs).toEqual([]);
  });
}

test("nested unbound observations remain missing, while failed outer queries can retain order origin", () => {
  const f = callerFixture();
  const nested = [f.fact({ ...f.requested, queryId: 2 }), f.fact({ ...f.resolved, queryId: 2 })];
  const facts = [...f.capture.facts, ...nested].map((fact, index) => ({ ...fact, sequence: index + 1 }));
  const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
  expect(result.failures).toEqual([]);
  expect(result.producerRoutes.paths.map((path) => path.orderLineage.queryCallerAttributed)).toEqual([true, false]);
  const rejected = f.capture.facts.map(
    (fact): AiRuntimeProductionFactV1 =>
      fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path" && fact.spatial.phase === "resolved"
        ? { ...fact, spatial: { ...fact.spatial, phase: "rejected", result: null, path: null } }
        : fact
  );
  const failed = normalizeRuntimeProductionCausality({ ...f.capture, facts: rejected });
  expect(failed.failures).toEqual([]);
  expect(failed.producerRoutes.paths[0]?.orderLineage.queryCallerAttributed).toBe(true);
  expect(failed.gaps).toContain("production_route_native_query_failed");
  const noPath = f.capture.facts.map(
    (fact): AiRuntimeProductionFactV1 =>
      fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path" && fact.spatial.phase === "resolved"
        ? { ...fact, spatial: { ...fact.spatial, result: "no_path", path: null } }
        : fact
  );
  const notFound = normalizeRuntimeProductionCausality({ ...f.capture, facts: noPath });
  expect(notFound.failures).toEqual([]);
  expect(notFound.producerRoutes.paths[0]?.orderLineage.queryCallerAttributed).toBe(true);
  expect(notFound.gaps).toContain("production_route_native_path_not_found");
});

test("invocation overflow drops the whole route group and still inspects the last contradictory stamp", () => {
  const f = callerFixture();
  const tail = Array.from({ length: 256 }, (_, index) =>
    f.fact({ ...f.requested, queryId: index + 2, queryCaller: { ...f.caller, invocationId: index + 2 } })
  );
  const facts = [...f.capture.facts, ...tail].map((fact, index) => ({ ...fact, sequence: index + 1 }));
  const capture = { ...f.capture, facts };
  expect(validateRuntimeRouteOrders(capture)).toMatchObject({ overflow: true, failures: [] });
  const result = normalizeRuntimeProductionCausality(capture);
  expect(result.producerRoutes.paths).toEqual([]);
  expect(result.gaps).toContain("production_route_group_overflow");
  facts.push({
    ...f.fact({
      ...f.resolved,
      queryId: 257,
      queryCaller: { ...f.caller, invocationId: 257, order: { ...f.currentOrder, commandContext: null } }
    }),
    sequence: facts.length + 1
  });
  expect(validateRuntimeRouteOrders(capture).failures).toContain("production_route_order_identity_conflict");
});

test("a later invocation cannot revive a restored admitted order using a fresh invocation id", () => {
  const f = callerFixture();
  const facts = [
    ...f.capture.facts,
    f.fact({ ...f.requested, kind: "route_order_restore", source: f.product, reason: "restore_attempt" }),
    f.fact({ ...f.requested, queryId: 2, queryCaller: { ...f.caller, invocationId: 2 } })
  ].map((fact, index) => ({ ...fact, sequence: index + 1 }));
  expect(validateRuntimeRouteOrders({ ...f.capture, facts }).failures).toContain(
    "production_route_query_caller_lifetime_revived"
  );
});
