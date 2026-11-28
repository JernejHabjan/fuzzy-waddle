import assert from "node:assert/strict";
import test from "node:test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { selectedMatrixIds, summarizeMatrixRun } from "../skirmish-matrix-summary.ts";
import { workspaceRoot } from "../../shared/workspace-paths.ts";

test("setup failure retains the full catalog denominator and does not invent scenario failures", () => {
  const rows = Array.from({ length: 120 }, (_, i) => ({ id: `CASE-${i}`, stages: [1] }));
  const report = {
    rows: selectedMatrixIds({ rows }, { suite: "release" }),
    status: "failed",
    reason: "candidate_source_is_dirty",
    workCounts: { decisions: 0, ticks: 0 }
  };
  const text = summarizeMatrixRun(report).join("\n");
  assert.match(text, /0\/120 executed; 0 passed; 0 failed; 120 not run/);
  assert.match(text, /AI scenarios did not start/);
  assert.match(text, /git status --short/);
  assert.deepEqual(selectedMatrixIds({ rows }, { scenarios: "CASE-1,CASE-2" }), ["CASE-1", "CASE-2"]);
  assert.equal(selectedMatrixIds({ rows }, { suite: "stage-smoke", stage: "1" }).length, 120);
  assert.deepEqual(selectedMatrixIds({}, { suite: "release" }), []);
});

test("runtime summary distinguishes passing, failing and missing scenarios", () => {
  const report = {
    status: "failed",
    rows: ["A", "B", "C"],
    workCounts: { decisions: 4, ticks: 10 },
    runtime: {
      scenarios: [
        { scenarioId: "A", passed: true, variants: [{ variantId: "a" }] },
        { scenarioId: "B", passed: false, failures: ["predicate"], variants: [{ variantId: "b" }] }
      ]
    }
  };
  assert.match(summarizeMatrixRun(report).join("\n"), /2\/3 executed; 1 passed; 1 failed; 1 not run/);
  assert.match(summarizeMatrixRun({ ...report, process: { exitCode: 1 } }).join("\n"), /0 passed; 2 failed/);
});

test("combined report separates pure evidence, runtime results and missing baseline comparisons", () => {
  const text = summarizeMatrixRun({
    status: "blocked",
    rows: ["A", "B"],
    reason: "baseline_runtime_adapter_not_implemented",
    pure: {
      rows: ["A", "B"],
      pureScenarioEvidence: {
        executed: [
          { scenarioId: "A", passedTestCount: 2, bindingsComplete: true },
          { scenarioId: "B", passedTestCount: 1, bindingsComplete: false }
        ]
      }
    },
    runtime: {
      rows: ["A"],
      status: "passed",
      workCounts: { decisions: 1, ticks: 1 },
      runtime: { scenarios: [{ scenarioId: "A", passed: true, variants: [{ variantId: "a" }] }] }
    },
    unexecutedBaselineRuntime: ["A"]
  }).join("\n");
  assert.match(text, /AI matrix: blocked; 2 catalog entries/);
  assert.match(text, /AI pure coverage: 1\/2 proven; 1 unproven/);
  assert.match(text, /AI runtime scenarios: 1\/1 executed; 1 passed; 0 failed; 0 not run/);
  assert.match(text, /baseline runtime comparisons not run: 1/);
});

test("CLI setup failure prints selected totals and persists them without launching matches", () => {
  const directory = mkdtempSync(join(tmpdir(), "fuzzy-matrix-summary-"));
  try {
    const result = spawnSync(
      process.execPath,
      [
        "tools/probable-waffle/skirmish/ai/cli/run-skirmish-matrix.ts",
        "--suite",
        "release",
        "--candidate",
        "invalid",
        "--output",
        directory
      ],
      { cwd: workspaceRoot, encoding: "utf8" }
    );
    const manifest = JSON.parse(
      readFileSync(
        join(workspaceRoot, "tools/probable-waffle/skirmish/ai/testing/fixtures/skirmish-scenario-manifest.json"),
        "utf8"
      )
    );
    assert.equal(result.status, 1);
    assert.match(result.stdout, new RegExp(`0/${manifest.rows.length} executed; 0 passed; 0 failed`));
    const indexName = readdirSync(join(directory, "indexes"))[0];
    const index = JSON.parse(readFileSync(join(directory, "indexes", indexName), "utf8"));
    assert.equal(index.totals.expected, manifest.rows.length);
    assert.equal(index.totals.unexecuted, manifest.rows.length);
    assert.equal(index.reason, "invalid_candidate_sha");
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
