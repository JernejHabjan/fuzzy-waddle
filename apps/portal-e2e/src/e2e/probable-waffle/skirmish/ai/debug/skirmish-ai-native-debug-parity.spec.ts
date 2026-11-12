import { test as it, expect } from "@playwright/test";
import { nativeDebugParityProofFailures } from "./skirmish-ai-native-debug-parity-evaluation";
import type { NativeDebugParityProof } from "./skirmish-ai-native-debug-parity-proof";

const proof: NativeDebugParityProof = {
  beforeDigest: "world:actual", afterDigest: "world:actual", accepted: 9, repeated: "episode_already_captured", rejected: true,
  history: { count: 256, firstSequence: 145, lastSequence: 400, missingThroughTick: 1440 },
  peak: { sessionBytes: 16000, quotaBytes: 16384, retainedBytes: 8000, retainedCount: 5, episodeCount: 9,
    disposed: false, listenerDetached: true, captureReleased: false },
  shutdown: { sessionBytes: 0, quotaBytes: 16384, retainedBytes: 0, retainedCount: 0, episodeCount: 0,
    disposed: true, listenerDetached: true, captureReleased: true }
};

it("DBG-06 refuses replenished quota, hidden truncation, changed world and leaked scene ownership", () => {
  expect(nativeDebugParityProofFailures(proof)).toEqual([]);
  for (const changed of [
    { ...proof, afterDigest: "world:changed" }, { ...proof, rejected: false },
    { ...proof, peak: { ...proof.peak, sessionBytes: 16385 } },
    { ...proof, peak: { ...proof.peak, episodeCount: 5 } },
    { ...proof, history: { ...proof.history, missingThroughTick: 0 } },
    { ...proof, shutdown: { ...proof.shutdown, captureReleased: false } }
  ]) expect(nativeDebugParityProofFailures(changed).length).toBeGreaterThan(0);
});

it("rejects absent, fractional and nonfinite quota/history/shutdown counters", () => {
  for (const invalid of [undefined, Number.NaN, Infinity, -1, 0.5]) {
    for (const key of ["sessionBytes", "retainedBytes", "retainedCount", "episodeCount", "quotaBytes"] as const) {
      for (const boundary of ["peak", "shutdown"] as const) {
        const changed = { ...proof, [boundary]: { ...proof[boundary], [key]: invalid } } as NativeDebugParityProof;
        expect(nativeDebugParityProofFailures(changed).length).toBeGreaterThan(0);
      }
    }
    for (const key of ["count", "firstSequence", "lastSequence", "missingThroughTick"] as const) {
      const changed = { ...proof, history: { ...proof.history, [key]: invalid } } as NativeDebugParityProof;
      expect(nativeDebugParityProofFailures(changed).length).toBeGreaterThan(0);
    }
    const changed = { ...proof, accepted: invalid, peak: { ...proof.peak, episodeCount: invalid } } as NativeDebugParityProof;
    expect(nativeDebugParityProofFailures(changed).length).toBeGreaterThan(0);
  }
});
