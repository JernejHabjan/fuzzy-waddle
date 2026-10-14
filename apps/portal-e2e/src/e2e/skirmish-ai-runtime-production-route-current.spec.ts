import { test, expect } from "@playwright/test";
import { producerRouteFixture } from "./skirmish-ai-runtime-producer-route-fixture";
import { normalizeRuntimeProducerRoutes } from "./skirmish-ai-runtime-producer-route-normalization";
import { runtimeProductionRouteCurrent } from "./skirmish-ai-runtime-production-route-current";
import type { RuntimeProductionEvidenceV2 } from "./skirmish-ai-runtime-production-evidence-v2";

/** Synthetic continuity controls only; no authored row is promoted to a physical world or useful arrival. */
function fixture() {
  const source = producerRouteFixture();
  const original = normalizeRuntimeProducerRoutes(source.capture, [], [], { placements: [], spawns: [], paths: [] })
    .routes.paths[0];
  if (!original) throw new Error("route_fixture_missing");
  const navigation = {
    completedRebuild: 1,
    rebuildInProgress: false,
    groundConfiguration: 1,
    waterConfiguration: 1,
    groundCacheClear: 1,
    waterCacheClear: 1
  };
  const request = {
    ...original.requested,
    tick: 10,
    spatial: {
      ...source.requested,
      target: source.producer,
      targetInCaptureScene: true,
      navigation: { ...source.requested.navigation, native: { ...navigation } }
    }
  };
  const terminal = {
    ...original.terminal,
    tick: 11,
    spatial: {
      ...source.resolved,
      clockTick: 11,
      target: source.producer,
      targetInCaptureScene: true,
      navigation: { ...source.resolved.navigation, native: { ...navigation } }
    }
  };
  const path = { ...original, requested: request, terminal, currentAtResolution: false };
  const actors = [
    { identity: source.product, tile: { x: 3, y: 4 }, position: { x: 100, y: 100, z: 0 }, level: 1 },
    { identity: source.producer, tile: { x: 8, y: 9 }, position: { x: 300, y: 300, z: 0 }, level: 1 }
  ];
  const evidence = {
    coverage: {
      latestTick: 11,
      closedThroughTick: 11,
      requiredTicks: [11],
      gaps: [],
      intervals: [
        {
          closedFromTick: 0,
          closedThroughTick: 10,
          capturedAtTick: 11,
          afterSequence: 30,
          actors,
          navigation,
          queues: [],
          completedResearch: []
        },
        {
          closedFromTick: 11,
          closedThroughTick: 11,
          capturedAtTick: 12,
          afterSequence: 40,
          actors: structuredClone(actors),
          navigation: { ...navigation },
          queues: [],
          completedResearch: []
        }
      ]
    },
    lifecycle: { losses: [] }
  } satisfies {
    coverage: RuntimeProductionEvidenceV2["coverage"];
    lifecycle: Pick<RuntimeProductionEvidenceV2["lifecycle"], "losses">;
  };
  return { path, evidence };
}

test("an awaited owned route requires continuous closed actor and navigation authority", () => {
  const { path, evidence } = fixture();
  expect(runtimeProductionRouteCurrent(evidence, path)).toBe(true);
});

test("a later rebuild in the terminal tick does not retroactively stale the completed native query", () => {
  const { path, evidence } = fixture();
  const interval = evidence.coverage.intervals[1];
  if (!interval) throw new Error("closed_fixture_missing");
  interval.navigation.completedRebuild += 1;
  expect(runtimeProductionRouteCurrent(evidence, path)).toBe(true);
});

test("a rebuild before resolution or during a preceding closed tick still refuses the route", () => {
  for (const boundary of ["terminal", "previous"] as const) {
    const { path, evidence } = fixture();
    if (boundary === "terminal") {
      const native = path.terminal.spatial.navigation?.native;
      if (!native) throw new Error("native_fixture_missing");
      native.completedRebuild += 1;
    }
    else {
      const interval = evidence.coverage.intervals[0];
      if (!interval) throw new Error("closed_fixture_missing");
      interval.navigation.completedRebuild += 1;
    }
    expect(runtimeProductionRouteCurrent(evidence, path)).toBe(false);
  }
});

test("awaited builder work proves a stationary unfinished site without requiring it to be finished before construction", () => {
  const { path, evidence } = fixture();
  const target = path.requested.spatial.kind === "producer_path" ? path.requested.spatial.target : null;
  if (!target) throw new Error("builder_target_missing");
  for (const interval of evidence.coverage.intervals) {
    const site = interval.actors.find((actor) => actor.identity.actorId === target.actorId);
    if (!site) throw new Error("builder_site_missing");
    site.identity = { ...site.identity, finished: false };
  }
  const builderPath = {
    currentAtResolution: false,
    topologyObservation: path.topologyObservation,
    nativeNavigation: path.nativeNavigation,
    requested: {
      ...path.requested,
      spatial: { ...path.requested.spatial, kind: "builder_path" as const, target: { ...target, finished: false } }
    },
    resolved: {
      ...path.terminal,
      spatial: { ...path.terminal.spatial, kind: "builder_path" as const, target: { ...target, finished: false } }
    },
    constructionPlacement: null,
    constructionCommand: null
  };
  expect(runtimeProductionRouteCurrent(evidence, builderPath)).toBe(true);
  const site = evidence.coverage.intervals[1]?.actors[1];
  if (!site) throw new Error("builder_site_missing");
  site.identity = { ...site.identity, finished: true };
  expect(runtimeProductionRouteCurrent(evidence, builderPath)).toBe(false);
});

test("movement, lifetime, navigation change, missing samples and skipped intervals refuse awaited credit", () => {
  for (const defect of ["movement", "navigation", "missing", "gap", "dead", "tile"] as const) {
    const { path, evidence } = fixture();
    const interval = evidence.coverage.intervals[1];
    const actor = interval?.actors[0];
    if (!interval || !actor) throw new Error("closed_fixture_missing");
    if (defect === "movement") actor.position.x += 1;
    const previous = evidence.coverage.intervals[0];
    if (!previous) throw new Error("closed_fixture_missing");
    if (defect === "navigation") previous.navigation.completedRebuild += 1;
    if (defect === "missing") interval.actors = [];
    if (defect === "gap") interval.closedFromTick = 12;
    if (defect === "dead") actor.identity = { ...actor.identity, alive: false };
    if (defect === "tile") actor.tile.x += 1;
    expect(runtimeProductionRouteCurrent(evidence, path)).toBe(false);
  }
});
