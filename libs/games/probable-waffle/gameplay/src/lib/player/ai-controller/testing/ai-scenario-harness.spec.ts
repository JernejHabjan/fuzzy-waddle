import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { PureAiBrainV1 } from "../brain/ai-brain";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import type { AiProposalManagerV1 } from "../planning/ai-manager-proposal";
import { createStage2Observation } from "./ai-stage-2-test-fixtures";
import { compareAiScenarioReportsV1, findFirstAiDifferenceV1 } from "./ai-first-difference-v1";
import { assertPairedAiScenariosV1, buildAiScenarioV1 } from "./ai-scenario-builder-v1";
import { runPureAiScenarioV1 } from "./ai-pure-scenario-runner-v1";
import type { AiScenarioV1 } from "./ai-scenario-v1";

const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
const state = createAiBrainStateV1({
  playerNumber: 1,
  faction: FactionType.Tivara,
  profile,
  tick: 20,
  archetypeId: "opening:test"
});
const manager: AiProposalManagerV1 = {
  managerId: "fixture-manager",
  propose: (observation) => ({
    managerId: "fixture-manager",
    lane: "army_threat",
    evaluated: true,
    reasons: ["fixture"],
    intents: [
      {
        intentId: "intent:fixture",
        effectId: "effect:fixture",
        planId: "plan:opening",
        demandId: null,
        lane: "army_threat",
        proposedTick: observation.tick,
        urgencyClass: 1,
        utility: 500,
        preconditions: [],
        claims: [],
        reasonCode: "fixture",
        kind: "stop",
        actorIds: ["worker-1"]
      }
    ]
  })
};

function scenario(expectedMinimum = 1): AiScenarioV1 {
  return buildAiScenarioV1({
    schemaVersion: 1,
    scenarioId: "DBG-01",
    purpose: "deterministic harness bootstrap",
    requirementTags: ["DBG-01", "stage-5"],
    owningStages: [5, 13],
    drivers: ["pure", "runtime"],
    seed: 759001,
    faction: FactionType.Tivara,
    initialTick: 20,
    maxTick: 40,
    warmupTicks: 0,
    syntheticOnly: false,
    pairing: {
      groupId: "stage-5-bootstrap",
      variantId: "subject",
      role: "subject",
      counterpartVariantIds: ["control"]
    },
    catalogIds: ["TivaraWorker"],
    initialState: state,
    frames: [{ observation: createStage2Observation(), outcomes: [] }],
    nonVacuity: [
      { kind: "intent_count", minimum: 1, maximum: 8 },
      { kind: "work_count_between", counter: "decisions", minimum: 1, maximum: 1 }
    ],
    expectedBranches: [
      {
        branchId: "normal",
        assertions: [{ kind: "intent_count", minimum: expectedMinimum, maximum: expectedMinimum }],
        forbidden: [{ kind: "intent_count", minimum: 2, maximum: 8 }]
      }
    ]
  });
}

describe("Stage 5 deterministic scenario harness", () => {
  it("registers every Stage 5 harness-side debug scenario against a reciprocal control contract", () => {
    for (const scenarioId of ["DBG-01", "DBG-03", "DBG-04", "DBG-05"]) {
      const subject = { ...scenario(), scenarioId };
      const control = {
        ...scenario(),
        scenarioId,
        pairing: {
          groupId: "stage-5-bootstrap",
          variantId: "control",
          role: "control" as const,
          counterpartVariantIds: ["subject"]
        }
      };
      expect(() => assertPairedAiScenariosV1(subject, control)).not.toThrow();
    }
  });

  it("produces identical command and AI digests for three identical repetitions", () => {
    const brain = new PureAiBrainV1(profile, [manager]);
    const reports = [0, 1, 2].map(() =>
      runPureAiScenarioV1(scenario(), brain, { sourceRevision: "candidate", worldDigest: "world:stable" })
    );
    expect(reports.map((report) => report.records[0]?.commandDigest)).toEqual([
      reports[0]?.records[0]?.commandDigest,
      reports[0]?.records[0]?.commandDigest,
      reports[0]?.records[0]?.commandDigest
    ]);
    expect(reports.map((report) => report.finalAiDigest)).toEqual([
      reports[0]?.finalAiDigest,
      reports[0]?.finalAiDigest,
      reports[0]?.finalAiDigest
    ]);
    expect(reports.map((report) => report.finalWorldDigest)).toEqual(["world:stable", "world:stable", "world:stable"]);
  });

  it("reports the first canonical AI field when state diverges", () => {
    const difference = findFirstAiDifferenceV1(state, {
      ...state,
      strategy: { ...state.strategy, stance: "defend" }
    });
    expect(difference?.path).toBe("$.strategy.stance");
  });

  it("reports the first divergent tick and retained normalized field path", () => {
    const report = runPureAiScenarioV1(scenario(), new PureAiBrainV1(profile, [manager]), {
      sourceRevision: "candidate"
    });
    const changed = {
      ...report,
      records: report.records.map((record) => ({
        ...record,
        diagnosticState: { ai: { stance: "defend" }, commands: [] }
      }))
    };
    expect(compareAiScenarioReportsV1(report, changed)?.tick).toBe(20);
    expect(compareAiScenarioReportsV1(report, changed)?.difference.path).toBe("$.ai.authority");
  });

  it("rejects a deliberately broken semantic oracle instead of trusting planner trace", () => {
    const report = runPureAiScenarioV1(scenario(2), new PureAiBrainV1(profile, [manager]), {
      sourceRevision: "candidate"
    });
    expect(report.assertionResults[0]?.passed).toBe(false);
    expect(report.assertionResults[0]?.failures).toContain("intent_count:1:expected:2..2");
  });
});
