import { requireAiTestEntry } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { expect, test } from "@playwright/test";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { normalizeRuntimeProductionWorld } from "./skirmish-ai-runtime-production-world-normalization";
import { normalizeRuntimeProductionCausality } from "./skirmish-ai-runtime-production-causality-normalization";
import { productionWorldFixture, productionWorldObservation } from "./skirmish-ai-runtime-production-world-fixture";
test.describe("production world synthetic contract tests", () => {
  test("preserves base queue price and researched level separately, with null navigation and absent full evidence", () => {
    const { capture } = productionWorldFixture();
    const result = normalizeRuntimeProductionWorld(capture);
    expect(result.failures).toEqual([]);
    expect(requireAiTestEntry(requireAiTestEntry(result.snapshots, 0).catalog, 0)).toMatchObject({
      cost: { food: 7 },
      effectiveLevel: 2,
      priceSource: "base_production_definition",
      durationTicks: 3
    });
    expect(requireAiTestEntry(requireAiTestEntry(result.snapshots, 0).producers, 0)).toMatchObject({
      ready: true,
      position: null,
      reachable: null,
      currentLevel: 1
    });
    expect(result.gaps).toContain("production_world_current_observation_missing");
    expect(normalizeRuntimeProductionCausality(capture).gaps).toContain("production_ai_definition_catalog_missing");
  });
  test("uses exact current owned position and keeps a stale observation or unfinished producer from supplying readiness proof", () => {
    const { capture } = productionWorldFixture();
    const snapshot = requireAiTestEntry(capture.snapshots, 0);
    snapshot.observation = productionWorldObservation();
    requireAiTestEntry(snapshot.ownedActors, 0).objectName = ObjectNames.AnkGuard;
    requireAiTestEntry(snapshot.world.actors, 0).objectName = ObjectNames.AnkGuard;
    requireAiTestEntry(snapshot.queues, 0).objectName = ObjectNames.AnkGuard;
    expect(
      requireAiTestEntry(requireAiTestEntry(normalizeRuntimeProductionWorld(capture).snapshots, 0).producers, 0)
        .position
    ).toEqual({ x: 7, y: 9 });
    requireAiTestEntry(snapshot.world.actors, 0).finished = false;
    expect(
      requireAiTestEntry(requireAiTestEntry(normalizeRuntimeProductionWorld(capture).snapshots, 0).producers, 0).ready
    ).toBe(false);
    snapshot.tick = 1;
    expect(
      requireAiTestEntry(requireAiTestEntry(normalizeRuntimeProductionWorld(capture).snapshots, 0).producers, 0)
        .position
    ).toBeNull();
  });
  for (const defect of [
    "restore",
    "owner",
    "duplicate",
    "price",
    "duration",
    "future",
    "hidden",
    "position_time"
  ] as const) {
    test(`rejects supplied contradictory authority: ${defect}`, () => {
      const { capture } = productionWorldFixture();
      const snapshot = requireAiTestEntry(capture.snapshots, 0);
      if (defect === "restore") snapshot.world.snapshotRestoreInProgress = true;
      if (defect === "owner") requireAiTestEntry(snapshot.world.actors, 0).playerNumber = 2;
      if (defect === "duplicate") snapshot.world.catalog.push(requireAiTestEntry(snapshot.world.catalog, 0));
      if (defect === "price") requireAiTestEntry(snapshot.world.catalog, 0).cost.food = Number.NaN;
      if (defect === "duration") requireAiTestEntry(snapshot.world.catalog, 0).durationTicks = 4;
      if (defect === "future") snapshot.observation = productionWorldObservation(1);
      if (defect === "hidden" || defect === "position_time") {
        requireAiTestEntry(snapshot.ownedActors, 0).objectName = ObjectNames.AnkGuard;
        requireAiTestEntry(snapshot.world.actors, 0).objectName = ObjectNames.AnkGuard;
        requireAiTestEntry(snapshot.queues, 0).objectName = ObjectNames.AnkGuard;
        snapshot.observation = productionWorldObservation();
        snapshot.observation = {
          ...snapshot.observation,
          actors: snapshot.observation.actors.map((actor) =>
            defect === "hidden"
              ? { ...actor, visibility: "last_seen" as const }
              : {
                  ...actor,
                  logicalPosition: { status: "known" as const, value: { x: 7, y: 9, z: 0 }, observedTick: 1 }
                }
          )
        };
      }
      const result = normalizeRuntimeProductionWorld(capture);
      expect(result.failures.length).toBeGreaterThan(0);
      expect(result.snapshots).toEqual([]);
      const causal = normalizeRuntimeProductionCausality(capture);
      expect(causal.worldSnapshots).toEqual([]);
      expect(causal.operations).toEqual([]);
    });
  }
});
