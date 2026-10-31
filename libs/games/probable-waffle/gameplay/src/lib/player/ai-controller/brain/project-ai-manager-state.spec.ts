import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1, AiSquadStateV1 } from "../contracts/ai-brain-state-v1";
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
  it.each([true, false])("projects reinforcements once and respects strategic flyer retention=%s", (retainFlyer) => {
    const parent = createSquad({ domain: "air", actorIds: ["flyer"] });
    const child = {
      ...parent,
      squadId: "squad:attack:primary:domain:ground" as const,
      domain: "ground" as const,
      actorIds: ["old-guard"]
    };
    const current = createState([parent, child]);
    const result = projectAiManagerState(current, [
      createProposal({
        squads: [
          { ...parent, domain: "mixed", actorIds: [...(retainFlyer ? ["flyer"] : []), "old-guard", "new-guard"] },
          ...(retainFlyer ? [] : [createSquad({ squadId: "squad:reserve", role: "reserve", actorIds: ["flyer"] })])
        ]
      }),
      createProposal({ squadUpdates: [parent, { ...child, actorIds: ["old-guard", "new-guard"] }] })
    ]);
    expect(
      result.squads
        .filter((entry) => entry.role === "attack")
        .flatMap((entry) => entry.actorIds)
        .sort()
    ).toEqual([...(retainFlyer ? ["flyer"] : []), "new-guard", "old-guard"]);
    expect(result.squads.find((entry) => entry.squadId === child.squadId)?.actorIds).toEqual([
      "new-guard",
      "old-guard"
    ]);
  });

  it("keeps a tactical air/ground partition disjoint after the full strategic membership projection", () => {
    const parent = createSquad({ domain: "mixed", actorIds: ["flyer", "guard"] });
    const batches = [
      createProposal({ squads: [parent] }),
      createProposal({
        squadUpdates: [
          { ...parent, domain: "air", actorIds: ["flyer"] },
          { ...parent, squadId: "squad:attack:primary:domain:ground", domain: "ground", actorIds: ["guard"] }
        ]
      })
    ];
    let state: AiBrainStateV1 = createState([parent]);
    for (let decision = 0; decision < 3; decision++) {
      state = projectAiManagerState(state, batches);
      expect(state.squads.map((squad) => squad.actorIds)).toEqual([["flyer"], ["guard"]]);
    }
  });

  it.each(["new-raider", null])(
    "preserves the strategic defense objective %s across stale tactical/domain updates",
    (objectiveId) => {
      const defense = createSquad({ squadId: "squad:defense:home", role: "defense", objectiveId: "old-building" });
      const child = { ...defense, squadId: "squad:defense:home:domain:ground" as const };
      const result = projectAiManagerState(createState([defense, child]), [
        createProposal({ squads: [{ ...defense, objectiveId }] }),
        createProposal({ squadUpdates: [defense, child] })
      ]);
      expect(result.squads).toHaveLength(2);
      expect(result.squads.every((squad) => squad.objectiveId === objectiveId)).toBe(true);
    }
  );

  it("does not create a new tactical domain child after its strategic parent was removed", () => {
    const parent = createSquad({ domain: "mixed", actorIds: ["flyer", "guard"] });
    const child = createSquad({ squadId: "squad:attack:primary:domain:ground", actorIds: ["guard"] });
    const result = projectAiManagerState(createState([parent]), [
      createProposal({ squads: [] }),
      createProposal({ squadUpdates: [child] })
    ]);
    expect(result.squads).toEqual([]);
  });
  it("keeps a newly assigned scout out of a stale reserve snapshot and preserves its new members", () => {
    const reserve = createSquad({ squadId: "squad:reserve:home", role: "reserve", actorIds: ["a", "b", "c"] });
    const scout = createSquad({ squadId: "squad:scout:primary", role: "scout", actorIds: ["b"] });
    const result = projectAiManagerState(createState([reserve]), [
      createProposal({ squads: [{ ...reserve, actorIds: ["a"] }, scout] }),
      createProposal({ squadUpdates: [reserve, { ...scout, actorIds: [], state: "completed" }] })
    ]);
    expect(result.squads.find((s) => s.squadId === reserve.squadId)?.actorIds).toEqual(["a", "c"]);
    expect(result.squads.find((s) => s.squadId === scout.squadId)?.actorIds).toEqual(["b"]);
    expect(result.squads.find((s) => s.squadId === scout.squadId)?.state).toBe(scout.state);
  });

  it("allows a tactical-only owner to release dead members", () => {
    const squad = createSquad();
    const result = projectAiManagerState(createState([squad]), [
      createProposal({
        squadUpdates: [{ ...squad, actorIds: [], state: "completed" }]
      })
    ]);
    expect(result.squads[0]?.actorIds).toEqual([]);
    expect(result.squads[0]?.state).toBe("completed");
  });

  it("prevents an old domain child from reclaiming an actor reassigned to defense", () => {
    const parent = createSquad({ domain: "air", actorIds: ["flyer"] });
    const child = createSquad({ squadId: "squad:attack:primary:domain:ground", actorIds: ["guard"] });
    const defense = createSquad({ squadId: "squad:defense:home", role: "defense", actorIds: ["guard"] });
    const result = projectAiManagerState(createState([parent, child]), [
      createProposal({ squads: [parent, defense] }),
      createProposal({ squadUpdates: [parent, child] })
    ]);
    expect(result.squads.find((s) => s.squadId === child.squadId)?.actorIds).toEqual([]);
    expect(result.squads.find((s) => s.squadId === defense.squadId)?.actorIds).toEqual(["guard"]);
  });
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

  it.each(["cancelled", "completed"] as const)("does not reactivate a %s squad from a stale tactical snapshot", (terminalState) => {
    const neutralScout = createSquad({
      squadId: "squad:scout:neutral",
      role: "scout",
      actorIds: ["scout"],
      state: "advance"
    });
    const terminalScout = { ...neutralScout, actorIds: [], state: terminalState };
    const result = projectAiManagerState(createState([neutralScout]), [
      createProposal({ squads: [terminalScout] }),
      createProposal({ squadUpdates: [neutralScout] })
    ]);

    expect(result.squads).toEqual([expect.objectContaining({ state: terminalState, actorIds: [] })]);
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
