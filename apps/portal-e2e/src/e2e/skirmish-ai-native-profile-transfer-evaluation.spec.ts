import { test as it, expect } from "@playwright/test";
import { nativeProfileTransferFailures } from "./skirmish-ai-native-profile-transfer-evaluation";
import type { runNativeProfileTransfer } from "./skirmish-ai-native-profile-transfer";

type Proof = Awaited<ReturnType<typeof runNativeProfileTransfer>>;
const boundary: Proof["original"] = {
  owner: { tick: 79, activeMapScenes: 1, handlerCount: 1, controllerCount: 1, nativePlayerCount: 1,
    seed: 759940, matchId: "match:original", decisionSequence: 3 },
  worldDigest: "full-native-world", brainDigest: "original-brain", profileVersion: "skirmish-ai-v1", profileDifficulty: "normal",
  archetypeId: "original-archetype", blackboardDigest: "original-blackboard", incomeSamplingDigest: "original-income",
  observationMemoryDigest: "original-observation-memory", cadenceDigest: "original-cadence", elapsedMilliseconds: 950,
  reconciliationDigest: "original-reconciliation",
  recoveryDigest: "original-recovery", recoveryCount: 1, retryDebt: 3, oldestFailureTick: 2,
  reservationsDigest: "original-claims", reservationCount: 1, pendingOutcomeCount: 1, pendingCommandCount: 1,
  authorityDigest: "original-authority"
};
const proof: Proof = { humanClients: 2, disconnected: true, sourceTick: 79, snapshotTick: 79,
  snapshotBrainDigest: boundary.brainDigest, snapshotCadenceDigest: boundary.cadenceDigest,
  original: boundary, promoted: boundary, next: { ...boundary, owner: { ...boundary.owner, tick: 80, decisionSequence: 4 } },
  originalEpoch: 0, promotedEpoch: 1, nextDecision: { tick: 80, sequence: 4 }, aiErrors: [] };

it("rejects fresh controllers, stale reconnect state, profile fallback and reset decision cadence", () => {
  expect(nativeProfileTransferFailures("Normal", proof)).toEqual([]);
  for (const candidate of [undefined, { ...proof, disconnected: false }, { ...proof, snapshotTick: 60 },
    { ...proof, promotedEpoch: 0 }, { ...proof, snapshotBrainDigest: "old-checkpoint" },
    { ...proof, promoted: { ...boundary, brainDigest: "fresh-opening" } },
    { ...proof, promoted: { ...boundary, cadenceDigest: "fresh-timer" } },
    { ...proof, nextDecision: { tick: 100, sequence: 4 } },
    { ...proof, nextDecision: { tick: 80, sequence: 1 } }, { ...proof, aiErrors: ["native-planner-error"] }])
    expect(nativeProfileTransferFailures("Normal", candidate).length).toBeGreaterThan(0);
  expect(nativeProfileTransferFailures("Hard", proof).length).toBeGreaterThan(0);
});
