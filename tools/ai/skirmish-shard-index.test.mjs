import assert from "node:assert/strict";
import { test } from "node:test";
import { buildSkirmishShardIndex } from "./skirmish-shard-index.mjs";

function report() {
  return {
    status: "failed", runId: "run-1", candidate: "candidate", manifestVersion: "skirmish-v1",
    fixtureDigest: "sha256:fixture", rows: ["PRO-01", "PRO-02", "PRO-03"],
    workCounts: { decisions: 30, ticks: 100 }, execution: { wallMs: 500 },
    runtime: { scenarios: [
      { scenarioId: "PRO-01", passed: true, failures: [], variants: [{ variantId: "subject" }] },
      { scenarioId: "PRO-02", passed: false, failures: ["subject:capacity_not_observed"],
        variants: [{ variantId: "subject" }] }
    ] }
  };
}

test("compact shard index preserves counts and raw artifact pointer", () => {
  const index = buildSkirmishShardIndex(report(), "tmp/raw.json");
  assert.deepEqual(index.totals, {
    expected: 3, executed: 2, passed: 1, failed: 1, unexecuted: 1,
    decisions: 30, ticks: 100, wallMs: 500
  });
  assert.equal(index.artifact, "tmp/raw.json");
  assert.deepEqual(index.failures, [{ scenarioId: "PRO-02", predicate: "subject:capacity_not_observed" }]);
});

test("zero-work shard cannot report a passing scenario", () => {
  const input = report();
  input.workCounts = { decisions: 0, ticks: 0 };
  const index = buildSkirmishShardIndex(input, "tmp/raw.json");
  assert.equal(index.totals.executed, 0);
  assert.equal(index.totals.unexecuted, 3);
  assert.equal(index.reason, "runtime_zero_work");
});

test("a failing browser process invalidates apparently passing scenario rows", () => {
  const input = report();
  input.process = { exitCode: 1 };
  const index = buildSkirmishShardIndex(input, "tmp/raw.json");
  assert.equal(index.totals.passed, 0);
  assert.equal(index.totals.failed, 2);
  assert.deepEqual(index.failures[0], { scenarioId: "PRO-01", predicate: "process_exit:1" });
});

test("combined pure/runtime wrapper indexes only the runtime shard", () => {
  const runtime = report();
  const index = buildSkirmishShardIndex({ status: "failed", rows: ["PRO-01", "PURE-01"], runtime }, "tmp/raw.json");
  assert.equal(index.totals.expected, 3);
  assert.equal(index.runId, "run-1");
});

test("failure truncation retains exact totals and reversibility", () => {
  const input = report();
  input.rows = Array.from({ length: 200 }, (_, index) => `PRO-${String(index).padStart(3, "0")}`);
  input.runtime.scenarios = input.rows.map((scenarioId) => ({ scenarioId, passed: false,
    failures: [`subject:${"failure".repeat(20)}`], variants: [{ variantId: "subject" }] }));
  const index = buildSkirmishShardIndex(input, "tmp/raw.json", 2048);
  assert.equal(index.totals.failed, 200);
  assert.ok(index.omittedFailures > 0);
  assert.ok(Buffer.byteLength(JSON.stringify(index)) <= 2048);
});
