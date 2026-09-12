import assert from "node:assert/strict";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import test from "node:test";
import { measureBenchmark, parseArguments, validateBenchmark } from "./measure-workflows.mjs";

async function fixture(t) {
  const root = await mkdtemp(resolve(tmpdir(), "fuzzy-agent-benchmark-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(resolve(root, "source"), { recursive: true });
  await writeFile(resolve(root, "source/example.ts"), "export const value = 1;\n");
  return root;
}

function benchmark(expectedOutcome = "passed") {
  return {
    schemaVersion: 1,
    id: "sample",
    version: 1,
    qualityInvariants: [{ id: "fail-closed", requirement: "mismatch is visible" }],
    tokenTelemetry: { status: "unavailable" },
    workflows: [
      {
        id: "workflow",
        description: "sample",
        contextFiles: ["source/example.ts"],
        requiredSelections: { projects: ["sample"], tests: ["example"] },
        commands: [{ executable: "sample", arguments: ["run"], expectedOutcome, outputIncludes: ["evidence"] }],
        declaredStarts: { server: 0, browser: 0, worker: 0 }
      }
    ]
  };
}

test("measures context, bounded output proxies, and matching command outcomes", async (t) => {
  const root = await fixture(t);
  let tick = 0n;
  const report = measureBenchmark({
    root,
    benchmark: benchmark(),
    now: () => (tick += 1_000_000n),
    execute: () => ({ status: 0, stdout: "evidence cache", stderr: "" })
  });
  assert.equal(report.status, "measured");
  assert.equal(report.workflows[0].context.files[0].path, "source/example.ts");
  assert.equal(report.workflows[0].commands[0].elapsedMilliseconds, 1);
  assert.equal(report.totals.directProcessStarts, 1);
  assert.equal(report.totals.cacheTextIndicators, 1);
  assert.equal(report.totals.cacheHitCount, 0);
  assert.equal(report.workflows[0].commands[0].output.cache.status, "not_reported");
  assert.equal(report.tokenTelemetry.status, "unavailable");
});

test("fails closed when command outcome or required evidence drifts", async (t) => {
  const root = await fixture(t);
  const report = measureBenchmark({
    root,
    benchmark: benchmark(),
    execute: () => ({ status: 0, stdout: "different", stderr: "" })
  });
  assert.equal(report.status, "failed");
  assert.equal(report.workflows[0].matchesExpectedOutcome, false);
});

test("records unavailable tools only when that explicit baseline outcome is declared", async (t) => {
  const root = await fixture(t);
  const unavailableBenchmark = benchmark("unavailable");
  unavailableBenchmark.workflows[0].commands[0].outputIncludes = [];
  const report = measureBenchmark({
    root,
    benchmark: unavailableBenchmark,
    execute: () => ({ status: null, stdout: "", stderr: "", errorCode: "ENOENT" })
  });
  assert.equal(report.status, "measured");
  assert.equal(report.workflows[0].commands[0].outcome, "unavailable");
});

test("rejects malformed benchmark declarations and arguments", () => {
  const invalid = benchmark();
  invalid.workflows[0].id = "";
  assert.throws(() => validateBenchmark(invalid), /invalid_workflow_id/u);
  assert.throws(() => parseArguments(["--workflow"]), /missing_workflow/u);
  assert.deepEqual(parseArguments(["--", "--workflow", "workflow"]), { workflowIds: ["workflow"] });
});
