import assert from "node:assert/strict";
import test from "node:test";
import { skirmishRuntimeTestTimeoutMs } from "../../apps/portal-e2e/src/e2e/skirmish-ai-runtime-timeout.mjs";

test("one selected native variant gets a bounded thirteen-minute test window", () => {
  assert.equal(skirmishRuntimeTestTimeoutMs(1), 13 * 60_000);
});

test("serial runtime variants add ten minutes each after startup and sealing", () => {
  assert.equal(skirmishRuntimeTestTimeoutMs(3), 33 * 60_000);
});

test("the base timeout covers startup when no variants are selected", () => {
  assert.equal(skirmishRuntimeTestTimeoutMs(0), 10 * 60_000);
});

test("runtime timeout rejects invalid variant counts", () => {
  assert.throws(() => skirmishRuntimeTestTimeoutMs(-1), /invalid_runtime_variant_count/);
  assert.throws(() => skirmishRuntimeTestTimeoutMs(1.5), /invalid_runtime_variant_count/);
});
