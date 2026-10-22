import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { createRuntimeResultPath, readRuntimeResult } from "./skirmish-runtime-result.mjs";
import { readHead, readJson, readWorkingTreeSource } from "./skirmish-matrix-io.mjs";

/** D-06 owns a frozen multi-source workload, so it cannot pass through the ordinary per-variant command-count driver. */
export function invokeCalibrationHarness(input, context) {
  if (input.diagnosticSelection || input.rows.length !== 1 || input.rows[0].id !== "D-06" || readWorkingTreeSource().length)
    throw new Error("calibration_requires_clean_complete_workload");
  const { workspaceRoot, fixtureDirectory } = context, sourceRevision = input.candidate ?? readHead();
  const row = input.rows[0], fixturePath = join(fixtureDirectory, row.fixture), fixture = readJson(fixturePath, 1024 * 1024);
  const fixtureDigest = `sha256:${createHash("sha256").update(JSON.stringify([{ row, fixture }])).digest("hex")}`;
  const specification = readJson(join(fixtureDirectory, "difficulty-calibration-v1.json"), 256 * 1024);
  const resultPath = createRuntimeResultPath(workspaceRoot);
  const command = spawnSync(process.execPath, [join(workspaceRoot, "tools/ai/run-difficulty-calibration.mjs"),
    `--candidate=${sourceRevision}`, `--baseline=${specification.baseline.sourceRevision}`, `--fixture=${fixturePath}`,
    `--manifest=${join(fixtureDirectory, "skirmish-v1.json")}`, `--fixture-digest=${fixtureDigest}`, `--output=${resultPath}`],
  { cwd: workspaceRoot, encoding: "utf8", maxBuffer: 64 * 1024 });
  if (command.error) throw command.error;
  const runtime = readRuntimeResult(resultPath, { sourceRevision, fixtureDigest, dirtySourceDigest: null });
  const passed = command.status === 0 && runtime?.status === "passed" && runtime.workCounts.decisions > 0 && runtime.workCounts.ticks > 0;
  if (!passed) process.exitCode = 1;
  return { schemaVersion: 1, status: passed ? "passed" : "failed", suite: input.suite, rows: ["D-06"],
    candidate: sourceRevision, baseline: specification.baseline.sourceRevision, fixtureDigest,
    workCounts: { scenarios: 1, testSuites: 1, tests: runtime ? 1 : 0,
      decisions: runtime?.workCounts.decisions ?? 0, ticks: runtime?.workCounts.ticks ?? 0 }, runtime,
    execution: { resultArtifact: resultPath, processStarts: 1 }, process: { exitCode: command.status, signal: command.signal } };
}
