import { expect, test } from "@playwright/test";
import { evaluateRuntimeResourceLabor } from "./skirmish-ai-runtime-resource-labor-evaluation";

const requirement = { playerNumber: 2, resourceType: "wood", latestTick: 900 } as const;
const source = {
  actorId: "observed-tree",
  objectName: "Tree1",
  relation: "neutral",
  x: 28,
  y: 26,
  ready: true,
  resourceType: "wood",
  serviceCapacity: 2
};
const first = {
  tick: 20,
  resourceServiceActors: [source],
  workerOrders: [{ actorId: "worker", orderType: null, targetActorId: null }]
};
const later = {
  ...first,
  tick: 300,
  workerOrders: [{ actorId: "worker", orderType: "Gather", targetActorId: "observed-tree" }]
};
const variant = {
  presetInitialOrderCount: 0,
  presetResourceStartCount: 1,
  presetInitialResourceBalances: { 2: { wood: 0 } },
  checkpoints: [first, later]
};

test.describe("authoritative resource-labor runtime oracle", () => {
  test("requires an observed source and a later real worker order", () => {
    expect(evaluateRuntimeResourceLabor(requirement, variant)).toEqual([]);
    expect(evaluateRuntimeResourceLabor(requirement, { ...variant, checkpoints: [first] })).toEqual([
      "resource_labor_gather_order_missing"
    ]);
    expect(
      evaluateRuntimeResourceLabor(requirement, {
        ...variant,
        checkpoints: [
          { ...first, resourceServiceActors: [] },
          { ...later, resourceServiceActors: [] }
        ]
      })
    ).toEqual(["resource_labor_source_not_observed", "resource_labor_gather_order_missing"]);
  });

  test("rejects a preset order, absent exact resource start or late-only response", () => {
    expect(evaluateRuntimeResourceLabor(requirement, { ...variant, presetInitialOrderCount: 1 })).toEqual([
      "resource_labor_has_authored_starting_order"
    ]);
    expect(evaluateRuntimeResourceLabor(requirement, { ...variant, presetResourceStartCount: 0 })).toEqual([
      "resource_labor_start_not_applied"
    ]);
    expect(
      evaluateRuntimeResourceLabor(requirement, {
        ...variant,
        presetInitialResourceBalances: { 2: { wood: 10 } }
      })
    ).toEqual(["resource_labor_zero_balance_missing"]);
    expect(
      evaluateRuntimeResourceLabor(requirement, { ...variant, checkpoints: [first, { ...later, tick: 901 }] })
    ).toEqual(["resource_labor_gather_order_missing"]);
  });
});
