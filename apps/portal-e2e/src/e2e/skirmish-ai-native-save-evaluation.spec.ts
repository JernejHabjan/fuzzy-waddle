import { nativeSaveProofFailures } from "./skirmish-ai-native-save-evaluation";
import type { NativeSaveProof } from "./skirmish-ai-native-save-proof";

const boundary = (tick: number): NativeSaveProof["saved"] => ({
  owner: { tick, activeMapScenes: 1, handlerCount: 1, controllerCount: 1, nativePlayerCount: 1,
    seed: 759940, matchId: "match:original", decisionSequence: tick === 19 ? 0 : 20 },
  worldDigest: "full-shared-queue-and-world", brainDigest: "full-brain", profileVersion: "profile-v1", profileDifficulty: 1,
  archetypeId: "opening:original", blackboardDigest: "original-blackboard", incomeSamplingDigest: "original-income",
  observationMemoryDigest: "original-observation-memory",
  cadenceDigest: "real-cadence", elapsedMilliseconds: 950, recoveryDigest: "original-recovery", recoveryCount: 1,
  retryDebt: 3, oldestFailureTick: 2, reservationsDigest: "original-claims", reservationCount: 1,
  pendingOutcomeCount: 1, pendingCommandCount: 1, authorityDigest: "original-authority"
});
const base: NativeSaveProof = { branch: "before_apply", sourceRevision: "a".repeat(40), fixtureDigest: "fixture:actual",
  sameRealm: true, saveId: "quicksave:original", saveRevision: 1, resumedSimulationTimeScale: 1,
  saved: boundary(19), restored: boundary(19), control: boundary(401), resumed: boundary(401),
  premises: { tick: 19, paidTrainingItems: 0, paidResearchItems: 0, unfinishedOriginalSite: false,
    heldAppliedReceipts: 0, captureDropped: false, captureGaps: [] },
  controlTraceCount: 20, resumedTraceCount: 20, controlTraceDigest: "actual-trace", resumedTraceDigest: "actual-trace",
  traceOverflow: false, firstTraceDifference: null };

it("requires a real same-realm restore, one native owner and full queue/brain/cadence continuation", () => {
  expect(nativeSaveProofFailures("before_apply", base)).toEqual([]);
  for (const proof of [undefined, { ...base, sameRealm: false }, { ...base, traceOverflow: true },
    { ...base, resumedTraceCount: 0 }, { ...base, resumedTraceDigest: "different-decision" },
    { ...base, restored: { ...base.restored, worldDigest: "legacy-only-hash" } },
    { ...base, restored: { ...base.restored, cadenceDigest: "restarted-cadence" } },
    { ...base, resumed: { ...base.resumed, recoveryDigest: "reset-age" } },
    { ...base, restored: { ...base.restored, owner: { ...base.restored.owner, controllerCount: 2 } } },
    { ...base, premises: { ...base.premises, captureDropped: true } }])
    expect(nativeSaveProofFailures("before_apply", proof).length).toBeGreaterThan(0);
});

it("rejects a declared lifecycle branch without its actual original paid work or chronic failure", () => {
  for (const [branch, tick] of [["applied_pending", 199], ["during_active", 119], ["pause_speed", 599]] as const) {
    const proof = { ...base, branch, saved: boundary(tick), restored: boundary(tick),
      premises: { ...base.premises, tick } };
    expect(nativeSaveProofFailures(branch, proof).length).toBeGreaterThan(0);
  }
});
