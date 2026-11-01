import { FactionType, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { aiDeadline } from "./ai-core-types";
import { assertAiBrainState, assertAiObservation, assertAiWaitEdges } from "./validate-ai-contracts";
import { createAiTestObservation } from "../testing/ai-test-fixtures";
import { createAiBrainState } from "../brain/create-ai-brain-state";
import { createAiProfileConfig } from "../profiles/ai-profile-defaults";

describe("Stage 2 AI invariant guards", () => {
  it("rejects non-finite resource state at the observation boundary", () => {
    const observation = createAiTestObservation();
    const wood = observation.resources[0];
    if (!wood) throw new Error("fixture_missing_wood");
    expect(() =>
      assertAiObservation({
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
    expect(() => assertAiWaitEdges([edge, edge])).toThrow("duplicate_ai_identity:waitEdges.edgeId");
    expect(() => assertAiWaitEdges([{ ...edge, toPlanId: edge.fromPlanId }])).toThrow(
      "invalid_ai_dependency:self_dependency"
    );
  });

  it("rejects a persisted deadline without simulation clock metadata", () => {
    const profile = createAiProfileConfig(ProbableWaffleAiDifficulty.Medium);
    const state = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    expect(() =>
      assertAiBrainState({
        ...state,
        strategy: { ...state.strategy, commitmentDeadline: { dueTick: 200 } }
      })
    ).toThrow("invalid_ai_deadline:strategy.commitmentDeadline");
  });

  it("rejects an inconsistent persisted workforce budget", () => {
    const state = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile: createAiProfileConfig(ProbableWaffleAiDifficulty.Medium),
      tick: 20,
      archetypeId: "balanced"
    });
    expect(() => assertAiBrainState({
      ...state,
      economyProduction: {
        ...state.economyProduction,
        workforce: {
          workers: 6, queuedWorkers: 0, assignedWorkers: 5, desiredWorkers: 8,
          desiredFoodSources: 4, foodRunwayTicks: 300, blocker: null,
          economyPermille: 650, defensePermille: 650
        }
      }
    })).toThrow("invalid_ai_economy_budget");
  });
});
