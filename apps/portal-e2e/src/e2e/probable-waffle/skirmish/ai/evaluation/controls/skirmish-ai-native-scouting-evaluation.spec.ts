import { test as it, expect } from "@playwright/test";
import { nativeScoutTrips, nativeScoutingObjectiveResponse } from "./skirmish-ai-native-scouting-evaluation";

function contextFor(executionEffectId: string, discoveryTick = 120) {
  const movement = {
    started: { tick: 50 },
    observations: [
      {
        spatial: {
          executionId: 7,
          caller: { order: { commandContext: { execution: { effectId: executionEffectId } } } }
        }
      },
      { tick: 100, spatial: { phase: "arrived" } }
    ]
  };
  return {
    frames: [
      {
        tick: 20,
        decision: {
          acceptedIntents: [{ kind: "scout", effectId: "effect:stage9:scout:question", planId: "plan:squad:scout:primary", actorIds: ["scout"] }]
        },
        tacticalBoundary: { searchPoints: [{ pointId: "frontier", visible: false }] }
      },
      {
        tick: discoveryTick,
        decision: { acceptedIntents: [] },
        tacticalBoundary: { searchPoints: [{ pointId: "frontier", visible: true }] }
      }
    ],
    arrived: () => [movement]
  } as unknown as Parameters<typeof nativeScoutTrips>[0];
}

it("joins selected scout missions to their native movement and new information", () => {
  expect(nativeScoutTrips(contextFor("stage13:squad:scout:primary:search:scout:1:1:50"))).toHaveLength(1);
});

it("does not join a native arrival from a different scout mission", () => {
  expect(nativeScoutTrips(contextFor("stage13:other-mission"))).toHaveLength(0);
});

it("counts new geography revealed while the scout is on its physically completed trip", () => {
  expect(nativeScoutTrips(contextFor("stage13:squad:scout:primary:search:scout:1:1:50", 80))).toHaveLength(1);
});

it("does not credit information revealed before the selected scout begins moving", () => {
  expect(nativeScoutTrips(contextFor("stage13:squad:scout:primary:search:scout:1:1:50", 40))).toHaveLength(0);
});

it("counts a route that is stopped at its original destination by a same-tick replacement", () => {
  const executionEffectId = "stage9:scout:question";
  const movementFact = (phase: "started" | "stopped", tick: number, actualTile: { x: number; y: number }) => ({
    kind: "spatial_authority",
    tick,
    spatial: {
      kind: "movement",
      executionId: 7,
      phase,
      source: { actorId: "scout" },
      caller: { order: { commandContext: { execution: { effectId: executionEffectId, source: "ai" } } } },
      gaps: [],
      originalDestination: { x: 3, y: 3 },
      actualTile
    }
  });
  const context = {
    ...contextFor(executionEffectId),
    capture: {
      facts: [movementFact("started", 50, { x: 24, y: 25 }), movementFact("stopped", 100, { x: 3, y: 3 })]
    },
    arrived: () => []
  } as unknown as Parameters<typeof nativeScoutTrips>[0];

  expect(nativeScoutTrips(context)).toHaveLength(1);
});

it("counts new search information revealed during verified physical progress toward the selected point", () => {
  const executionEffectId = "stage9:scout:question";
  const movementFact = (phase: "started" | "returned_false", tick: number, actualTile: { x: number; y: number }) => ({
    kind: "spatial_authority",
    tick,
    spatial: {
      kind: "movement",
      executionId: 8,
      phase,
      source: { actorId: "scout" },
      caller: { order: { commandContext: { execution: { effectId: executionEffectId, source: "ai" } } } },
      gaps: [],
      originalDestination: { x: 3, y: 3 },
      actualTile
    }
  });
  const base = contextFor(executionEffectId, 120);
  const context = {
    ...base,
    capture: { facts: [
      movementFact("started", 50, { x: 24, y: 25 }),
      movementFact("returned_false", 80, { x: 12, y: 3 })
    ] },
    arrived: () => []
  } as unknown as Parameters<typeof nativeScoutTrips>[0];

  expect(nativeScoutTrips(context)).toHaveLength(1);
});

it("does not count failed scout movement that made no physical progress", () => {
  const executionEffectId = "stage9:scout:question";
  const movementFact = (phase: "started" | "returned_false", tick: number) => ({
    kind: "spatial_authority",
    tick,
    spatial: {
      kind: "movement",
      executionId: 9,
      phase,
      source: { actorId: "scout" },
      caller: { order: { commandContext: { execution: { effectId: executionEffectId, source: "ai" } } } },
      gaps: [],
      originalDestination: { x: 3, y: 3 },
      actualTile: { x: 24, y: 25 }
    }
  });
  const base = contextFor(executionEffectId, 120);
  const context = {
    ...base,
    capture: { facts: [movementFact("started", 50), movementFact("returned_false", 80)] },
    arrived: () => []
  } as unknown as Parameters<typeof nativeScoutTrips>[0];

  expect(nativeScoutTrips(context)).toHaveLength(0);
});

it("counts a newly discovered candidate without preempting a committed strategic objective", () => {
  expect(
    nativeScoutingObjectiveResponse(
      {
        strategy: {
          objectiveId: "committed-core",
          assessment: { targetActorId: "committed-core", alternatives: [{ targetActorId: "new-producer" }] }
        }
      },
      "new-producer"
    )
  ).toBe(true);
});

it("does not treat an unrelated objective change as a response to discovery", () => {
  expect(
    nativeScoutingObjectiveResponse(
      { strategy: { objectiveId: "unrelated-core", assessment: { targetActorId: "unrelated-core", alternatives: [] } } },
      "new-producer"
    )
  ).toBe(false);
});
