import { AiFortificationManager, fortificationPreservesConnectivityV1 } from "./ai-fortification-manager";
import { profile, catalog, observation, threatenedState } from "./ai-fortification-test-fixture";
import { requireAiTestEntry } from "../testing/ai-test-fixtures";
import { createFortificationPlan } from "./ai-fortification-plan";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";

const manager = new AiFortificationManager(profile, () => catalog);

describe("fortification continuation and placement contracts", () => {
  it("WALL-02 requires the actual intended opening to remain passable rather than substituting a nearby cell", () => {
    const source = observation();
    const graph = requireAiTestEntry(manager.propose(source, threatenedState()).statePatch?.fortifications, 0).graph;
    if (!graph) throw new Error("fortification_graph_missing");
    const gate = graph.nodes.find((node) => node.kind === "gate_slot");
    if (!gate) throw new Error("fortification_opening_missing");
    expect(
      fortificationPreservesConnectivityV1({
        cells: source.map?.constructionCells ?? [],
        blockedTileKeys: [gate.footprintTileKeys[0] ?? "missing"],
        protectedPosition: { x: 8, y: 10, z: 0 },
        openingPosition: gate.position,
        exteriorPosition: { x: 10, y: 10, z: 0 },
        requiredPositions: []
      })
    ).toBe(false);
  });

  it("WALL-01 refuses a fresh layout whose opening or wall footprint is occupied", () => {
    const source = observation();
    const proposal = manager.propose(
      {
        ...source,
        map: {
          ...source.map!,
          constructionCells: source.map!.constructionCells!.map((cell) => ({
            ...cell,
            observedBlocked: cell.observedBlocked || cell.tileKey === "9,10"
          }))
        }
      },
      threatenedState()
    );
    expect(proposal.intents).toEqual([]);
    expect(proposal.statePatch?.fortifications).toEqual([]);
  });

  it("H-28 prices cumulative other-base commitments instead of admitting a second short prefix against the full budget", () => {
    const initial = threatenedState();
    const prior = requireAiTestEntry(manager.propose(observation(), initial).statePatch?.fortifications, 0);
    if (!prior.graph) throw new Error("fortification_graph_missing");
    const state: AiBrainStateV1 = {
      ...initial,
      fortifications: [
        {
          ...prior,
          planId: "fortification:other",
          protectedBaseIds: ["base:other"],
          lifecycle: "active",
          graph: {
            ...prior.graph,
            baseId: "base:other",
            budget: { ...prior.graph.budget, committedByResource: { stone: 900 } }
          }
        }
      ]
    };
    expect(
      createFortificationPlan(profile, null, observation(), state, "base:main:main", { x: 5, y: 10, z: 0 }, catalog)
    ).toBeNull();
    expect(
      createFortificationPlan(profile, null, observation(), initial, "base:main:main", { x: 5, y: 10, z: 0 }, catalog)
    ).not.toBeNull();
  });

  it("WALL-04 preserves requested effect identities and the remaining graph across a JSON save/load boundary", () => {
    const initial = threatenedState();
    const first = manager.propose(observation(), initial);
    const saved: AiBrainStateV1 = JSON.parse(
      JSON.stringify({ ...initial, fortifications: first.statePatch?.fortifications })
    );
    const original = manager.propose(observation([], 120), {
      ...initial,
      fortifications: first.statePatch?.fortifications ?? []
    });
    const restored = manager.propose(observation([], 120), saved);
    expect(restored).toEqual(original);
    expect(restored.statePatch?.fortifications?.[0]?.nodeIds).toEqual(first.statePatch?.fortifications?.[0]?.nodeIds);
    expect(restored.intents.map((intent) => intent.effectId)).toEqual(
      original.intents.map((intent) => intent.effectId)
    );
  });
});
