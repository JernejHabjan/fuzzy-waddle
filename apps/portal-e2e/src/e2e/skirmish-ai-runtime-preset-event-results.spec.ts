import { expect, test } from "@playwright/test";
import { assertRuntimePresetEvents } from "./skirmish-ai-runtime-preset-event-results";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";

const variant: RuntimeVariantV1 = {
  id: "pinned-loss",
  seed: 759,
  aiFaction: "Tivara",
  humanFaction: "Skaduwee",
  difficulty: "Normal",
  executionKind: "focused_preset",
  role: "standalone",
  presetWorld: {
    fixtureId: "pinned-loss",
    actors: [],
    resourceGrants: [],
    events: [
      {
        id: "producer-loss",
        tick: 100,
        kind: "destroy_owned_actor",
        owner: 2,
        objectName: "AnkGuard",
        fixtureActorId: "producer"
      }
    ]
  }
};
const application = {
  createdActorIds: { producer: "native-original" },
  eventResults: [
    { id: "producer-loss", tick: 100, affectedActors: 1, subjectName: "AnkGuard", affectedActorId: "native-original" }
  ]
};

test("accepts the actual original loss target and preserves unpinned legacy event support", () => {
  expect(() => assertRuntimePresetEvents(variant, application)).not.toThrow();
  const legacy = {
    ...variant,
    presetWorld: {
      ...variant.presetWorld!,
      events: [
        { id: "producer-loss", tick: 100, kind: "destroy_owned_actor" as const, owner: 2, objectName: "AnkGuard" }
      ]
    }
  };
  expect(() =>
    assertRuntimePresetEvents(legacy, {
      ...application,
      eventResults: [{ id: "producer-loss", tick: 100, affectedActors: 1, subjectName: "AnkGuard" }]
    })
  ).not.toThrow();
});

test("rejects missing, duplicate, foreign, late, failed and substituted loss results", () => {
  expect(() => assertRuntimePresetEvents(variant, { ...application, eventResults: [] })).toThrow(
    "runtime_preset_events_incomplete"
  );
  expect(() =>
    assertRuntimePresetEvents(variant, {
      ...application,
      eventResults: [...application.eventResults, ...application.eventResults]
    })
  ).toThrow("runtime_preset_events_incomplete");
  for (const change of [
    { id: "other-loss" },
    { tick: 101 },
    { affectedActors: 0 },
    { affectedActors: 2 },
    { subjectName: "InfantryInn" },
    { affectedActorId: "native-replacement" },
    { affectedActorId: null }
  ]) {
    expect(() =>
      assertRuntimePresetEvents(variant, {
        ...application,
        eventResults: [{ ...application.eventResults[0]!, ...change }]
      })
    ).toThrow("runtime_preset_event_target_mismatch");
  }
  expect(() => assertRuntimePresetEvents(variant, { ...application, createdActorIds: {} })).toThrow(
    "runtime_preset_event_target_mismatch"
  );
});
