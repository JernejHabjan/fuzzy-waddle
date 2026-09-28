import assert from "node:assert/strict";
import test from "node:test";
import { buildRepairReport } from "./skirmish-repair-report.mjs";

function shard(id, fixture, digest, failure = null) {
  const scenario = {
    scenarioId: id,
    passed: failure === null,
    failures: failure ? [`subject:${failure}`] : [],
    variants: [{ variantId: "subject", repetition: 2, seed: 42, checkpoints: [{ tick: 300, gameResult: null }] }]
  };
  return {
    path: `tmp/sweep/${id}.json`,
    report: {
      schemaVersion: 1,
      runId: "run-42",
      candidate: "a".repeat(40),
      dirtySourceDigest: null,
      manifestVersion: "skirmish-v1",
      fixtureDigest: `aggregate-${id}`,
      fixtureIdentityDigests: [{ reference: fixture, digest }],
      scenarioSources: [{ scenarioId: id, reference: fixture, group: "economy", map: "frozen-open" }],
      status: failure ? "failed" : "passed",
      rows: [id],
      workCounts: { scenarios: 1, tests: 1, decisions: 4, ticks: 300 },
      runtime: { scenarios: [scenario] }
    }
  };
}

test("counts passing and failing shards while accepting distinct aggregate fixture digests", () => {
  const report = buildRepairReport([
    shard("ECO-01", "economy.json", "digest-a", "missing_field"),
    shard("PRO-01", "production.json", "digest-b")
  ]);
  assert.equal(report.status, "failed");
  assert.deepEqual(report.totals, {
    expected: 2, executed: 2, passed: 1, failed: 1, unexecuted: 0, failureOccurrences: 1, clusters: 1
  });
  assert.equal(report.clusters[0].representative.failedPredicate, "missing_field");
  assert.equal(report.clusters[0].representative.lastObserved.tick, 300);
  assert.equal(report.clusters[0].representative.artifact, "tmp/sweep/ECO-01.json");
  assert.equal(report.clusters[0].representative.rerunVariant,
    "node tools/ai/run-skirmish-matrix.mjs --scenario ECO-01 --mode runtime" +
      " --variant subject --repetition 2 --seed 42");
});

test("diagnostic reruns never count as complete matrix coverage", () => {
  const diagnostic = shard("ECO-01", "economy.json", "digest-a");
  diagnostic.report.status = "diagnostic_passed";
  diagnostic.report.diagnosticSelection = { scenarioId: "ECO-01", variantId: "subject", repetition: 2 };
  assert.throws(() => buildRepairReport([diagnostic]), /repair_report_not_full_coverage/);
});

test("rejects conflicting fixture provenance and mixed source revisions", () => {
  const first = shard("ECO-01", "shared.json", "digest-a");
  const conflict = shard("ECO-02", "shared.json", "digest-b");
  assert.throws(() => buildRepairReport([first, conflict]), /repair_report_fixture_conflict/);
  conflict.report.fixtureIdentityDigests[0].digest = "digest-a";
  conflict.report.candidate = "b".repeat(40);
  assert.throws(() => buildRepairReport([first, conflict]), /repair_report_provenance_mismatch:candidate/);
});

test("rejects duplicate rows and unexpected fixture membership", () => {
  const first = shard("ECO-01", "economy.json", "digest-a");
  assert.throws(() => buildRepairReport([first, first]), /repair_report_row_conflict/);
  const unexpected = shard("PRO-01", "production.json", "digest-b");
  unexpected.report.scenarioSources[0].reference = "not-in-shard.json";
  assert.throws(() => buildRepairReport([unexpected]), /repair_report_row_conflict/);
});

test("classifies zero-work rows as unexecuted infrastructure", () => {
  const empty = shard("ECO-01", "economy.json", "digest-a");
  empty.report.status = "failed";
  empty.report.workCounts.decisions = 0;
  const report = buildRepairReport([empty]);
  assert.equal(report.totals.unexecuted, 1);
  assert.equal(report.totals.passed, 0);
  assert.equal(report.clusters[0].classification, "infrastructure");
});

test("rejects malformed duplicate runtime scenario payloads", () => {
  const duplicate = shard("ECO-01", "economy.json", "digest-a");
  duplicate.report.runtime.scenarios.push(duplicate.report.runtime.scenarios[0]);
  assert.throws(() => buildRepairReport([duplicate]), /repair_report_invalid_runtime/);
});

test("truncates displayed clusters without hiding failures or changing status", () => {
  const report = buildRepairReport([
    shard("ECO-01", "economy.json", "digest-a", "missing_field"),
    shard("PRO-01", "production.json", "digest-b", "missing_producer")
  ], { maxClusters: 1 });
  assert.equal(report.status, "failed");
  assert.equal(report.clusters.length, 1);
  assert.equal(report.omittedClusters, 1);
  assert.equal(report.totals.failed, 2);
  assert.equal(report.totals.clusters, 2);
  assert.equal(report.omittedFailureOccurrences, 1);
});

test("a required matrix stays failed when one selected shard never ran", () => {
  const report = buildRepairReport([shard("ECO-01", "economy.json", "digest-a")], {
    expectedIds: ["ECO-01", "PRO-01"]
  });
  assert.equal(report.status, "failed");
  assert.deepEqual(report.totals, {
    expected: 2, executed: 1, passed: 1, failed: 0, unexecuted: 1, failureOccurrences: 1, clusters: 1
  });
  assert.equal(report.clusters[0].classification, "infrastructure");
});
