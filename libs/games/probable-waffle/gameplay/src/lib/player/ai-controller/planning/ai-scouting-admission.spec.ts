import { FactionType, ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from "../brain/create-ai-brain-state-v1";
import type { AiObservedActorV1 } from "../contracts/ai-observation-v1";
import { unknownAiValue } from "../testing/ai-test-fixtures";
import { enemyNode, homeNode, manager, observation, profile, unit } from "./ai-skirmish-test-fixtures";

function state() {
  return createAiBrainStateV1({
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 0,
    archetypeId: "balanced"
  });
}

function neutral(actorId = "resource", accessNode = enemyNode, x = 22): AiObservedActorV1 {
  return {
    ...unit(actorId, accessNode, x),
    objectName: ObjectNames.Tree6,
    owner: null,
    relation: "neutral",
    visibility: "visible",
    capabilities: [],
    resourceState: {
      status: "known",
      observedTick: 20,
      value: {
        resourceType: ResourceType.Wood,
        available: { status: "known", value: 180, observedTick: 20 },
        carried: unknownAiValue,
        growthReadyTick: unknownAiValue,
        serviceCapacity: unknownAiValue
      }
    }
  };
}

function guards() {
  return [unit("guard", homeNode, 0), unit("z-reserve", homeNode, 1)];
}

describe("AI scouting admission", () => {
  it("retains an admitted neutral mission without reissuing or renewing it", () => {
    const initial = state();
    const first = manager.propose(observation(20, [...guards(), neutral()], []), initial);
    const squads = first.statePatch?.squads;
    if (!squads?.length) throw new Error("fixture neutral mission missing");
    const next = manager.propose(observation(40, [...guards(), neutral()], []), { ...initial, squads });
    expect(next.intents).toEqual([]);
    expect(next.statePatch?.squads).toEqual(squads);
  });

  it("retires an expired neutral mission and does not recreate it on the next decision", () => {
    const initial = state();
    const first = manager.propose(observation(20, [...guards(), neutral()], []), initial);
    const squads = first.statePatch?.squads;
    if (!squads?.length) throw new Error("fixture neutral mission missing");
    const expired = manager.propose(observation(821, [...guards(), neutral()], []), {
      ...initial,
      squads
    });
    expect(expired.statePatch?.squads).toContainEqual(expect.objectContaining({ state: "cancelled" }));
    const retired = expired.statePatch?.squads;
    if (!retired) throw new Error("fixture retirement missing");
    expect(
      manager.propose(observation(840, [...guards(), neutral()], []), {
        ...initial,
        squads: retired
      }).intents
    ).toEqual([]);
  });

  it("completes a neutral information mission from observed coverage and releases its pawn to frontier scouting", () => {
    const initial = state();
    const first = manager.propose(observation(20, [...guards(), neutral()], []), initial);
    const squads = first.statePatch?.squads;
    if (!squads?.length) throw new Error("fixture neutral mission missing");
    const next = manager.propose(observation(40, [unit("guard", enemyNode, 1), unit("z-reserve", homeNode, 0), neutral()], [homeNode], [enemyNode]), {
      ...initial,
      squads
    });
    expect(next.statePatch?.squads).toContainEqual(
      expect.objectContaining({
        squadId: "squad:scout:neutral",
        state: "completed"
      })
    );
    expect(next.intents).toContainEqual(expect.objectContaining({ kind: "scout", actorIds: ["z-reserve"] }));
  });

  it("does not move onto a visible resource while its access is unknown", () => {
    const proposal = manager.propose(
      observation(
        20,
        [
          ...guards(),
          {
            ...neutral(),
            accessNodeId: unknownAiValue
          }
        ],
        []
      ),
      state()
    );
    expect(proposal.intents).toEqual([]);
    expect(proposal.statePatch?.squads).toEqual([]);
  });

  it("visits the reachable region representative rather than the occupied resource tile", () => {
    const proposal = manager.propose(observation(20, [...guards(), neutral()], []), state());
    expect(proposal.intents).toContainEqual(
      expect.objectContaining({
        kind: "move",
        actorIds: ["guard"],
        logicalPosition: { x: 1, y: 0, z: 0 }
      })
    );
  });

  it("selects neutral scout goals by stable visible position instead of runtime actor ID", () => {
    const proposal = manager.propose(observation(20, [
      ...guards(),
      neutral("a-runtime-id", enemyNode, 22),
      neutral("z-runtime-id", homeNode, 11)
    ], []), state());

    expect(proposal.intents).toContainEqual(expect.objectContaining({
      kind: "move",
      logicalPosition: { x: 0, y: 0, z: 0 },
      reasonCode: "stage9:neutral:z-runtime-id"
    }));
  });

  it("does not claim scenery or exhausted resources", () => {
    const resource = neutral();
    if (resource.resourceState.status !== "known") throw new Error("fixture resource missing");
    for (const actor of [
      { ...resource, resourceState: unknownAiValue },
      {
        ...resource,
        resourceState: {
          ...resource.resourceState,
          value: {
            ...resource.resourceState.value,
            available: { status: "known" as const, value: 0, observedTick: 20 }
          }
        }
      }
    ]) {
      expect(manager.propose(observation(20, [...guards(), actor], []), state()).intents).toEqual([]);
    }
  });

  it("does not assign one pawn to both neutral and frontier missions", () => {
    const proposal = manager.propose(observation(20, [...guards(), neutral()]), state());
    const assignments = proposal.statePatch?.squads?.flatMap((squad) => squad.actorIds) ?? [];
    expect(new Set(assignments).size).toBe(assignments.length);
    expect(proposal.statePatch?.squads).toHaveLength(2);
  });

  it("waits for a ready access graph before assigning frontier scouts", () => {
    const input = observation(20, [unit("guard", homeNode, 0)]);
    if (!input.map?.accessGraph) throw new Error("fixture graph missing");
    expect(
      manager.propose(
        {
          ...input,
          map: {
            ...input.map,
            accessGraph: {
              ...input.map.accessGraph,
              status: "pending"
            }
          }
        },
        state()
      ).intents
    ).toEqual([]);
  });

  it("selects a reachable pawn instead of sending the first pawn across a disconnected region", () => {
    const input = observation(20, [unit("a-isolated", homeNode, 0), unit("b-reachable", enemyNode, 1)]);
    if (!input.map?.accessGraph) throw new Error("fixture graph missing");
    const proposal = manager.propose(
      {
        ...input,
        map: {
          ...input.map,
          accessGraph: {
            ...input.map.accessGraph,
            links: []
          }
        }
      },
      state()
    );
    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "scout", actorIds: ["b-reachable"] }));
    expect(
      proposal.intents.every(
        (intent) => !intent.claims.some((claim) => claim.kind === "actor" && claim.actorId === "a-isolated")
      )
    ).toBe(true);
  });

  it("selects a frontier scout by visible position rather than runtime actor ID", () => {
    const proposal = manager.propose(observation(20, [
      unit("a-far", enemyNode, 1),
      unit("z-near", homeNode, 0)
    ]), state());

    expect(proposal.intents).toContainEqual(expect.objectContaining({ kind: "scout", actorIds: ["z-near"] }));
  });

  it("gives frontier scouts actor claims so arbitration cannot also assign another mission", () => {
    const proposal = manager.propose(observation(20, guards()), state());
    expect(proposal.intents).toContainEqual(
      expect.objectContaining({ kind: "scout", claims: [expect.objectContaining({ kind: "actor", actorId: "guard" })] })
    );
  });
});
