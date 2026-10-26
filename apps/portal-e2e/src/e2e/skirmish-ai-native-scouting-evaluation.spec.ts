import { test as it, expect } from "@playwright/test";
import { nativeScoutTrips } from "./skirmish-ai-native-scouting-evaluation";

function contextFor(executionEffectId: string) {
  const movement = {
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
          acceptedIntents: [{ kind: "scout", effectId: "effect:stage9:scout:question", actorIds: ["scout"] }]
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

it("joins selected scout intents to native movement after the effect prefix is normalized", () => {
  expect(nativeScoutTrips(contextFor("stage9:scout:question"))).toHaveLength(1);
});

it("does not join a native arrival from a different effect", () => {
  expect(nativeScoutTrips(contextFor("stage13:other-mission"))).toHaveLength(0);
});
