import { AiFortificationManager, fortificationPreservesConnectivity } from "../ai-fortification-manager";
import {
  catalog,
  observation,
  profile,
  threatenedState
} from "../../../testing/fixtures/fortification/ai-fortification-test-fixture";
import { requireAiTestEntry } from "../../../testing/fixtures/coordination/ai-test-fixtures";
import { createFortificationPlan, createFortificationPlanWithReason } from "../ai-fortification-plan";
import type { AiBrainState } from "../../../contracts/state/ai-state-contracts";
import { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";

const manager = new AiFortificationManager(profile, () => catalog);

describe("fortification continuation and placement contracts", () => {
  it("WALL-02 requires the actual intended opening to remain passable rather than substituting a nearby cell", () => {
    const source = observation();
    const graph = requireAiTestEntry(manager.propose(source, threatenedState()).statePatch?.fortifications, 0).graph;
    if (!graph) throw new Error("fortification_graph_missing");
    const gate = graph.nodes.find((node) => node.kind === "gate_slot");
    if (!gate) throw new Error("fortification_opening_missing");
    expect(
      fortificationPreservesConnectivity({
        cells: source.map?.constructionCells ?? [],
        blockedTileKeys: [gate.footprintTileKeys[0] ?? "missing"],
        protectedPosition: { x: 8, y: 10, z: 0 },
        openingPosition: gate.position,
        exteriorPosition: { x: 10, y: 10, z: 0 },
        requiredPositions: []
      })
    ).toBe(false);
  });

  it("WALL-01 moves an occupied opening without treating it as a terrain anchor", () => {
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
    const graph = proposal.statePatch?.fortifications?.[0]?.graph;
    const opening = graph?.nodes.find((node) => node.kind === "gate_slot");

    expect(proposal.intents.length).toBeGreaterThan(0);
    expect(graph?.terrainAnchorTileKeys).toEqual(["9,6", "9,14"]);
    expect(opening?.position).not.toEqual({ x: 9, y: 10, z: 0 });
    expect(graph?.wholeConnectivity).toBe("preserved");
  });

  it("reports actionable reasons when a fortification graph cannot be created", () => {
    const source = observation();
    const initial = threatenedState();
    const withoutThreat = {
      ...initial,
      skirmish: { ...initial.skirmish, incidents: [] }
    };
    expect(
      createFortificationPlanWithReason(
        profile,
        null,
        source,
        withoutThreat,
        "base:main:main",
        { x: 5, y: 10, z: 0 },
        catalog
      )
    ).toMatchObject({ plan: null, reason: "defense_trigger_not_justified" });

    const oneBuilder = {
      ...source,
      actors: source.actors.filter((actor) => actor.actorId !== "worker-reserve")
    };
    expect(
      createFortificationPlanWithReason(
        profile,
        null,
        oneBuilder,
        initial,
        "base:main:main",
        { x: 5, y: 10, z: 0 },
        catalog
      )
    ).toMatchObject({ plan: null, reason: "fortification_builder_coverage_unmet" });

    const withoutStone = {
      ...source,
      resources: source.resources.map((ledger) => ({ ...ledger, stockpile: 0 }))
    };
    expect(
      createFortificationPlanWithReason(
        profile,
        null,
        withoutStone,
        initial,
        "base:main:main",
        { x: 5, y: 10, z: 0 },
        catalog
      )
    ).toMatchObject({ plan: null, reason: "first_stage_over_protected_macro_budget" });
  });

  it("H-28 deducts other-base commitments while admitting an affordable first construction stage", () => {
    const initial = threatenedState();
    const prior = requireAiTestEntry(manager.propose(observation(), initial).statePatch?.fortifications, 0);
    if (!prior.graph) throw new Error("fortification_graph_missing");
    const state: AiBrainState = {
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
    const staged = createFortificationPlan(
      profile,
      null,
      observation(),
      state,
      "base:main:main",
      { x: 5, y: 10, z: 0 },
      catalog
    );
    expect(staged?.graph?.budget.remainingByResource[ResourceType.Stone]).toBe(280);
    expect(
      createFortificationPlan(profile, null, observation(), initial, "base:main:main", { x: 5, y: 10, z: 0 }, catalog)
    ).not.toBeNull();
  });

  it("WALL-04 preserves requested effect identities and the remaining graph across a JSON save/load boundary", () => {
    const initial = threatenedState();
    const first = manager.propose(observation(), initial);
    const saved: AiBrainState = JSON.parse(
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
