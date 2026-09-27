import { expect, test } from "@playwright/test";
import { evaluateRuntimeWorkerGrowth } from "./skirmish-ai-runtime-worker-growth-evaluation";

const requirement = {
  variantId: "tivara-workforce-growth",
  initialWorkerCount: 6,
  minimumPeakWorkerCount: 7,
  minimumFinalWorkerCount: 7,
  latestTick: 3000
};
const variant = {
  variantId: "tivara-workforce-growth",
  initialWorkerCount: 6,
  presetResourceStartCount: 1,
  checkpoints: [
    { tick: 20, workerCount: 6, deliveredIncome: 0 },
    { tick: 1600, workerCount: 7, deliveredIncome: 15 },
    { tick: 3000, workerCount: 8, deliveredIncome: 20 }
  ]
};

test.describe("worker-growth runtime oracle", () => {
  test("requires observed and retained workers plus real delivered income", () => {
    expect(evaluateRuntimeWorkerGrowth(requirement, variant)).toEqual([]);
    expect(evaluateRuntimeWorkerGrowth(requirement, {
      ...variant,
      checkpoints: variant.checkpoints.slice(0, 1)
    })).toEqual(["worker_growth_peak_missing", "worker_growth_not_retained", "worker_growth_no_delivered_income"]);
    expect(evaluateRuntimeWorkerGrowth(requirement, {
      ...variant,
      checkpoints: [...variant.checkpoints.slice(0, 2), { tick: 3000, workerCount: 6, deliveredIncome: 20 }]
    })).toEqual(["worker_growth_not_retained"]);
  });

  test("rejects a preset mismatch and ignores unrelated variants", () => {
    expect(evaluateRuntimeWorkerGrowth(requirement, { ...variant, presetResourceStartCount: 0 })).toEqual([
      "worker_growth_initial_world"
    ]);
    expect(evaluateRuntimeWorkerGrowth(requirement, { ...variant, variantId: "skaduwee-opening" })).toEqual([]);
  });
});
