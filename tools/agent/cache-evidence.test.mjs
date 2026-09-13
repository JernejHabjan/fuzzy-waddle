import assert from "node:assert/strict";
import test from "node:test";
import { inspectCacheEvidence } from "./cache-evidence.mjs";

test("reports only explicit cache hits and misses", () => {
  assert.deepEqual(inspectCacheEvidence("Nx read from cache\ncache miss"), {
    status: "mixed",
    hitCount: 1,
    missCount: 1,
    mentionCount: 2
  });
  assert.deepEqual(inspectCacheEvidence("cache directory initialized"), {
    status: "not_reported",
    hitCount: 0,
    missCount: 0,
    mentionCount: 1
  });
});

test("rejects non-text cache output", () => {
  assert.throws(() => inspectCacheEvidence(null), /invalid_cache_output/u);
});
