import { test as it, expect } from "@playwright/test";
import { nativeLifecycleProofFailures } from "./skirmish-ai-native-lifecycle-evaluation";
import type { NativeLifecycleProof } from "./skirmish-ai-native-lifecycle-proof";

const owner = { activeMapScenes: 1, handlerCount: 1, controllerCount: 1, nativePlayerCount: 1,
  tick: 200, seed: 1, matchId: "original", decisionSequence: 4 };
const proof: NativeLifecycleProof = { branch: "normal", sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:01234567",
  original: owner, nextInitial: { ...owner, tick: 0, seed: 2, matchId: "next", decisionSequence: 0 },
  nextActive: { ...owner, seed: 2, matchId: "next" }, nativeBeforeLateWork: "actual-world", nativeAfterLateWork: "actual-world",
  nextAiErrors: [], retained: { oldSceneInactive: true, oldTickObservers: 0, originalPaidCommandId: null,
    completionResults: [], pathWasPending: false, pathCancelled: false, sameRealm: true } };

it("requires original ownership, genuine same-realm delivery and continued new-match decisions", () => {
  expect(nativeLifecycleProofFailures("normal", proof)).toEqual([]);
  for (const changed of [undefined, { ...proof, nativeAfterLateWork: "changed" },
    { ...proof, nextInitial: { ...proof.nextInitial, matchId: "original" } },
    { ...proof, nextActive: { ...proof.nextActive, controllerCount: 2 } },
    { ...proof, nextActive: { ...proof.nextActive, decisionSequence: 0 } },
    { ...proof, retained: { ...proof.retained, oldTickObservers: 1 } },
    { ...proof, retained: { ...proof.retained, sameRealm: false } },
    { ...proof, retained: { ...proof.retained, oldSceneInactive: false } },
    { ...proof, nextAiErrors: ["late controller error"] }])
    expect(nativeLifecycleProofFailures("normal", changed).length).toBeGreaterThan(0);
});

it("rejects generic normal-disposal evidence for path, paid-work or real host replacement", () => {
  for (const branch of ["pending_path", "paid_queue", "host_replacement"])
    expect(nativeLifecycleProofFailures(branch, { ...proof, branch }).length).toBeGreaterThan(0);
  expect(nativeLifecycleProofFailures("paid_queue", { ...proof, branch: "paid_queue", retained: {
    ...proof.retained, originalPaidCommandId: "actual-paid-original", completionResults: [null, null] } })).toEqual([]);
  expect(nativeLifecycleProofFailures("pending_path", { ...proof, branch: "pending_path", retained: {
    ...proof.retained, pathWasPending: true, pathCancelled: true } })).toEqual([]);
  expect(nativeLifecycleProofFailures("host_replacement", { ...proof, branch: "host_replacement", originalEpoch: 1,
    promotedEpoch: 2, retainedAuthorityUnchanged: true })).toEqual([]);
});
