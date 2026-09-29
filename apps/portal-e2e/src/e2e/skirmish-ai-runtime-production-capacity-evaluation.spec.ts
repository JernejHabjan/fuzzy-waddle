import { expect, test } from "@playwright/test";
import type { RuntimeCheckpointV1 } from "./skirmish-ai-runtime-checkpoint";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { evaluateRuntimeProductionCapacity } from "./skirmish-ai-runtime-production-capacity-evaluation";

const assertion = { latestTick: 2000, producerObjectNameByFaction: {
  Tivara: "AnkGuard", Skaduwee: "InfantryInn"
} } as const;

function checkpoint(tick: number, producerCount: number, desired = 2): RuntimeCheckpointV1 {
  return {
    tick,
    militaryProducerNames: Array.from({ length: producerCount }, () => "AnkGuard"),
    demands: [
      { demandId: "demand:capacity:first-army", desired, purpose: "dated_military_throughput",
        satisfied: producerCount, queued: 0, constructing: 0, accepted: 0 },
      { demandId: "demand:composition:first-squad", desired: 12, purpose: "dated_land_pressure",
        satisfied: 3, queued: 2, constructing: 0, accepted: 0 }
    ]
  } as RuntimeCheckpointV1;
}

function variant(branch: "build" | "already_sufficient", checkpoints: readonly RuntimeCheckpointV1[]): RuntimeVariantResultV1 {
  return {
    aiFaction: "Tivara", presetFixtureId: "capacity", productionCapacityBranch: branch,
    presetCreatedActorNames: branch === "build" ? ["AnkGuard"] : ["AnkGuard", "AnkGuard"],
    checkpoints
  } as RuntimeVariantResultV1;
}

test("capacity subject needs a ready second producer before squad completion", () => {
  const ready = variant("build", [checkpoint(20, 1), checkpoint(600, 2)]);
  expect(evaluateRuntimeProductionCapacity("PRO-03", assertion, ready)).toEqual([]);
  expect(evaluateRuntimeProductionCapacity("PRO-03", assertion, variant("build", [checkpoint(20, 1)])))
    .toContain("production_capacity_not_ready");
});

test("ample-capacity control must not construct a cash-only third producer", () => {
  const safe = variant("already_sufficient", [checkpoint(20, 2), checkpoint(2000, 2)]);
  expect(evaluateRuntimeProductionCapacity("PRO-06", assertion, safe)).toEqual([]);
  expect(evaluateRuntimeProductionCapacity("PRO-06", assertion,
    variant("already_sufficient", [checkpoint(20, 2), checkpoint(2000, 3)])))
    .toContain("production_capacity_unnecessary_duplicate");
});

test("capacity claim without a dated two-producer demand does not count", () => {
  expect(evaluateRuntimeProductionCapacity("PRO-01", assertion,
    variant("build", [checkpoint(20, 1, 1), checkpoint(600, 2, 1)])))
    .toContain("production_capacity_dated_demand_missing");
});
