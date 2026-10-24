import { ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiProgressContractV1 } from "../contracts/ai-progress-contracts";
import { aiDeadline } from "../contracts/ai-core-types";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { AiRecoveryManager } from "../planning/ai-recovery-manager";
import { planAiDecisions } from "../planning/ai-decision-planner";
import { projectAiDebugSnapshot, findAiWhyNotExplanationV1 } from "../debug/project-ai-debug-snapshot";
import { createAiProductionPolicyFixture } from "./ai-production-policy-fixture";
import { createAiTestObservation } from "./ai-test-fixtures";

function progress(planId: AiProgressContractV1["planId"], deadline: number): AiProgressContractV1 {
  return {
    planId,
    expectedEvidenceKinds: ["income_delivered"],
    lastUsefulProgress: null,
    milestoneDeadline: aiDeadline(deadline),
    blockerId: null,
    recoveryEpisodeIds: []
  };
}

describe("controller progress and admission scenario contracts", () => {
  it("H-02 keeps causal age when decision identities and retry ticks change", () => {
    const f = createAiProductionPolicyFixture();
    const manager = new AiRecoveryManager(() => f.catalog);
    const initial = { ...f.state, lastCommittedTick: 0, progress: [progress("plan:stalled", 100)] };
    const first = manager.propose({ ...f.observation, tick: 500 }, initial);
    const recovery = first.statePatch?.recovery;
    if (!recovery) throw new Error("missing_recovery");
    const next = manager.propose(
      { ...f.observation, tick: 900 },
      {
        ...initial,
        lastCommittedTick: 880,
        scheduler: { ...initial.scheduler, decisionSequence: 99 },
        recovery
      }
    );
    const episode = next.statePatch?.recovery?.records.find((record) => record.recoveryKey === "progress:plan:stalled");
    expect(episode).toMatchObject({ enteredTick: 500, lastProgressTick: 0, attempt: 2 });
    expect(episode?.phaseDeadline).toEqual(recovery.records[0]?.phaseDeadline);
  });

  it("H-03 retains long healthy work until its declared milestone instead of a generic 200-tick timeout", () => {
    const f = createAiProductionPolicyFixture();
    const work = {
      ...progress("plan:long-work", 2000),
      lastUsefulProgress: {
        kind: "route_advanced" as const,
        tick: 800,
        sourceId: "journey",
        amount: 1
      }
    };
    const result = new AiRecoveryManager(() => f.catalog).propose(
      { ...f.observation, tick: 900 },
      {
        ...f.state,
        progress: [work]
      }
    );
    expect(result.statePatch?.recovery?.records.some((record) => record.planId === work.planId)).toBe(false);
    expect(result.intents.some((intent) => intent.kind === "stop" || intent.kind === "concede")).toBe(false);
  });

  it("H-04 does not let a child's unrelated progress refresh a stalled parent", () => {
    const f = createAiProductionPolicyFixture();
    const parent = progress("plan:parent", 100);
    const child = {
      ...progress("plan:child", 100),
      lastUsefulProgress: {
        kind: "income_delivered" as const,
        tick: 490,
        sourceId: "unrelated-wood",
        amount: 10
      }
    };
    const result = new AiRecoveryManager(() => f.catalog).propose(
      { ...f.observation, tick: 500 },
      {
        ...f.state,
        lastCommittedTick: 0,
        progress: [parent, child]
      }
    );
    expect(
      result.statePatch?.recovery?.records
        .filter((record) => record.cause === "overdue_useful_progress")
        .map((record) => record.planId)
    ).toEqual(["plan:parent"]);
  });

  it("H-12 releases the deterministic reversible side of a wait cycle while preserving paid work", () => {
    const f = createAiProductionPolicyFixture();
    const state: AiBrainStateV1 = {
      ...f.state,
      waitEdges: [
        {
          edgeId: "wait:a",
          fromPlanId: "plan:a",
          toPlanId: "plan:b",
          status: "known",
          deadline: aiDeadline(500),
          prerequisite: { kind: "resource", resourceType: ResourceType.Wood, amount: 10 }
        },
        {
          edgeId: "wait:b",
          fromPlanId: "plan:b",
          toPlanId: "plan:a",
          status: "known",
          deadline: aiDeadline(500),
          prerequisite: { kind: "resource", resourceType: ResourceType.Food, amount: 10 }
        }
      ],
      reservations: [
        {
          claimId: "claim:a",
          ownerPlanId: "plan:a",
          createdTick: 0,
          prerequisites: [],
          priority: { urgencyClass: 1, utility: 900 },
          state: { kind: "provisional", expiresAt: aiDeadline(500) }
        },
        {
          claimId: "claim:b",
          ownerPlanId: "plan:b",
          createdTick: 0,
          prerequisites: [],
          priority: { urgencyClass: 1, utility: 900 },
          state: { kind: "provisional", expiresAt: aiDeadline(500) }
        },
        {
          claimId: "claim:paid",
          ownerPlanId: "plan:a",
          createdTick: 0,
          prerequisites: [],
          priority: { urgencyClass: 1, utility: 900 },
          state: { kind: "applied_spending", appliedTick: 1 }
        }
      ]
    };
    const planned = planAiDecisions(f.observation, state, [], [], f.profile);
    const permuted = planAiDecisions(
      f.observation,
      {
        ...state,
        waitEdges: [...state.waitEdges].reverse(),
        reservations: [...state.reservations].reverse()
      },
      [],
      [],
      f.profile
    );
    expect(planned.preDecisions).toContainEqual(
      expect.objectContaining({ detail: "dependency_cycle_released:claim:b" })
    );
    expect(planned.state.reservations.map((reservation) => reservation.claimId).sort()).toEqual([
      "claim:a",
      "claim:paid"
    ]);
    expect(permuted.preDecisions).toEqual(planned.preDecisions);
    expect(state.reservations).toHaveLength(3);
  });
});

describe("difficulty and debug scenario contracts", () => {
  it("D-01 maps every lobby profile to distinct exact cadence and quotas without fallback", () => {
    const profiles = [
      ProbableWaffleAiDifficulty.Easy,
      ProbableWaffleAiDifficulty.Medium,
      ProbableWaffleAiDifficulty.Hard
    ].map(createAiProfileConfigV1);
    expect(
      profiles.map((profile) => [
        profile.decisionIntervalTicks,
        profile.maxAcceptedCommandBatchesPerStep,
        profile.maxActorOrdersPerStep,
        profile.voluntaryOffensiveMissionLimit
      ])
    ).toEqual([
      [40, 4, 16, 1],
      [20, 8, 32, 2],
      [10, 12, 48, 3]
    ]);
    expect(profiles.every((profile) => profile.profileVersion === "skirmish-ai-v1" && !profile.cheats)).toBe(true);
    expect(() => createAiProfileConfigV1(99 as ProbableWaffleAiDifficulty)).toThrow("unsupported_ai_difficulty");
  });

  it("DBG-02 returns every recorded why-not status and honest absence without changing the planner snapshot", () => {
    const f = createAiProductionPolicyFixture();
    const base = projectAiDebugSnapshot(createAiTestObservation(), f.state, []);
    const whyNot = [
      { subjectId: "not-evaluated", status: "not_evaluated" as const, reason: "quota" },
      { subjectId: "rejected", status: "rejected" as const, reason: "resource" },
      { subjectId: "unresolved", status: "outcome_unresolved" as const, reason: "applied" }
    ];
    const snapshot = { ...base, whyNot };
    const before = JSON.stringify(snapshot);
    for (const record of whyNot) expect(findAiWhyNotExplanationV1(snapshot, record.subjectId)).toEqual(record);
    expect(findAiWhyNotExplanationV1(snapshot, "never-recorded")).toEqual({
      subjectId: "never-recorded",
      status: "not_recorded",
      reason: null
    });
    expect(JSON.stringify(snapshot)).toBe(before);
  });
});
