import { existsSync, mkdirSync, mkdtempSync, readFileSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { decodeRuntimeArtifact } from "../../apps/portal-e2e/src/e2e/skirmish-ai-runtime-artifact-codec.mjs";

// One complete native placement result is ~388 MiB; retain a hard ceiling while allowing that bounded evidence.
export const MAX_RUNTIME_RESULT_BYTES = 512 * 1024 * 1024;

/** Allocates a unique retained result path. A failed process cannot reuse another run's payload. */
export function createRuntimeResultPath(workspaceRoot, resultsDirectory = join(workspaceRoot, "tmp/ai-skirmish-runtime-results")) {
  const directory = resolve(resultsDirectory);
  mkdirSync(directory, { recursive: true });
  return join(mkdtempSync(join(directory, "run-")), "runtime.json");
}

/** Missing output is infrastructure failure; malformed, oversized or foreign output never supplies runtime evidence. */
export function readRuntimeResult(path, identity, options = {}) {
  if (!existsSync(path)) return null;
  if (statSync(path).size > MAX_RUNTIME_RESULT_BYTES) throw new Error("runtime_result_artifact_oversized");
  let report;
  try {
    report = decodeRuntimeArtifact(JSON.parse(readFileSync(path, "utf8")), path, options);
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
  if (report.artifactEncoding === "external-runtime-variants-v1" && !Object.hasOwn(report, "__artifactSourcePath"))
    Object.defineProperty(report, "__artifactSourcePath", { value: path });
  return report;
}
