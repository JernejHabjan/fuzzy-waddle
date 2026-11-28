import assert from "node:assert/strict";
import test from "node:test";
import { skirmishRuntimeTestTimeoutMs } from "../../shared/transport/skirmish-ai-runtime-timeout.ts";

test("runtime selections cannot expand the three-minute test ceiling", () => {
  for (const [variants, ticks] of [
    [0, 0],
    [1, 2000],
    [8, 3000],
    [100, 120000]
  ]) {
    assert.equal(skirmishRuntimeTestTimeoutMs(variants, ticks), 3 * 60_000);
  }
});

test("runtime timeout rejects invalid variant counts", () => {
  assert.throws(() => skirmishRuntimeTestTimeoutMs(-1), /invalid_runtime_timeout_budget/);
  assert.throws(() => skirmishRuntimeTestTimeoutMs(1.5), /invalid_runtime_timeout_budget/);
  assert.throws(() => skirmishRuntimeTestTimeoutMs(1, -1), /invalid_runtime_timeout_budget/);
});
