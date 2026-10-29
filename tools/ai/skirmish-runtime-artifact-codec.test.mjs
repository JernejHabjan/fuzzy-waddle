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

test("large variant sets are externalized into bounded files and reconstructed by the result reader", () => {
  const directory = mkdtempSync(join(tmpdir(), "runtime-external-codec-"));
  const path = join(directory, "runtime.json");
  try {
    const report = groupedReport();
    report.scenarios = [
      {
        ...report.scenarios[0],
        variants: Array.from({ length: 6 }, (_, repetition) => ({
          ...report.scenarios[0].variants[0],
          repetition: repetition + 1,
          productionCapture: { facts: [{ kind: "resources_applied", amounts: { food: repetition + 1 } }], gaps: [] }
        }))
      }
    ];
    const encoded = encodeRuntimeArtifact(report, path);
    assert.equal(encoded.artifactEncoding, "external-runtime-variants-v1");
    assert.equal(encoded.artifactVariantFiles.length, 6);
    writeFileSync(path, JSON.stringify(encoded));
    assert.deepEqual(readRuntimeResult(path, identity), report);
    assert.match(summarizeReport(JSON.parse(readFileSync(path, "utf8")), { path }), /VARIANT native/);
    const lazy = readRuntimeResult(path, identity, { expandExternalVariants: false });
    const matrixPath = join(directory, "matrix.json");
    const matrix = { schemaVersion: 1, status: "failed", rows: ["PRO-03"], runtime: lazy,
      workCounts: report.workCounts, process: { exitCode: 1 } };
    writeFileSync(matrixPath, JSON.stringify(encodeRuntimeArtifact(matrix, matrixPath)));
    assert.deepEqual(decodeRuntimeArtifact(JSON.parse(readFileSync(matrixPath, "utf8")), matrixPath).runtime, report);
    const corrupt = structuredClone(encoded);
    corrupt.scenarios[0].variants[0] = 99;
    assert.throws(() => decodeRuntimeArtifact(corrupt, path), /external_reference_invalid/);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("streams an oversized single native variant to external storage", () => {
  const directory = mkdtempSync(join(tmpdir(), "runtime-large-variant-codec-"));
  const path = join(directory, "runtime.json");
  try {
    const report = groupedReport();
    report.scenarios = [report.scenarios[0]];
    report.scenarios[0].variants[0].checkpoints[0].gameResult = "defeat";
    report.scenarios[0].variants[0].checkpoints[0].scoreMetrics = { damage_dealt: 17 };
    const largeEvidence = `${"x".repeat(16_383)}😀${"y".repeat(9 * 1024 * 1024)}`;
    report.scenarios[0].variants[0].largeEvidence = largeEvidence;

    const encoded = encodeRuntimeArtifact(report, path);
    assert.equal(encoded.artifactEncoding, "external-runtime-variants-v1");
    assert.equal(encoded.artifactVariantFiles.length, 1);
    assert.equal(encoded.artifactVariantSummaries[0].checkpoints[0].gameResult, "defeat");
    writeFileSync(path, JSON.stringify(encoded));
    assert.match(summarizeReport(JSON.parse(readFileSync(path, "utf8")), { path }), /result=defeat/);
    const decoded = readRuntimeResult(path, identity);
    assert.equal(decoded.scenarios[0].variants[0].largeEvidence, largeEvidence);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});
