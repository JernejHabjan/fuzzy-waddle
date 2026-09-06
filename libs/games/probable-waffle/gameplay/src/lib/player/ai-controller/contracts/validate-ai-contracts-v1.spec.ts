import { FactionType, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { aiDeadline } from "./ai-core-types";
import { assertAiBrainStateV1, assertAiObservationV1, assertAiWaitEdgesV1 } from "./validate-ai-contracts-v1";
import { createStage2Observation } from "../testing/ai-stage-2-test-fixtures";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";

describe("Stage 2 AI invariant guards", () => {
  it("rejects non-finite resource state at the observation boundary", () => {
    const observation = createStage2Observation();
    const wood = observation.resources[0];
    if (!wood) throw new Error("fixture_missing_wood");
    expect(() =>
      assertAiObservationV1({
        ...observation,
        resources: [{ ...wood, stockpile: Number.NaN }]
      })
    ).toThrow(`invalid_ai_number:resources.${ResourceType.Wood}.stockpile`);
  });

  it("rejects duplicate dependency identities and direct self-dependency", () => {
    const edge = {
      edgeId: "wait:food",
      fromPlanId: "plan:worker",
      toPlanId: "plan:farm",
      prerequisite: { kind: "resource", resourceType: ResourceType.Food, amount: 50 },
      status: "known",
      deadline: aiDeadline(200)
    } as const;
    expect(() => assertAiWaitEdgesV1([edge, edge])).toThrow("duplicate_ai_identity:waitEdges.edgeId");
    expect(() => assertAiWaitEdgesV1([{ ...edge, toPlanId: edge.fromPlanId }])).toThrow(
      "invalid_ai_dependency:self_dependency"
    );
  });

  it("rejects a persisted deadline without simulation clock metadata", () => {
    const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    expect(() =>
      assertAiBrainStateV1({
        ...state,
        strategy: { ...state.strategy, commitmentDeadline: { dueTick: 200 } }
      })
    ).toThrow("invalid_ai_deadline:strategy.commitmentDeadline");
  });
});
