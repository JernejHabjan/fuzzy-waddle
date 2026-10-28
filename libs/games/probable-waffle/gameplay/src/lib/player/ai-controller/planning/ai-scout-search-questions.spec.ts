import { FactionType, OrderType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import { buildAiAccessGraphV1 } from "./ai-access-graph-v1";
import { homeNode, unit, observation, profile, manager } from "./ai-skirmish-test-fixtures";

const access = buildAiAccessGraphV1({
  generation: 1,
  staticRevision: 1,
  dynamicRevision: 1,
  threatRevision: 0,
  builtTick: 0,
  continuationCursor: 0,
  includeAirRegion: false,
  cells: Array.from({ length: 16 }, (_, x) => ({
    x,
    y: 0,
    ground: true,
    water: false,
    elevation: 0,
    clearance: 2,
    knowledge: "known_static",
    groundNeighborKeys: [x - 1, x + 1].filter((nx) => nx >= 0 && nx < 16).map((nx) => `${nx},0`)
  }))
});

function world(tick: number, firstSeen: boolean) {
  const base = observation(tick, [unit("scout", homeNode, 0)], [], []);
  return {
    ...base,
    map: {
      ...base.map!,
      accessGraph: access.graph,
      scoutSearchPoints: [
        { pointId: "search:a", accessNodeId: homeNode, position: { x: 4, y: 0, z: 0 }, observed: firstSeen },
        { pointId: "search:b", accessNodeId: homeNode, position: { x: 12, y: 0, z: 0 }, observed: false }
      ]
    }
  };
}

describe("scouting search questions", () => {
  it("SCOUT-01/SCOUT-02 progresses through unseen points in one region and remembers answers after leaving", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const first = manager.propose(world(20, false), state);
    expect(first.intents).toContainEqual(
      expect.objectContaining({
        kind: "scout",
        actorIds: ["scout"],
        logicalPosition: { x: 4, y: 0, z: 0 }
      })
    );
    const knowledge = first.statePatch?.knowledge,
      squads = first.statePatch?.squads;
    if (!knowledge || !squads) throw new Error("scout_search_fixture_missing");
    const next = manager.propose(world(40, true), { ...state, knowledge, squads });
    expect(next.intents).toContainEqual(
      expect.objectContaining({ kind: "scout", logicalPosition: { x: 12, y: 0, z: 0 } })
    );
    expect(next.statePatch?.knowledge?.questions).toContainEqual(
      expect.objectContaining({ kind: "explore:search:a", state: "answered" })
    );
    if (!next.statePatch?.knowledge) throw new Error("scout_answer_fixture_missing");
    const later = manager.propose(world(60, false), {
      ...state,
      knowledge: next.statePatch.knowledge,
      squads: next.statePatch.squads ?? []
    });
    expect(later.statePatch?.knowledge?.questions.find((question) => question.kind === "explore:search:a")?.state).toBe(
      "answered"
    );
    expect(later.intents.some((intent) => intent.kind === "scout" && intent.logicalPosition.x === 4)).toBe(false);
  });

  it("redispatches an active scout mission when combat replaced its native search move", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const first = manager.propose(world(20, false), state);
    const knowledge = first.statePatch?.knowledge, squads = first.statePatch?.squads;
    if (!knowledge || !squads) throw new Error("scout_search_fixture_missing");
    const retainedSquads = squads.map((squad) => squad.squadId === "squad:scout:primary"
      ? { ...squad, tactics: {} as never }
      : squad);
    const base = world(40, false);
    const interrupted = {
      ...base,
      actors: base.actors.map((actor) => actor.actorId === "scout"
        ? {
            ...actor,
            activeOrder: {
              status: "known" as const,
              observedTick: 40,
              value: { orderType: OrderType.Attack, targetActorId: "visible-enemy" }
            }
          }
        : actor)
    };

    const next = manager.propose(interrupted, { ...state, knowledge, squads: retainedSquads });

    expect(next.intents).toContainEqual(expect.objectContaining({
      kind: "scout",
      actorIds: ["scout"],
      logicalPosition: { x: 4, y: 0, z: 0 }
    }));
  });

  it("chooses the nearest unseen search point before a lexically earlier distant point", () => {
    const state = createAiBrainStateV1({
      playerNumber: 1,
      faction: FactionType.Tivara,
      profile,
      tick: 0,
      archetypeId: "balanced"
    });
    const base = world(20, false);
    const nearbyFirst = {
      ...base,
      map: {
        ...base.map!,
        scoutSearchPoints: [
          { pointId: "search:a-distant", accessNodeId: homeNode, position: { x: 15, y: 0, z: 0 }, observed: false },
          { pointId: "search:z-near", accessNodeId: homeNode, position: { x: 2, y: 0, z: 0 }, observed: false }
        ]
      }
    };

    const proposal = manager.propose(nearbyFirst, state);

    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "scout", logicalPosition: { x: 2, y: 0, z: 0 } })
    );
  });

});
