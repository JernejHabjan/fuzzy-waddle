import type Phaser from "phaser";
import { Subject } from "rxjs";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { ConstructionSiteComponent } from "../../../entity/components/construction/construction-site-component";
import type GameProbableWaffleScene from "../../../world/scenes/GameProbableWaffleScene";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { readAiRuntimeBrowserTestConfigV1, recordAiRuntimePresetEventV1 } from "./ai-runtime-browser-test-config";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { installAiRuntimePresetEvents } from "./install-ai-runtime-preset-events";
import { applyAiRuntimePresetWorldV1 } from "./apply-ai-runtime-preset-world-v1";
import type { SceneActorCreator } from "../../../world/services/scene-actor-creator";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("./ai-runtime-browser-test-config", () => ({
  recordAiRuntimePresetEventV1: jest.fn(),
  readAiRuntimeBrowserTestConfigV1: jest.fn(),
  recordAiRuntimePresetApplicationV1: jest.fn()
}));
jest.mock("./install-ai-runtime-production-capture", () => ({ installAiRuntimeProductionCapture: jest.fn() }));

function setup(pinned = true, cancellation = false, finished = false) {
  const tick$ = new Subject<void>();
  const onShutdown = new Subject<void>();
  const ticks = { currentTick: 0, tick$ };
  const scene = {
    onShutdown,
    players: [{ playerNumber: 2 }],
    tilemap: { widthInPixels: 5000, heightInPixels: 5000 }
  } as unknown as GameProbableWaffleScene;
  const actor = (id: string) => {
    const target = {
      scene, active: true, name: ObjectNames.AnkGuard, destroy: jest.fn()
    } as unknown as Phaser.GameObjects.GameObject;
    const health = { healthComponentData: { health: 100, armour: 0 }, takeDamage: jest.fn((amount: number) => {
      if (health.healthComponentData.armour > 0) health.healthComponentData.armour = 0;
      else health.healthComponentData.health = Math.max(0, health.healthComponentData.health - amount);
    }) };
    return { target, health, id };
  };
  const original = actor("z-original"),
    replacement = actor("a-replacement");
  const all = [original, replacement];
  const owned = all.map((entry) => entry.target);
  jest.mocked(getActorComponent).mockImplementation((target, component) => {
    const entry = all.find((entry) => entry.target === target);
    return (
      component === IdComponent ? { id: entry?.id } : component === HealthComponent ? entry?.health :
        component === ConstructionSiteComponent && cancellation ? { isFinished: finished } : undefined
    ) as never;
  });
  jest
    .mocked(getSceneService)
    .mockImplementation(
      (_scene, service) =>
        (service === SimulationTickService
          ? ticks
          : service === ActorIndexSystem
            ? { getOwnedActors: () => owned }
            : undefined) as never
    );
  const preset: AiRuntimePresetWorldV1 = {
    fixtureId: "producer-loss-world",
    provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678" },
    actors: [],
    resourceGrants: [],
    events: [
      {
        id: "producer-loss",
        tick: 100,
        kind: cancellation ? "cancel_unfinished_site" : "destroy_owned_actor",
        owner: 2,
        objectName: ObjectNames.AnkGuard,
        ...(pinned ? { fixtureActorId: "producer" } : {})
      }
    ]
  };
  installAiRuntimePresetEvents(scene, preset, new Map([["producer", original.target]]));
  const advance = (tick: number) => {
    ticks.currentTick = tick;
    tick$.next();
  };
  return { scene, preset, original, replacement, owned, advance, tick$, onShutdown };
}

beforeEach(() => jest.clearAllMocks());

it("cancels only the pinned unfinished site through native teardown, without manufacturing a combat loss", () => {
  const f = setup(true, true);
  f.advance(100);
  f.advance(101);
  expect(f.original.target.destroy).toHaveBeenCalledTimes(1);
  expect(f.original.health.takeDamage).not.toHaveBeenCalled();
  expect(f.replacement.target.destroy).not.toHaveBeenCalled();
  expect(recordAiRuntimePresetEventV1).toHaveBeenCalledWith(expect.objectContaining({
    affectedActors: 1, affectedActorId: "z-original"
  }));
});

it("refuses cancellation of a finished site and requires an explicit original role", () => {
  const f = setup(true, true, true);
  f.advance(100);
  expect(f.original.target.destroy).not.toHaveBeenCalled();
  expect(recordAiRuntimePresetEventV1).toHaveBeenCalledWith(expect.objectContaining({ affectedActors: 0 }));
  expect(() => setup(false, true)).toThrow("runtime_preset_cancellation_requires_original_role");
});

it("damages the pinned original once, even when a replacement sorts first", () => {
  const f = setup();
  f.advance(99);
  expect(f.original.health.takeDamage).not.toHaveBeenCalled();
  f.advance(100);
  f.advance(101);
  expect(f.original.health.takeDamage).toHaveBeenCalledTimes(1);
  expect(f.replacement.health.takeDamage).not.toHaveBeenCalled();
  expect(recordAiRuntimePresetEventV1).toHaveBeenCalledWith({
    id: "producer-loss",
    tick: 100,
    subjectName: "AnkGuard",
    affectedActors: 1,
    affectedActorId: "z-original"
  });
  expect(f.tick$.observed).toBe(false);
  expect(f.onShutdown.observed).toBe(false);
});

it("the public preset caller wires pinned loss to the actor it actually created", () => {
  const f = setup();
  f.onShutdown.next();
  const preset = {
    ...f.preset,
    actors: [
      { fixtureActorId: "producer", actorName: ObjectNames.AnkGuard, owner: 2, position: { x: 800, y: 848, z: 0 } }
    ]
  };
  jest
    .mocked(readAiRuntimeBrowserTestConfigV1)
    .mockReturnValue({ schemaVersion: 1, enabled: true, seed: 759101, startPaused: true, presetWorld: preset });
  const creator = { createFinishedActor: jest.fn(() => f.original.target) } as unknown as SceneActorCreator;
  applyAiRuntimePresetWorldV1(f.scene, creator);
  f.advance(100);
  expect(f.original.health.takeDamage).toHaveBeenCalledTimes(1);
  expect(f.replacement.health.takeDamage).not.toHaveBeenCalled();
});

it("a pinned loss consumes native armour before health without touching a replacement", () => {
  const f = setup();
  f.original.health.healthComponentData.armour = 50;
  f.advance(100);
  expect(f.original.health.takeDamage).toHaveBeenCalledTimes(2);
  expect(f.original.health.healthComponentData).toEqual({ health: 0, armour: 0 });
  expect(f.replacement.health.takeDamage).not.toHaveBeenCalled();
});

it("does not substitute another producer when the original has disappeared", () => {
  const f = setup();
  f.owned.splice(0, 1);
  f.advance(100);
  expect(f.original.health.takeDamage).not.toHaveBeenCalled();
  expect(f.replacement.health.takeDamage).not.toHaveBeenCalled();
  expect(recordAiRuntimePresetEventV1).toHaveBeenCalledWith(
    expect.objectContaining({ affectedActors: 0, affectedActorId: null })
  );
});

it("refuses inactive, dead or cross-scene originals", () => {
  for (const invalid of ["inactive", "dead", "cross-scene"]) {
    const f = setup();
    if (invalid === "inactive") f.original.target.active = false;
    if (invalid === "dead") f.original.health.healthComponentData.health = 0;
    if (invalid === "cross-scene") f.original.target.scene = {} as Phaser.Scene;
    f.advance(100);
    expect(f.original.health.takeDamage).not.toHaveBeenCalled();
    expect(f.replacement.health.takeDamage).not.toHaveBeenCalled();
  }
});

it("preserves deterministic name selection for legacy unpinned events", () => {
  const f = setup(false);
  f.advance(100);
  expect(f.original.health.takeDamage).not.toHaveBeenCalled();
  expect(f.replacement.health.takeDamage).toHaveBeenCalledTimes(1);
});

it("releases a pending event subscription on scene shutdown", () => {
  const f = setup();
  f.onShutdown.next();
  f.advance(100);
  expect(f.tick$.observed).toBe(false);
  expect(f.original.health.takeDamage).not.toHaveBeenCalled();
  expect(recordAiRuntimePresetEventV1).not.toHaveBeenCalled();
});
