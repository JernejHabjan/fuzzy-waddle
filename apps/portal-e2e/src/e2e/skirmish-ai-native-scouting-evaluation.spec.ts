import { test as it, expect } from "@playwright/test";
import { nativeScoutTrips } from "./skirmish-ai-native-scouting-evaluation";

function contextFor(executionEffectId: string) {
  const movement = {
    started: { tick: 50 },
    observations: [
      {
        spatial: {
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
        tick: 120,
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
