import assert from "node:assert/strict";
import { mkdtempSync, rmSync, truncateSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { MAX_RUNTIME_REQUEST_BYTES, readRuntimeRequestText, writeRuntimeRequest } from
  "../../apps/portal-e2e/src/e2e/skirmish-ai-runtime-request-transport.mjs";

test("a grouped request exceeds the environment limit but roundtrips through exact frozen file bytes", () => {
  const directory = mkdtempSync(join(tmpdir(), "skirmish-request-"));
  try {
    const path = join(directory, "request.json"), request = { fixtures: "x".repeat(256 * 1024) };
    const digest = writeRuntimeRequest(path, request);
    const environment = { AI_SKIRMISH_RUNTIME_REQUEST_PATH: path, AI_SKIRMISH_RUNTIME_REQUEST_SHA256: digest };
    assert.deepEqual(JSON.parse(readRuntimeRequestText(environment)), request);
    assert.throws(() => writeRuntimeRequest(path, request), /EEXIST/);
    assert.throws(() => readRuntimeRequestText({ ...environment, AI_SKIRMISH_RUNTIME_REQUEST: "{}" }), /ambiguous/);
    assert.throws(() => readRuntimeRequestText({ ...environment, AI_SKIRMISH_RUNTIME_REQUEST_SHA256: "" }), /digest_missing/);
    writeFileSync(path, "{}");
    assert.throws(() => readRuntimeRequestText(environment), /digest_mismatch/);
    truncateSync(path, MAX_RUNTIME_REQUEST_BYTES + 1);
    assert.throws(() => readRuntimeRequestText(environment), /oversized/);
    assert.throws(() => writeRuntimeRequest(join(directory, "large.json"), { data: "x".repeat(MAX_RUNTIME_REQUEST_BYTES) }), /oversized/);
  } finally { rmSync(directory, { recursive: true, force: true }); }
});

test("small inline compatibility and absent requests remain explicit", () => {
  assert.equal(readRuntimeRequestText({}), undefined);
  assert.equal(readRuntimeRequestText({ AI_SKIRMISH_RUNTIME_REQUEST: "{}" }), "{}");
});
