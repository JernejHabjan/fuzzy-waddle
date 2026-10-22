import { test as it, expect } from "@playwright/test";
import { nativeLateEpochReplayFailures } from "./skirmish-ai-native-late-epoch-evaluation";

type Proof = NonNullable<Parameters<typeof nativeLateEpochReplayFailures>[1]>;
const continuation: Proof["beforeContinuation"] = {
  owner: { tick: 79, activeMapScenes: 1, handlerCount: 1, controllerCount: 1, nativePlayerCount: 1,
    seed: 759940, matchId: "match:original", decisionSequence: 3 },
  worldDigest: "full-world", brainDigest: "original-brain", profileVersion: "profile-v1", profileDifficulty: "normal",
  archetypeId: "original-archetype", blackboardDigest: "original-blackboard", incomeSamplingDigest: "original-income",
  observationMemoryDigest: "original-observation-memory", reconciliationDigest: "original-pending-and-age",
  cadenceDigest: "original-cadence", elapsedMilliseconds: 950, recoveryDigest: "original-recovery", recoveryCount: 1,
  retryDebt: 3, oldestFailureTick: 2, reservationsDigest: "original-claims", reservationCount: 1,
  pendingOutcomeCount: 1, pendingCommandCount: 1, authorityDigest: "original-authority"
};
const original: NonNullable<Proof["retained"]["original"]> = { schemaVersion: 1, commandId: "3:0:1:match",
  commitmentKey: "original-work", source: "ai", authorityEpoch: 0, sequence: 1, effectId: "effect:original", intentId: "intent:original" };
const receipt: NonNullable<Proof["retained"]["originalReceipt"]> = { ...original, schemaVersion: 1, tick: 20, playerNumber: 3,
  kind: "applied", reason: "applied", actorIds: ["producer:original"], worldLinkIds: ["queue:original"] };
const retained: Proof["retained"] = { authorityEpoch: 0, original, originalReceipt: receipt, processedWatermark: 1,
  nextSequence: 2, applications: 1, active: true, outcomes: [], disposed: false, failure: null };
const before = { ...retained, authorityEpoch: 1 };
const proof: Proof = { order: "command_then_receipt", retained, before,
  after: { ...before, outcomes: [{ ...receipt, kind: "rejected", reason: "stale_authority_epoch" }] },
  beforeContinuation: continuation, afterContinuation: continuation,
  beforeEffectDigest: "physical-world", afterEffectDigest: "physical-world" };

it("requires original native identity, the real epoch fence and unchanged paid work/claim continuation", () => {
  expect(nativeLateEpochReplayFailures("command_then_receipt", proof)).toEqual([]);
  for (const candidate of [undefined, { ...proof, afterEffectDigest: "second-output-or-charge" },
    { ...proof, after: { ...proof.after, applications: 2 } }, { ...proof, after: { ...proof.after, nextSequence: 1 } },
    { ...proof, after: { ...proof.after, outcomes: [] } },
    { ...proof, retained: { ...retained, originalReceipt: null } },
    { ...proof, afterContinuation: { ...continuation, reconciliationDigest: "released-original-pending" } }])
    expect(nativeLateEpochReplayFailures("command_then_receipt", candidate).length).toBeGreaterThan(0);
  expect(nativeLateEpochReplayFailures("receipt_then_command", proof).length).toBeGreaterThan(0);
});
