import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

// Raw bounded captures can exceed the subprocess log buffer. Read their artifact separately, with a byte ceiling.
export const MAX_RUNTIME_RESULT_BYTES = 256 * 1024 * 1024;

/** Allocates a unique retained result path. A failed process cannot reuse another run's payload. */
export function createRuntimeResultPath(workspaceRoot) {
  const directory = join(workspaceRoot, "tmp/ai-skirmish-runtime-results");
  mkdirSync(directory, { recursive: true });
  return join(mkdtempSync(join(directory, "run-")), "runtime.json");
}

/** Missing output is infrastructure failure; malformed, oversized or foreign output never supplies runtime evidence. */
export function readRuntimeResult(path, identity) {
  if (!existsSync(path)) return null;
  if (statSync(path).size > MAX_RUNTIME_RESULT_BYTES) throw new Error("runtime_result_artifact_oversized");
  let report;
  try {
    report = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error("runtime_result_artifact_malformed");
  }
  if (
    !report ||
    report.schemaVersion !== 1 ||
    report.sourceRevision !== identity.sourceRevision ||
    report.fixtureDigest !== identity.fixtureDigest ||
    report.dirtySourceDigest !== identity.dirtySourceDigest ||
    !["passed", "failed", "diagnostic_passed", "diagnostic_failed"].includes(report.status) ||
    !Array.isArray(report.scenarios) ||
    !report.workCounts ||
    ["scenarios", "decisions", "ticks"].some(
      (key) => !Number.isSafeInteger(report.workCounts[key]) || report.workCounts[key] < 0
    )
  ) {
    throw new Error("runtime_result_artifact_identity_or_shape_invalid");
  }
  return report;
}
