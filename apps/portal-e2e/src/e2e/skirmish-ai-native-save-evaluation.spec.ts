import { test as it, expect } from "@playwright/test";
import { nativeSaveProofFailures } from "./skirmish-ai-native-save-evaluation";
import type { NativeSaveProof } from "./skirmish-ai-native-save-proof";
import {
  nativeDebugProjectionDifferencePaths,
  nativeDebugProjectionDifferences
} from "./skirmish-ai-native-world-projection-diff";

const boundary = (tick: number): NativeSaveProof["saved"] => ({
  owner: {
    tick,
    activeMapScenes: 1,
    handlerCount: 1,
    controllerCount: 1,
    nativePlayerCount: 1,
    seed: 759940,
    matchId: "match:original",
    decisionSequence: tick === 19 ? 0 : 20
  },
  worldDigest: "full-shared-queue-and-world",
  brainDigest: "full-brain",
  profileVersion: "profile-v1",
  profileDifficulty: "normal",
  archetypeId: "opening:original",
  blackboardDigest: "original-blackboard",
  incomeSamplingDigest: "original-income",
  observationMemoryDigest: "original-observation-memory",
  reconciliationDigest: "original-reconciliation",
  cadenceDigest: "real-cadence",
  elapsedMilliseconds: 950,
  recoveryDigest: "original-recovery",
  recoveryCount: 1,
  retryDebt: 3,
  oldestFailureTick: 2,
  reservationsDigest: "original-claims",
  reservationCount: 1,
  pendingOutcomeCount: 1,
  pendingCommandCount: 1,
  authorityDigest: "original-authority"
});
const base: NativeSaveProof = {
  branch: "before_apply",
  sourceRevision: "a".repeat(40),
  fixtureDigest: "fixture:actual",
  sameRealm: true,
  saveId: "quicksave:original",
  saveRevision: 1,
  resumedSimulationTimeScale: 1,
  saved: boundary(19),
  restored: boundary(19),
  control: boundary(401),
  resumed: boundary(401),
  premises: {
    tick: 19,
    paidTrainingItems: 0,
    paidResearchItems: 0,
    paidTrainingProvenance: false,
    paidResearchProvenance: false,
    paidConstructionProvenance: false,
    postChargeResourceReset: true,
    unfinishedOriginalSite: false,
    heldAppliedReceipts: 0,
    captureDropped: false,
    captureGaps: []
  },
  controlTraceCount: 20,
  resumedTraceCount: 20,
  controlTraceDigest: "actual-trace",
  resumedTraceDigest: "actual-trace",
  traceOverflow: false,
  restoreWorldDifferences: [],
  firstTraceInputDifferences: [],
  firstDivergentTraceInputDifferences: [],
  firstDivergentActors: [],
  resumedUsefulWork: { tick: 401, advancedQueueAttempts: 1, completedQueueItems: 0, nativeDamageEvents: 0 },
  firstTraceDifference: null
};

it("bounds native world mismatch diagnostics to stable field paths", () => {
  expect(
    nativeDebugProjectionDifferencePaths(
      { actors: [{ owner: 1 }, { x: 2 }] },
      { actors: [{ owner: 2 }, { x: 2 }, { x: 3 }] }
    )
  ).toEqual(["$world.actors.length", "$world.actors[0].owner"]);
  expect(nativeDebugProjectionDifferencePaths({ a: 1, b: 2 }, { a: 2, b: 3 }, 1)).toEqual(["$world.a"]);
  expect(nativeDebugProjectionDifferences({ value: "same" }, { value: "changed" })).toEqual([
    { path: "$world.value", before: "same", after: "changed" }
  ]);
});

it("requires a real same-realm restore, one native owner and full queue/brain/cadence continuation", () => {
  expect(nativeSaveProofFailures("before_apply", base)).toEqual([]);
  for (const proof of [
    undefined,
    { ...base, sameRealm: false },
    { ...base, traceOverflow: true },
    { ...base, resumedTraceCount: 0 },
    { ...base, resumedTraceDigest: "different-decision" },
    { ...base, restored: { ...base.restored, worldDigest: "legacy-only-hash" } },
    { ...base, restored: { ...base.restored, cadenceDigest: "restarted-cadence" } },
    { ...base, resumed: { ...base.resumed, recoveryDigest: "reset-age" } },
    { ...base, restored: { ...base.restored, reservationsDigest: "lost-claims" } },
    { ...base, restored: { ...base.restored, owner: { ...base.restored.owner, controllerCount: 2 } } },
    { ...base, premises: { ...base.premises, captureDropped: true } }
  ])
    expect(nativeSaveProofFailures("before_apply", proof).length).toBeGreaterThan(0);
});

it("rejects a declared lifecycle branch without its actual original paid work or chronic failure", () => {
  for (const [branch, tick] of [
    ["applied_pending", 199],
    ["during_active", 119],
    ["pause_speed", 599]
  ] as const) {
    const proof = {
      ...base,
      branch,
      saved: boundary(tick),
      restored: boundary(tick),
      premises: { ...base.premises, tick }
    };
    expect(nativeSaveProofFailures(branch, proof).length).toBeGreaterThan(0);
  }
});

it("requires exact native setup payment identity and no post-charge refund for active paid work", () => {
  const tick = 119,
    proof: NativeSaveProof = {
      ...base,
      branch: "during_active",
    saved: { ...boundary(tick), owner: { ...boundary(tick).owner, decisionSequence: 5 } },
      restored: boundary(tick),
    controlTraceCount: 15,
    resumedTraceCount: 15,
      premises: {
        ...base.premises,
        tick,
        paidTrainingItems: 1,
        paidResearchItems: 1,
        unfinishedOriginalSite: true,
        paidTrainingProvenance: true,
        paidResearchProvenance: true,
        paidConstructionProvenance: true,
        postChargeResourceReset: false
      }
    };
  expect(nativeSaveProofFailures("during_active", proof)).toEqual([]);
  for (const change of [
    { paidTrainingProvenance: false },
    { paidResearchProvenance: false },
    { paidConstructionProvenance: false },
    { postChargeResourceReset: true }
  ])
    expect(
      nativeSaveProofFailures("during_active", { ...proof, premises: { ...proof.premises, ...change } }).length
    ).toBeGreaterThan(0);
});

it("refuses matching erased trace digests and fabricated decision counts", () => {
  expect(
    nativeSaveProofFailures("before_apply", {
      ...base,
      controlTraceDigest: "",
      resumedTraceDigest: ""
    }).length
  ).toBeGreaterThan(0);
  for (const count of [Number.NaN, Infinity, -1, 0, 0.5]) {
    expect(
      nativeSaveProofFailures("before_apply", {
        ...base,
        controlTraceCount: count,
        resumedTraceCount: count
      }).length
    ).toBeGreaterThan(0);
  }
});

it("requires the first resumed decision to match but allows later decisions to follow changed physical state", () => {
  const laterDecision = {
    tick: 40,
    sequence: 2,
    inputDigest: "input",
    profileDigest: "profile",
    catalogDigest: "catalog",
    observationDigest: "observation",
    priorStateDigest: "prior",
    outcomesDigest: "outcomes",
    resultDigest: "result"
  };
  const laterDecisionDifference = {
    index: 1,
    control: laterDecision,
    resumed: { ...laterDecision, inputDigest: "changed" }
  };
  const proof: NativeSaveProof = {
    ...base,
    firstTraceDifference: laterDecisionDifference,
    controlTraceDigest: "control-tail",
    resumedTraceDigest: "resumed-tail",
    control: { ...base.control, worldDigest: "control-world", brainDigest: "control-brain", authorityDigest: "control-authority" },
    resumed: { ...base.resumed, worldDigest: "resumed-world", brainDigest: "resumed-brain", authorityDigest: "resumed-authority" }
  };

  expect(nativeSaveProofFailures("before_apply", proof)).toEqual([]);
  expect(
    nativeSaveProofFailures("before_apply", { ...proof, firstTraceDifference: { ...laterDecisionDifference, index: 0 } })
  ).toContain("native_save_next_legitimate_decisions_incomplete_or_reset");
  expect(
    nativeSaveProofFailures("before_apply", {
      ...proof,
      resumed: { ...proof.resumed, recoveryDigest: "reset-recovery" }
    })
  ).toContain("native_save_continuation_lifecycle_diverged:recoveryDigest");
  expect(
    nativeSaveProofFailures("before_apply", {
      ...proof,
      resumedUsefulWork: { ...proof.resumedUsefulWork, advancedQueueAttempts: 0 }
    })
  ).toContain("native_save_useful_work_did_not_continue_after_restore");
});
