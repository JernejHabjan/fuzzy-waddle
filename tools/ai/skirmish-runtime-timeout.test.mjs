import assert from "node:assert/strict";
import test from "node:test";
import { skirmishRuntimeTestTimeoutMs } from "../../apps/portal-e2e/src/e2e/skirmish-ai-runtime-timeout.mjs";

test("one selected native variant gets a horizon-based test window", () => {
  assert.equal(skirmishRuntimeTestTimeoutMs(1, 2_000), 180_000 + 2_000 * 450);
});

test("runtime test windows leave teardown margin inside the thirty-minute wall cap", () => {
  const maximumTestWindow = 28 * 60_000;
  const teardownMargin = 2 * 60_000;
  assert.equal(skirmishRuntimeTestTimeoutMs(3, 20_000), maximumTestWindow);
  assert.equal(skirmishRuntimeTestTimeoutMs(100, 120_000), maximumTestWindow);
  assert.ok(maximumTestWindow + teardownMargin <= 30 * 60_000);
});

test("the base timeout covers startup when no variants are selected", () => {
  assert.equal(skirmishRuntimeTestTimeoutMs(0), 10 * 60_000);
});

test("runtime timeout rejects invalid variant counts", () => {
  assert.throws(() => skirmishRuntimeTestTimeoutMs(-1), /invalid_runtime_timeout_budget/);
  assert.throws(() => skirmishRuntimeTestTimeoutMs(1.5), /invalid_runtime_timeout_budget/);
  assert.throws(() => skirmishRuntimeTestTimeoutMs(1, -1), /invalid_runtime_timeout_budget/);
});
