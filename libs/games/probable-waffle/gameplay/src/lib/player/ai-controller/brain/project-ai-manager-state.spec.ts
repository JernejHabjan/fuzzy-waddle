import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiManagerProposalV1 } from "../planning/ai-manager-proposal";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { createAiBrainStateV1 } from "./create-ai-brain-state-v1";
import { projectAiManagerState } from "./project-ai-manager-state";

function createSquad(overrides: Partial<AiSquadStateV1> = {}): AiSquadStateV1 {
  return {
    squadId: "squad:attack:primary",
    role: "attack",
    domain: "ground",
    actorIds: ["guard-1"],
    objectiveId: "enemy-1",
    state: "advance",
    ...overrides
  };
}

function createState(squads: readonly AiSquadStateV1[]) {
  return {
    ...createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium),
      tick: 0,
      archetypeId: "balanced"
    }),
    squads: [...squads]
  };
}

function createProposal(statePatch: NonNullable<AiManagerProposalV1["statePatch"]>): AiManagerProposalV1 {
  return {
    managerId: "fixture",
    lane: "army_threat",
    evaluated: true,
    intents: [],
    reasons: ["fixture"],
    statePatch
  };
}

describe("projectAiManagerState", () => {
  it("does not let a later narrow snapshot resurrect a squad removed by strategic ownership", () => {
    const defense = createSquad({
      squadId: "squad:defense:home",
      role: "defense",
      objectiveId: "raider-1",
      state: "defend"
    });

    const result = projectAiManagerState(createState([defense]), [
      createProposal({ squads: [] }),
      createProposal({ squadUpdates: [{ ...defense, state: "recover" }] })
    ]);

    expect(result.squads).toEqual([]);
  });

  it("retains a tactical domain child while its strategic parent remains active", () => {
    const parent = createSquad({ domain: "air", actorIds: ["flyer-1"] });
    const child = createSquad({ squadId: "squad:attack:primary:domain:ground" });

    const result = projectAiManagerState(createState([parent, child]), [
      createProposal({ squads: [parent] }),
      createProposal({ squadUpdates: [parent, child] })
    ]);

    expect(result.squads.map((squad) => squad.squadId)).toEqual([
      "squad:attack:primary",
      "squad:attack:primary:domain:ground"
    ]);
  });
});
