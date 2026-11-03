import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainState } from "../../brain/state/create-ai-brain-state";
import type { AiBrainState } from "../../contracts/state/ai-state-contracts";
import { createAiProfileConfig } from "../../profiles/ai-profile-defaults";
import { createAiTestObservation } from "../../testing/fixtures/coordination/ai-test-fixtures";
import { planAiDecisions } from "./ai-decision-planner";

describe("planAiDecisions", () => {
  const profile = createAiProfileConfig(ProbableWaffleAiDifficulty.Medium);

  it("services every lane deterministically even when no manager can dispatch work", () => {
    const state = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:balanced"
    });
    const result = planAiDecisions(createAiTestObservation(), state, [], [], profile);
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
    const state = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:balanced"
    });
    const withReservations: AiBrainState = {
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
    const result = planAiDecisions({ ...createAiTestObservation(), tick: 20 }, withReservations, [], [], profile);
    expect(result.state.reservations.map((reservation) => reservation.claimId)).toEqual(["claim:spent"]);
  });

  it("releases provisional actor leases when squad ownership transfers", () => {
    const state = createAiBrainState({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "opening:balanced"
    });
    const actorLease = (claimId: string, ownerPlanId: string) => ({
      claimId,
      subjectKey: "actor:worker-1",
      ownerPlanId,
      state: {
        kind: "provisional" as const,
        expiresAt: {
          clock: "simulation" as const,
          unit: "tick" as const,
          dueTick: 100,
          persistence: "save" as const
        }
      },
      prerequisites: [],
      createdTick: 0
    });
    const withTransferredActor: AiBrainState = {
      ...state,
      squads: [
        {
          squadId: "squad:attack:raid" as AiBrainState["squads"][number]["squadId"],
          actorIds: ["worker-1"],
          state: "engage"
        } as AiBrainState["squads"][number]
      ],
      reservations: [
        actorLease("claim:old-defense", "plan:squad:defense:home"),
        actorLease("claim:new-raid", "plan:squad:attack:raid")
      ]
    };

    const result = planAiDecisions(createAiTestObservation(), withTransferredActor, [], [], profile);

    expect(result.state.reservations.map((reservation) => reservation.claimId)).toEqual(["claim:new-raid"]);
  });
});

it("records proposal consideration without falsely claiming that a command was serviced", () => {
  const profile = createAiProfileConfig(ProbableWaffleAiDifficulty.Medium);
  const state = createAiBrainState({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "balanced"
  });
  const result = planAiDecisions(
    createAiTestObservation(),
    state,
    [],
    [{ managerId: "empty-production", lane: "supply_production", evaluated: true, intents: [], reasons: [] }],
    profile
  );
  const lane = result.state.lanes.find((entry) => entry.lane === "supply_production");
  expect(lane?.lastConsideredTick).toBe(20);
  expect(lane?.lastServicedTick).toBe(0);
});

it("records every lane evaluated by a multi-lane proposer", () => {
  const profile = createAiProfileConfig(ProbableWaffleAiDifficulty.Medium);
  const state = createAiBrainState({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "balanced"
  });
  const result = planAiDecisions(
    createAiTestObservation(),
    state,
    [],
    [{
      managerId: "skirmish",
      lane: "army_threat",
      evaluatedLanes: ["scouting"],
      evaluated: true,
      intents: [],
      reasons: []
    }],
    profile
  );

  expect(result.state.lanes.find((lane) => lane.lane === "scouting")?.lastConsideredTick).toBe(20);
  expect(result.state.lanes.find((lane) => lane.lane === "army_threat")?.lastConsideredTick).toBe(20);
});
