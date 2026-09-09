import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createStage2Observation } from "../testing/ai-stage-2-test-fixtures";
import { planAiStage6V1 } from "./ai-stage-6-planner";

describe("planAiStage6V1", () => {
  const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);

  it("services every lane deterministically even when no manager can dispatch work", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:balanced"
    });
    const result = planAiStage6V1(createStage2Observation(), state, [], [], profile);
    expect(result.state.lanes.map((lane) => lane.lane)).toEqual([
      "essential_economy",
      "supply_production",
      "scouting",
      "army_threat",
      "optional_infrastructure_tech"
    ]);
    expect(result.state.lanes.every((lane) => lane.deficit === 1)).toBe(true);
  });

  it("expires provisional work once and preserves applied spending", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:balanced"
    });
    const withReservations: AiBrainStateV1 = {
      ...state,
      reservations: [
        {
          claimId: "claim:expired",
          subjectKey: "actor:worker-1",
          ownerPlanId: "plan:opening",
          state: {
            kind: "provisional" as const,
            expiresAt: {
              clock: "simulation" as const,
              unit: "tick" as const,
              dueTick: 10,
              persistence: "save" as const
            }
          },
          prerequisites: [],
          createdTick: 0
        },
        {
          claimId: "claim:spent",
          subjectKey: "resource:wood",
          ownerPlanId: "plan:opening",
          state: { kind: "applied_spending" as const, appliedTick: 1 },
          prerequisites: [],
          createdTick: 0
        }
      ]
    };
    const result = planAiStage6V1({ ...createStage2Observation(), tick: 20 }, withReservations, [], [], profile);
    expect(result.state.reservations.map((reservation) => reservation.claimId)).toEqual(["claim:spent"]);
  });
});
