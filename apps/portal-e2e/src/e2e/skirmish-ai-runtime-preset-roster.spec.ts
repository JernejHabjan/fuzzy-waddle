import { expect, test } from "@playwright/test";
// prettier-ignore
import type { AiRuntimePresetApplicationV1 } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-preset-application-v1";
import type { RuntimePresetWorldV1 } from "./skirmish-ai-runtime-preset-world";
import { assertRuntimePresetRoster } from "./skirmish-ai-runtime-preset-roster";

function fixture() {
  const preset: RuntimePresetWorldV1 = {
    fixtureId: "legal-world",
    requireFactionRoster: true,
    resourceGrants: [],
    actors: ["worker-a", "worker-b"].map((fixtureActorId) => ({
      fixtureActorId,
      actorName: "TivaraWorkerMale",
      owner: 2,
      position: { x: 640, y: 480, z: 0 }
    }))
  };
  const application: AiRuntimePresetApplicationV1 = {
    fixtureId: preset.fixtureId,
    sourceRevision: "a".repeat(40),
    fixtureDigest: "fnv1a32:12345678",
    createdActorNames: ["TivaraWorkerMale", "TivaraWorkerMale"],
    createdActorIds: { "worker-a": "id-a", "worker-b": "id-b" },
    resourceGrantCount: 0,
    resourceStartCount: 0,
    queuedItemCount: 0,
    initialQueueItems: [],
    queueApplications: [],
    initialOrderCount: 0,
    eventResults: []
  };
  const initial = { ownedActorCount: 3, ownedActorNames: ["Sandhold", "TivaraWorkerMale", "TivaraWorkerMale"] };
  return { preset, application, initial };
}

test("strict roster retains multiplicity and permits ordinary inherited faction actors", () => {
  const f = fixture();
  expect(() => assertRuntimePresetRoster(f.preset, f.application, 2, f.initial)).not.toThrow();
});

for (const damage of ["missing", "extra", "duplicate", "empty", "name", "multiplicity"] as const) {
  test(`strict roster rejects ${damage} created evidence`, () => {
    const f = fixture();
    const ids = { ...f.application.createdActorIds };
    let names = [...f.application.createdActorNames];
    if (damage === "missing") delete ids["worker-b"];
    if (damage === "extra") ids["unexpected"] = "id-c";
    if (damage === "duplicate") ids["worker-b"] = "id-a";
    if (damage === "empty") ids["worker-b"] = "";
    if (damage === "name") names = ["TivaraWorkerMale", "SkaduweeWorkerMale"];
    if (damage === "multiplicity") names.pop();
    expect(() =>
      assertRuntimePresetRoster(
        f.preset,
        { ...f.application, createdActorIds: ids, createdActorNames: names },
        2,
        f.initial
      )
    ).toThrow("runtime_preset_created_roster_mismatch");
  });
}

test("strict roster rejects missing owned copies and inconsistent native counts", () => {
  const f = fixture();
  expect(() =>
    assertRuntimePresetRoster(f.preset, f.application, 2, {
      ownedActorCount: 2,
      ownedActorNames: ["Sandhold", "TivaraWorkerMale"]
    })
  ).toThrow("runtime_preset_owned_actor_missing:TivaraWorkerMale");
  expect(() => assertRuntimePresetRoster(f.preset, f.application, 2, { ...f.initial, ownedActorCount: 4 })).toThrow(
    "runtime_preset_owned_roster_count_mismatch"
  );
  expect(() =>
    assertRuntimePresetRoster({ ...f.preset, requireFactionRoster: undefined }, f.application, 2, {
      ownedActorCount: 0,
      ownedActorNames: []
    })
  ).not.toThrow();
});
