import { FactionType, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type GameProbableWaffleScene from "../../../world/scenes/GameProbableWaffleScene";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { assertAiRuntimePresetRoster } from "./assert-ai-runtime-preset-roster";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { applyAiRuntimePresetWorldV1 } from "./apply-ai-runtime-preset-world-v1";
import type { SceneActorCreator } from "../../../world/services/scene-actor-creator";
import { AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1 } from "./ai-runtime-browser-test-config";
import { IsoHelper } from "../../../world/tilemap/iso-helper";

jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

function fixture(faction = FactionType.Tivara) {
  const tech = new TechTreeService();
  const scene = {
    tilemap: { width: 64, height: 64 },
    players: [{ playerNumber: 2, playerController: { data: { playerDefinition: { factionType: faction } } } }]
  } as unknown as GameProbableWaffleScene;
  const indexed: { name: string }[] = [];
  jest
    .mocked(getSceneService)
    .mockImplementation(
      (_scene, service) =>
        (service === TechTreeService
          ? tech
          : service === ActorIndexSystem
            ? { getOwnedActors: () => indexed }
            : undefined) as never
    );
  const name = faction === FactionType.Tivara ? ObjectNames.TivaraWorkerMale : ObjectNames.SkaduweeWorkerMale;
  const preset: AiRuntimePresetWorldV1 = {
    fixtureId: "faction-production",
    requireFactionRoster: true,
    provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678" },
    actors: [{ fixtureActorId: "worker", actorName: name, owner: 2, position: { x: 640, y: 480, z: 0 } }],
    resourceGrants: []
  };
  return { scene, tech, indexed, preset };
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(IsoHelper, "isometricWorldToTileXY").mockReturnValue({ x: 10, y: 10 });
});
afterEach(() => {
  window.sessionStorage.removeItem(AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1);
  jest.restoreAllMocks();
});

for (const faction of [FactionType.Tivara, FactionType.Skaduwee]) {
  it(`accepts the real ${faction} graph, concrete variants and neutral resources`, () => {
    const f = fixture(faction);
    f.indexed.push({ name: f.tech.getMainBuildingForFaction(faction) });
    expect(() =>
      assertAiRuntimePresetRoster(f.scene, {
        ...f.preset,
        actors: [
          ...f.preset.actors,
          { fixtureActorId: "forest", actorName: ObjectNames.Tree1, owner: null, position: { x: 320, y: 640, z: 0 } }
        ]
      })
    ).not.toThrow();
  });
}

it("rejects foreign authored or inherited actors and queue products using the real faction graph", () => {
  const f = fixture();
  const foreign = ObjectNames.SkaduweeWarriorMale;
  expect(() =>
    assertAiRuntimePresetRoster(f.scene, { ...f.preset, actors: [{ ...f.preset.actors[0]!, actorName: foreign }] })
  ).toThrow("runtime_preset_foreign_faction_actor:worker");
  expect(() =>
    assertAiRuntimePresetRoster(f.scene, {
      ...f.preset,
      queues: [{ producerFixtureActorId: "worker", actorName: foreign, count: 1 }]
    })
  ).toThrow("runtime_preset_foreign_faction_actor:worker");
  f.indexed.push({ name: foreign });
  expect(() => assertAiRuntimePresetRoster(f.scene, f.preset)).toThrow("runtime_preset_foreign_faction_actor:indexed");
});

it("rejects unknown owners, missing services and missing faction definitions", () => {
  const f = fixture();
  expect(() =>
    assertAiRuntimePresetRoster(f.scene, { ...f.preset, actors: [{ ...f.preset.actors[0]!, owner: 99 }] })
  ).toThrow("runtime_preset_foreign_faction_actor");
  jest.mocked(getSceneService).mockReturnValue(undefined);
  expect(() => assertAiRuntimePresetRoster(f.scene, f.preset)).toThrow("runtime_preset_roster_services_missing");
  fixture();
  expect(() =>
    assertAiRuntimePresetRoster(
      {
        ...f.scene,
        players: [{ playerNumber: 2, playerController: { data: {} } }]
      } as unknown as GameProbableWaffleScene,
      f.preset
    )
  ).toThrow("runtime_preset_roster_player_missing");
});

it("keeps special diagnostic worlds opt-in and rechecks the later indexed world", () => {
  const f = fixture();
  assertAiRuntimePresetRoster(f.scene, f.preset);
  f.indexed.push({ name: ObjectNames.Banshee });
  expect(() => assertAiRuntimePresetRoster(f.scene, f.preset)).toThrow("runtime_preset_foreign_faction_actor:indexed");
  expect(() => assertAiRuntimePresetRoster(f.scene, { ...f.preset, requireFactionRoster: undefined })).not.toThrow();
});

it("the public preset application rejects a foreign world before creating actors or applying balances", () => {
  const f = fixture();
  f.indexed.push({ name: ObjectNames.SkaduweeWarriorMale });
  window.sessionStorage.setItem(
    AI_RUNTIME_BROWSER_TEST_CONFIG_KEY_V1,
    JSON.stringify({
      schemaVersion: 1,
      enabled: true,
      seed: 759101,
      startPaused: true,
      presetWorld: f.preset
    })
  );
  const createFinishedActor = jest.fn();
  expect(() => applyAiRuntimePresetWorldV1(f.scene, { createFinishedActor } as unknown as SceneActorCreator)).toThrow(
    "runtime_preset_foreign_faction_actor:indexed"
  );
  expect(createFinishedActor).not.toHaveBeenCalled();
});

it("rejects invalid native tile answers before creating any preset actor", () => {
  const f = fixture();
  for (const tile of [
    { x: 10, y: -1 },
    { x: -1, y: 10 },
    { x: 64, y: 10 },
    { x: 10, y: 64 },
    { x: NaN, y: 10 },
    { x: 10.5, y: 10 }
  ]) {
    jest.mocked(IsoHelper.isometricWorldToTileXY).mockReturnValue(tile);
    expect(() => assertAiRuntimePresetRoster(f.scene, f.preset)).toThrow("runtime_preset_tile_out_of_bounds:worker");
  }
});
