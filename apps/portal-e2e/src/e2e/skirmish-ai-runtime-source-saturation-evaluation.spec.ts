import { expect, test } from "@playwright/test";
import { evaluateRuntimeSourceSaturation } from "./skirmish-ai-runtime-source-saturation-evaluation";

const requirement = {
  saturatedFixtureActorId: "full-tree",
  spareFixtureActorId: "spare-tree",
  resourceType: "wood",
  capacity: 2,
  latestTick: 1000
} as const;
const full = {
  actorId: "full", objectName: "Tree1", relation: "neutral", x: 28, y: 26, ready: true,
  resourceType: "wood", serviceCapacity: 2
};
const spare = {
  actorId: "spare", objectName: "Tree9", relation: "neutral", x: 30, y: 26, ready: true,
  resourceType: "wood", serviceCapacity: 2
};
const gather = (actorId: string, targetActorId: string) => ({ actorId, orderType: "Gather", targetActorId });
const first = {
  tick: 20,
  resourceServiceActors: [full, spare],
  workerOrders: [gather("worker-1", "full"), gather("worker-2", "full"), {
    actorId: "worker-3", orderType: null, targetActorId: null
  }]
};
const variant = {
  presetInitialOrderCount: 2,
  presetCreatedActorIds: { "full-tree": "full", "spare-tree": "spare" },
  checkpoints: [first, { ...first, tick: 200, workerOrders: [
    ...first.workerOrders.slice(0, 2), gather("worker-3", "spare")
  ] }]
};

test.describe("source-saturation runtime oracle", () => {
  test("requires real full-source and alternate-source worker orders", () => {
    expect(evaluateRuntimeSourceSaturation(requirement, variant)).toEqual([]);
    expect(evaluateRuntimeSourceSaturation(requirement, { ...variant, checkpoints: [first] })).toEqual([
      "source_saturation_spare_unused"
    ]);
    expect(evaluateRuntimeSourceSaturation(requirement, {
      ...variant, presetInitialOrderCount: 0
    })).toEqual(["source_saturation_preset_not_applied"]);
    expect(evaluateRuntimeSourceSaturation(requirement, {
      ...variant, checkpoints: [{ ...first, workerOrders: first.workerOrders.slice(2) }]
    })).toEqual(["source_saturation_not_observed", "source_saturation_spare_unused"]);
  });

  test("rejects overassignment and an absent authored spare source", () => {
    expect(evaluateRuntimeSourceSaturation(requirement, {
      ...variant,
      checkpoints: [first, { ...first, tick: 200, workerOrders: [
        ...first.workerOrders.slice(0, 2), gather("worker-3", "full")
      ] }]
    })).toEqual(["source_saturation_overassigned", "source_saturation_spare_unused"]);
    expect(evaluateRuntimeSourceSaturation(requirement, {
      ...variant, presetCreatedActorIds: { "full-tree": "full", "spare-tree": "missing" }
    })).toEqual(["source_saturation_spare_not_observed"]);
  });
});
