import { ConstructionStateEnum } from "@fuzzy-waddle/probable-waffle-protocol";
import { expect, test } from "@playwright/test";
import type { AiRuntimeProductionFactV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-production-fact-v1";
import { productionSpatialFixture } from "./skirmish-ai-runtime-production-spatial-fixture";
import { producerRouteFixture } from "./skirmish-ai-runtime-producer-route-fixture";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";

/** Synthetic diagnostic contracts, unrun until the final gate; never real useful-effect or production-family evidence. */
test("output/spawn/query reports retain exact queue completion and accepted demand, independently of useful arrival", () => {
  const f = producerRouteFixture();
  const result = normalizeRuntimeProductionCausality(f.capture);
  expect(result.failures).toEqual([]);
  expect(result.producerRoutes.outputs).toHaveLength(1);
  const output = result.producerRoutes.outputs[0];
  expect(output?.completion).toMatchObject({ originatingCommandId: "purchase", worldLinkId: f.product.actorId });
  expect(output?.commandScope?.acceptedIntent).toMatchObject({ kind: "produce", demandId: "demand:force" });
  expect(output?.commandScope?.decision).not.toBeNull();
  expect(output?.spawn?.spatial).toMatchObject({ kind: "spawn", tile: { x: 3, y: 4 } });
  expect(result.producerRoutes.paths[0]).toMatchObject({ currentAtResolution: true, topologyObservation: "same_observed" });
  expect(result.producerRoutes.paths[0]?.output?.boundary.sequence).toBe(output?.boundary.sequence);
  expect(result.gaps).toContain("production_route_useful_arrival_missing");
  expect(result.gaps).toContain("production_route_native_cache_provenance_missing");
  expect(result.gaps).toContain("production_route_rally_command_identity_missing");
  expect(result).not.toHaveProperty("pairedSetupDigest");
});

for (const result of ["no_path", "path"] as const) {
  test(`native ${result} retains null versus empty success without claiming usefulness`, () => {
    const f = producerRouteFixture();
    const facts = f.capture.facts.map((fact): AiRuntimeProductionFactV1 =>
      fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path" && fact.spatial.phase === "resolved" ?
        { ...fact, spatial: { ...fact.spatial, result, path: result === "path" ? [] : null } } : fact);
    const normalized = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(normalized.failures).toEqual([]);
    expect(normalized.producerRoutes.paths[0]?.terminal.spatial).toMatchObject({ result, path: result === "path" ? [] : null });
    expect(normalized.gaps).toContain("production_route_useful_arrival_missing");
  });
}

test("service-target queries cannot borrow a production demand from producer identity", () => {
  const f = producerRouteFixture();
  const facts = f.capture.facts.map((fact): AiRuntimeProductionFactV1 =>
    fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path" ? { ...fact, spatial: {
      ...fact.spatial, purpose: "producer_service", outputId: null, method: "object_radius", radiusTiles: 1,
      target: f.producer, targetInCaptureScene: true } } : fact);
  const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
  expect(result.failures).toEqual([]); expect(result.producerRoutes.paths[0]?.output).toBeNull();
  expect(result.gaps).toContain("production_route_service_demand_identity_missing");
});

for (const fence of ["restore", "reuse", "scene", "index", "awaited", "topology"] as const) {
  test(`${fence} cannot provide a current useful route binding`, () => {
    const f = producerRouteFixture();
    let facts = f.capture.facts.map((fact): AiRuntimeProductionFactV1 => {
      if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "producer_path" || fact.spatial.phase !== "resolved") return fact;
      const spatial = { ...fact.spatial };
      if (fence === "restore") spatial.snapshotRestoreInProgress = true;
      if (fence === "scene") spatial.sourceInCaptureScene = false;
      if (fence === "index") spatial.source = { ...spatial.source, indexed: false };
      if (fence === "topology") spatial.navigation = { graphObservationId: 2, updateRequestCount: 1 };
      if (fence === "awaited") spatial.clockTick = 11;
      return { ...fact, tick: fence === "awaited" ? 11 : fact.tick, spatial };
    });
    if (fence === "reuse") facts = facts.flatMap((fact): AiRuntimeProductionFactV1[] =>
      fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path" && fact.spatial.phase === "resolved" ? [
        { sequence: 0, tick: 10, playerNumber: 1, kind: "actor_unregistered",
          actorId: f.product.actorId ?? "", objectName: f.product.objectName }, fact] : [fact]);
    facts = facts.map((fact, index) => ({ ...fact, sequence: index + 1 }));
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures).toEqual([]);
    const path = result.producerRoutes.paths[0];
    expect(path).toBeDefined();
    if (fence === "topology") expect(path?.topologyObservation).toBe("changed");
    else expect(path?.currentAtResolution).toBe(false);
    if (fence === "reuse" || fence === "restore") expect(path?.output).toBeNull();
    expect(result.gaps).toContain("production_route_useful_arrival_missing");
  });
}

for (const missing of ["output", "spawn", "completion", "resolution"] as const) {
  test(`missing ${missing} leaves explicit unavailable lineage`, () => {
    const f = producerRouteFixture();
    const facts = f.capture.facts.filter((fact) => missing === "completion" ? fact.kind !== "queue_completion" :
      fact.kind !== "spatial_authority" || (missing === "output" ? fact.spatial.kind !== "output" :
        missing === "spawn" ? fact.spatial.kind !== "spawn" :
          fact.spatial.kind !== "producer_path" || fact.spatial.phase !== "resolved"));
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures).toEqual([]);
    expect(result.gaps).toContain(missing === "output" ? "production_route_output_query_binding_missing" :
      missing === "spawn" ? "production_route_output_spawn_identity_missing" : missing === "completion" ?
        "production_route_output_completion_identity_missing" : "production_route_pending_or_missing_queries");
  });
}

for (const defect of [
  "item", "product", "command", "query", "target", "result", "navigation", "duplicate_output", "reused_product", "duplicate_end"
]) {
  test(`contradictory ${defect} suppresses route and other normalized groups`, () => {
    const f = producerRouteFixture();
    let facts = f.capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
      if (fact.kind !== "spatial_authority") return [fact];
      if (fact.spatial.kind === "output") {
        const spatial = { ...fact.spatial };
        if (defect === "item") spatial.item = { ...spatial.item, itemId: "borrowed" };
        if (defect === "command") spatial.item = { ...spatial.item, commandId: "borrowed" };
        if (defect === "product") spatial.product = { ...spatial.product, actorId: "borrowed" };
        if (defect === "duplicate_output") return [fact, fact];
        if (defect === "reused_product") return [fact, { ...fact, spatial: { ...spatial, outputId: 2 } }];
        return [{ ...fact, spatial }];
      }
      if (fact.spatial.kind === "producer_path" && fact.spatial.phase === "resolved") {
        const spatial = { ...fact.spatial };
        if (defect === "query") spatial.queryId = 99;
        if (defect === "target") spatial.targetTile = { x: 99, y: 99 };
        if (defect === "result") spatial.result = "no_path";
        if (defect === "navigation") spatial.navigation = { graphObservationId: 0, updateRequestCount: 0 };
        if (defect === "duplicate_end") return [fact, fact];
        return [{ ...fact, spatial }];
      }
      return [fact];
    });
    facts = facts.map((fact, index) => ({ ...fact, sequence: index + 1 }));
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures.length).toBeGreaterThan(0);
    expect(result.producerRoutes).toEqual({ outputs: [], paths: [] });
    expect(result.completions).toEqual([]); expect(result.payments).toEqual([]);
    expect(result.spatialAuthority).toEqual({ placements: [], spawns: [], paths: [] });
  });
}

test("whole-group overflow drops all route entries and still inspects the contradictory tail", () => {
  const f = producerRouteFixture();
  const base = f.capture.facts.filter((fact) => fact.kind !== "spatial_authority" || fact.spatial.kind !== "producer_path");
  const more = Array.from({ length: 257 }, (_, index) => [
    f.fact({ ...f.requested, queryId: index + 1 }), f.fact({ ...f.resolved, queryId: index + 1 })]).flat();
  const capture = { ...f.capture, facts: [...base, ...more].map((fact, index) => ({ ...fact, sequence: index + 1 })) };
  const result = normalizeRuntimeProductionCausality(capture);
  expect(result.failures).toEqual([]); expect(result.producerRoutes).toEqual({ outputs: [], paths: [] });
  expect(result.gaps).toContain("production_route_group_overflow");
  const tail = f.fact({ ...f.resolved, queryId: 257, targetTile: { x: 99, y: 99 } });
  const corrupt = { ...capture, facts: [...capture.facts.slice(0, -1), { ...tail, sequence: capture.facts.length }] };
  expect(normalizeRuntimeProductionCausality(corrupt).failures).toContain("production_route_query_interval_invalid");
});

test("output inventory overflow drops the whole group without retaining partial demand links", () => {
  const f = producerRouteFixture();
  const facts = f.capture.facts.filter((fact) => fact.kind !== "spatial_authority" ||
    fact.spatial.kind !== "output" && fact.spatial.kind !== "producer_path");
  const outputs = Array.from({ length: 257 }, (_, index) => f.fact({ ...f.output, outputId: index + 1,
    product: { ...f.product, actorId: `uncommanded:${index}` },
    item: { ...f.output.item, itemId: `local:${index}`, identitySource: "capture_local", commandId: null, effectId: null } }));
  const result = normalizeRuntimeProductionCausality({ ...f.capture,
    facts: [...facts, ...outputs].map((fact, index) => ({ ...fact, sequence: index + 1 })) });
  expect(result.failures).toEqual([]); expect(result.producerRoutes).toEqual({ outputs: [], paths: [] });
  expect(result.gaps).toContain("production_route_group_overflow");
});

test("interleaved builder and producer queries cannot regress the one shared navigation observation", () => {
  const f = producerRouteFixture();
  const builder = productionSpatialFixture().requested;
  const earlier = f.fact({ ...builder, clockTick: 10, navigation: { graphObservationId: 2, updateRequestCount: 0 } });
  const facts = f.capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] =>
    fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path" && fact.spatial.phase === "requested" ?
      [earlier, fact] : [fact]).map((fact, index) => ({ ...fact, sequence: index + 1 }));
  const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
  expect(result.failures.length).toBeGreaterThan(0); expect(result.producerRoutes).toEqual({ outputs: [], paths: [] });
});


test("manual construction setData fences a producer service query even outside global snapshot restore", () => {
  const f = producerRouteFixture();
  const restore = { sequence: 0, tick: 10, playerNumber: 1, kind: "construction_authority", construction: {
    kind: "lifecycle", transition: "restored", state: ConstructionStateEnum.Finished, remainingWorkMs: 0,
    snapshotRestoreInProgress: false, sceneActive: true, clockTick: 10, site: f.producer
  } } satisfies AiRuntimeProductionFactV1;
  const facts = f.capture.facts.flatMap((fact): AiRuntimeProductionFactV1[] => {
    if (fact.kind !== "spatial_authority" || fact.spatial.kind !== "producer_path") return [fact];
    const changed = { ...fact, spatial: { ...fact.spatial, purpose: "producer_service", outputId: null,
      method: "object_radius", radiusTiles: 1, target: f.producer, targetInCaptureScene: true } }
      satisfies AiRuntimeProductionFactV1;
    return fact.spatial.phase === "resolved" ? [restore, changed] : [changed];
  }).map((fact, index) => ({ ...fact, sequence: index + 1 }));
  const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
  expect(result.failures).toEqual([]); expect(result.producerRoutes.paths[0]?.currentAtResolution).toBe(false);
  expect(result.gaps).toContain("production_route_restore_or_reuse_fence");
});

for (const phase of ["rejected", "threw"] as const) {
  test(`native ${phase} query keeps its terminal and failure gap without successful path credit`, () => {
    const f = producerRouteFixture();
    const facts = f.capture.facts.map((fact): AiRuntimeProductionFactV1 =>
      fact.kind === "spatial_authority" && fact.spatial.kind === "producer_path" && fact.spatial.phase === "resolved" ?
        { ...fact, spatial: { ...fact.spatial, phase, path: null, result: null } } : fact);
    const result = normalizeRuntimeProductionCausality({ ...f.capture, facts });
    expect(result.failures).toEqual([]);
    expect(result.producerRoutes.paths[0]?.terminal.spatial).toMatchObject({ phase, path: null, result: null });
    expect(result.gaps).toContain("production_route_native_query_failed");
  });
}
