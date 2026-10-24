import assert from "node:assert/strict";
import test from "node:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  encodeRuntimeArtifact,
  decodeRuntimeArtifact
} from "../../apps/portal-e2e/src/e2e/skirmish-ai-runtime-artifact-codec.mjs";
import { readRuntimeResult } from "./skirmish-runtime-result.mjs";
import { summarizeReport } from "./summarize-skirmish-report.mjs";

const identity = { sourceRevision: "source", fixtureDigest: "fixture", dirtySourceDigest: null };

function groupedReport() {
  const variant = {
    variantId: "native",
    seed: 759101,
    repetition: 1,
    checkpoints: [{ tick: 12000, decisionSequence: 610, workerCount: 6 }],
    productionEvidence: null,
    productionCapture: { facts: [{ kind: "resources_applied", amounts: { food: 10 } }], gaps: ["authority_missing"] }
  };
  return {
    schemaVersion: 1,
    ...identity,
    status: "failed",
    scenarios: ["PRO-03", "PRO-06", "PRO-07"].map((scenarioId) => ({
      scenarioId,
      passed: false,
      failures: ["production_contract_missing"],
      variants: [variant]
    })),
    workCounts: { scenarios: 3, decisions: 610, ticks: 12000 }
  };
}

test("losslessly retains shared native facts, null authority, failures and physical work counts", () => {
  const report = groupedReport();
  const encoded = encodeRuntimeArtifact(report);
  assert.equal(encoded.artifactVariants.length, 1);
  assert.ok(JSON.stringify(encoded).length < JSON.stringify(report).length);
  const decoded = decodeRuntimeArtifact(JSON.parse(JSON.stringify(encoded)));
  assert.deepEqual(decoded, report);
  assert.equal(decoded.scenarios[0].variants[0], decoded.scenarios[2].variants[0]);
  assert.equal(summarizeReport(encoded), summarizeReport(report));
  const matrix = { status: "failed", runtime: report, workCounts: report.workCounts, rows: ["PRO-03"] };
  assert.deepEqual(decodeRuntimeArtifact(JSON.parse(JSON.stringify(encodeRuntimeArtifact(matrix)))), matrix);
});

test("does not collapse distinct runs with identical variant IDs or alter legacy inline reports", () => {
  const report = groupedReport();
  report.scenarios[1].variants = [{ ...report.scenarios[0].variants[0], seed: 759102 }];
  assert.equal(encodeRuntimeArtifact(report).artifactVariants.length, 2);
  const legacy = { ...report, scenarios: report.scenarios.slice(0, 1) };
  assert.equal(encodeRuntimeArtifact(legacy), legacy);
  assert.equal(decodeRuntimeArtifact(legacy), legacy);
});

test("rejects unknown encodings, missing tables, unused evidence and invalid references", () => {
  const encoded = encodeRuntimeArtifact(groupedReport());
  for (const mutation of [
    { artifactEncoding: "future" },
    { artifactVariants: null },
    { artifactVariants: [null] },
    { artifactVariants: [...encoded.artifactVariants, {}] }
  ])
    assert.throws(() => decodeRuntimeArtifact({ ...encoded, ...mutation }), /artifact_/);
  for (const index of [-1, 1, 0.5, "0", null, {}, Number.MAX_SAFE_INTEGER]) {
    const corrupted = structuredClone(encoded);
    corrupted.scenarios[0].variants = [index];
    assert.throws(() => decodeRuntimeArtifact(corrupted), /reference_invalid/);
  }
});

test("file reader reconstructs shared results and still rejects foreign provenance or damaged references", () => {
  const directory = mkdtempSync(join(tmpdir(), "runtime-codec-"));
  const path = join(directory, "runtime.json");
  try {
    const report = groupedReport();
    writeFileSync(path, JSON.stringify(encodeRuntimeArtifact(report)));
    assert.deepEqual(readRuntimeResult(path, identity), report);
    assert.throws(
      () => readRuntimeResult(path, { ...identity, sourceRevision: "foreign" }),
      /identity_or_shape_invalid/
    );
    const corrupted = JSON.parse(readFileSync(path, "utf8"));
    corrupted.scenarios[0].variants = [999];
    writeFileSync(path, JSON.stringify(corrupted));
    assert.throws(() => readRuntimeResult(path, identity), /artifact_malformed/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
