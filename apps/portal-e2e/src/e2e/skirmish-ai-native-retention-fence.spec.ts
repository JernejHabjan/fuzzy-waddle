import { test as it, expect } from "@playwright/test";
import { nativeRetentionFenceFailures } from "./skirmish-ai-native-retention-fence";
import type { GameCommandExecution } from "@fuzzy-waddle/probable-waffle-protocol";

const original: GameCommandExecution = { schemaVersion: 1, commandId: "2:0:3:match", commitmentKey: "original-paid-work",
  source: "ai", authorityEpoch: 0, sequence: 3, intentId: "intent:original", effectId: "effect:original" };
const before: Parameters<typeof nativeRetentionFenceFailures>[1] = { replayAttempted: false, replayApplications: 0,
  processedCount: 2048, detailedOriginalPresent: false, authorityEpoch: 0, processedWatermark: 3,
  activeOriginal: true, activeExecution: original, rejection: null, authorityGameplayDigest: "original-authority-without-history" };
const after: typeof before = { ...before, replayAttempted: true, rejection: { commandId: original.commandId,
  authorityEpoch: 0, sequence: 3, reason: "duplicate_command", detail: "sequence_watermark" } };

it("requires actual eviction, retained unresolved ownership and the original sequence-watermark rejection", () => {
  expect(nativeRetentionFenceFailures(original, before, after)).toEqual([]);
  for (const candidate of [{ ...after, replayAttempted: false }, { ...after, replayApplications: 1 },
    { ...after, detailedOriginalPresent: true }, { ...after, processedCount: 2047 },
    { ...after, processedWatermark: 2 }, { ...after, activeOriginal: false }, { ...after, activeExecution: null },
    { ...after, activeExecution: { ...original, effectId: "effect:different" } },
    { ...after, rejection: { ...after.rejection!, detail: "retained-map-only" } },
    { ...after, authorityGameplayDigest: "changed-paid-work" }])
    expect(nativeRetentionFenceFailures(original, before, candidate).length).toBeGreaterThan(0);
});
