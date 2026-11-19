import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { compareMeasurements } from "./metrics-report.mjs";

async function fixture(t, overrides = {}) {
  const root = await mkdtemp(resolve(tmpdir(), "fuzzy-agent-metrics-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  const report = (elapsedMilliseconds, revision) => ({
    schemaVersion: 1,
    status: "measured",
    benchmark: { id: "sample", version: 1, digest: "a".repeat(64) },
    provenance: { revision, worktreeStatus: [] },
    qualityInvariants: [{ id: "same-evidence" }],
    totals: {
      wallMilliseconds: elapsedMilliseconds,
      directProcessStarts: 1,
      contextBytes: 10,
      outputBytes: 8,
      outputLines: 1,
      retainedLogBytes: 8,
      cacheTextIndicators: 1
    },
    workflows: [
      {
        id: "runtime",
        context: { bytes: 10 },
        declaredStarts: { server: 1, browser: 1, worker: 1 },
        matchesExpectedOutcome: true,
        commands: [
          {
            elapsedMilliseconds,
            output: { stdoutBytes: 8, stderrBytes: 0, cache: { status: "hit", hitCount: 1, missCount: 0 } }
          }
        ]
      }
    ]
  });
  const before = { ...report(20, "a".repeat(40)), ...overrides.before };
  const after = { ...report(10, "b".repeat(40)), ...overrides.after };
  await writeFile(resolve(root, "before.json"), JSON.stringify(before));
  await writeFile(resolve(root, "after.json"), JSON.stringify(after));
  return root;
}

test("compares compatible reports and ranks the evidence-backed bottleneck", async (t) => {
  const root = await fixture(t);
  const result = compareMeasurements(root, "before.json", "after.json");
  assert.equal(result.quality.status, "preserved");
  assert.equal(result.comparison.wallMilliseconds.delta, -10);
  assert.equal(result.cache.after.hitCount, 1);
  assert.equal(result.bottlenecks[0].owner, "persistent-process-lifecycle");
});

test("fails closed if a comparison changes the declared workload", async (t) => {
  const root = await fixture(t, { after: { benchmark: { id: "other", version: 1, digest: "a".repeat(64) } } });
  assert.throws(() => compareMeasurements(root, "before.json", "after.json"), /metrics_quality_invariants_changed/u);
});

test("rejects reports that only claim measurement without matching evidence", async (t) => {
  const root = await fixture(t, { after: { workflows: [] } });
  assert.throws(() => compareMeasurements(root, "before.json", "after.json"), /invalid_metrics_report/u);
});

test("rejects missing totals, malformed command metrics, and exact-parent paths", async (t) => {
  const missingTotalsRoot = await fixture(t, { after: { totals: {} } });
  assert.throws(() => compareMeasurements(missingTotalsRoot, "before.json", "after.json"), /invalid_metrics_report/u);

  const malformedCommandRoot = await fixture(t);
  const malformed = JSON.parse(await readFile(resolve(malformedCommandRoot, "after.json"), "utf8"));
  delete malformed.workflows[0].commands[0].elapsedMilliseconds;
  await writeFile(resolve(malformedCommandRoot, "after.json"), JSON.stringify(malformed));
  assert.throws(
    () => compareMeasurements(malformedCommandRoot, "before.json", "after.json"),
    /invalid_metrics_report/u
  );
  assert.throws(
    () => compareMeasurements(malformedCommandRoot, "..", "after.json"),
    /metrics_report_escapes_workspace/u
  );
});
