import assert from "node:assert/strict";
import { mkdtempSync, rmSync, truncateSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createRuntimeResultPath, MAX_RUNTIME_RESULT_BYTES, readRuntimeResult } from "./skirmish-runtime-result.mjs";

const identity = { sourceRevision: "source", fixtureDigest: "fixture", dirtySourceDigest: null };
const report = {
  schemaVersion: 1,
  ...identity,
  status: "failed",
  scenarios: [],
  workCounts: { scenarios: 1, decisions: 16, ticks: 300 }
};

function fixture(run) {
  const directory = mkdtempSync(join(tmpdir(), "skirmish-result-test-"));
  try {
    run(createRuntimeResultPath(directory), directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

test("retains failed native evidence larger than the 32 MiB subprocess buffer", () =>
  fixture((path) => {
    const raw = { ...report, raw: "x".repeat(33 * 1024 * 1024) };
    writeFileSync(path, JSON.stringify(raw));
    assert.deepEqual(readRuntimeResult(path, identity), raw);
  }));

test("missing output stays unavailable and each attempt owns a fresh path", () =>
  fixture((path, directory) => {
    assert.equal(readRuntimeResult(path, identity), null);
    assert.notEqual(createRuntimeResultPath(directory), path);
  }));

test("rejects foreign provenance, malformed output and invalid counters", () =>
  fixture((path) => {
    for (const mutation of [
      { sourceRevision: "other" },
      { fixtureDigest: "other" },
      { dirtySourceDigest: "other" },
      { schemaVersion: 2 },
      { status: "unknown" },
      { scenarios: null },
      { workCounts: { scenarios: 1, decisions: -1, ticks: 300 } }
    ]) {
      writeFileSync(path, JSON.stringify({ ...report, ...mutation }));
      assert.throws(() => readRuntimeResult(path, identity), /identity_or_shape_invalid/);
    }
    writeFileSync(path, "{");
    assert.throws(() => readRuntimeResult(path, identity), /artifact_malformed/);
  }));

test("checks the byte ceiling before loading an oversized artifact", () =>
  fixture((path) => {
    writeFileSync(path, "{}");
    truncateSync(path, MAX_RUNTIME_RESULT_BYTES + 1);
    assert.throws(() => readRuntimeResult(path, identity), /artifact_oversized/);
  }));
