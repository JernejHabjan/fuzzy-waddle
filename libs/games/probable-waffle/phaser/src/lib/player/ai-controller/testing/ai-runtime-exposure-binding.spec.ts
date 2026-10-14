import type Phaser from "phaser";
import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  createAiTestObservation,
  createAiTestOwnedActor
} from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile, getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { AttackComponent } from "../../../entity/components/combat/components/attack-component";
import { AiObservationVisibilityPolicy } from "../observation/ai-observation-visibility-policy";
import { captureAiRuntimeCreatedActor } from "./capture-ai-runtime-created-actor";
import { unspentClaimFixture } from "./ai-runtime-unspent-claim-fixtures";
import { AiRuntimeExposureBinding } from "./ai-runtime-exposure-binding";
import { DistanceHelper } from "../../../library/distance-helper";
import { RepresentableComponent } from "../../../entity/components/representable-component";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({
  getGameObjectCurrentTile: jest.fn(),
  getGameObjectLogicalTransform: jest.fn()
}));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("./capture-ai-runtime-created-actor", () => ({ captureAiRuntimeCreatedActor: jest.fn() }));

/** Synthetic binding lifetimes only. Native weapon selection is independently exercised by the existing capture controls. */
function fixture(armed = false) {
  const scene = {} as ProbableWaffleScene;
  const ids = ["original", "replacement", "enemy"];
  const actors = ids.map(() => ({ scene }) as unknown as Phaser.GameObjects.GameObject);
  const indexed = new Map(ids.map((id, index) => [id, actors[index]]));
  const position = { x: 4, y: 5, z: 0 };
  const threatPosition = { ...position };
  const distance = jest.spyOn(DistanceHelper, "getTileDistanceBetweenGameObjects").mockReturnValue(12);
  const visible = jest.spyOn(AiObservationVisibilityPolicy.prototype, "mayObserve").mockReturnValue(true);
  jest.mocked(getSceneService).mockReturnValue({ getActorById: (id: string) => indexed.get(id) } as never);
  jest.mocked(getGameObjectCurrentTile).mockReturnValue({ x: 4, y: 5 });
  jest
    .mocked(getGameObjectLogicalTransform)
    .mockImplementation((actor) => (actor === actors[2] ? threatPosition : position));
  const weapon = { damage: 10, range: 5, minRange: 0, highGroundRangeBonus: 0 };
  jest
    .mocked(getActorComponent)
    .mockImplementation((_actor, type) =>
      type === RepresentableComponent
        ? ({ logicalWorldTransform: position, getActualLogicalZ: () => position.z } as never)
        : type === AttackComponent
          ? ({ getAttacks: () => (armed ? [weapon] : []), getAttack: () => (armed ? weapon : null) } as never)
          : undefined
    );
  jest.mocked(captureAiRuntimeCreatedActor).mockImplementation((actor) => ({
    actorId: ids[actors.indexOf(actor)] ?? null,
    objectName: ObjectNames.AnkGuard,
    canonicalObjectName: ObjectNames.AnkGuard,
    playerNumber: actor === actors[2] ? 3 : 2,
    active: true,
    alive: true,
    indexed: true,
    finished: true
  }));
  const base = unspentClaimFixture().decision;
  const owned = ids.slice(0, 2).map((id) => ({
    ...createAiTestOwnedActor(id),
    owner: 2,
    queue: { status: "known" as const, value: { capacity: 1, occupied: 0, itemIds: [] }, observedTick: 100 }
  }));
  const observation = {
    ...createAiTestObservation(),
    playerNumber: 2,
    tick: 100,
    generation: 7,
    actors: [
      ...owned,
      { ...createAiTestOwnedActor("enemy"), relation: "enemy" as const, visibility: "visible" as const }
    ]
  };
  const input = {
    observation,
    capabilityCatalog: null,
    accessGraph: null,
    cadence: {
      clock: "simulation" as const,
      tick: 100,
      configuredIntervalTicks: 5,
      completedBefore: 0
    },
    snapshotRestoreInProgress: false,
    gaps: [],
    producerExposure: {
      tick: 100,
      generation: 7,
      gaps: [],
      pairs: owned.map((actor) => ({
        producerActorId: actor.actorId,
        threatActorId: "enemy",
        status: armed ? ("known" as const) : ("no_attack" as const),
        attackIndex: armed ? 0 : null,
        range: armed ? 5 : null,
        positioningRange: armed ? 5 : null,
        highGroundBonus: armed ? 0 : null,
        attackerElevation: armed ? 0 : null,
        targetElevation: armed ? 0 : null,
        distanceTiles: armed ? 12 : null,
        withinSelectedWeaponBand: armed ? false : null
      }))
    }
  };
  const binding = new AiRuntimeExposureBinding(scene, 2, {
    sequence: 1,
    tick: 100,
    playerNumber: 2,
    kind: "decision_selected",
    decision: { ...base, input }
  });
  return { binding, indexed, visible, distance, threatPosition, weapon };
}

afterEach(() => jest.restoreAllMocks());

it("loss of the original producer preserves the separately bound replacement", () => {
  const { binding, indexed } = fixture();
  expect(binding.read().validProducerIds).toEqual(["original", "replacement"]);
  indexed.delete("original");
  binding.invalidate("original");
  expect(binding.read().validProducerIds).toEqual(["replacement"]);
});

it("a lost fair threat invalidates every target and cannot be repaired by visibility returning alone", () => {
  const { binding, visible } = fixture();
  visible.mockReturnValue(false);
  expect(binding.read().validProducerIds).toEqual([]);
  visible.mockReturnValue(true);
  expect(binding.read().validProducerIds).toEqual([]);
});

it("retains measured safety while a visible threat moves outside the selected weapon band", () => {
  const f = fixture(true);
  f.threatPosition.x += 10;
  f.distance.mockReturnValue(7);
  expect(f.binding.read().validProducerIds).toEqual(["original", "replacement"]);
});

it("invalidates a band crossing even if the threat later moves back out", () => {
  const f = fixture(true);
  f.distance.mockReturnValue(5);
  expect(f.binding.read().validProducerIds).toEqual([]);
  f.distance.mockReturnValue(12);
  expect(f.binding.read().validProducerIds).toEqual([]);
});

it("rejects changed weapons and unavailable native geometry", () => {
  const f = fixture(true);
  f.weapon.range = 6;
  expect(f.binding.read().validProducerIds).toEqual([]);
  const g = fixture(true);
  g.distance.mockReturnValue(null);
  expect(g.binding.read().validProducerIds).toEqual([]);
});

it("rejects missing representation instead of accepting a zero-elevation fallback", () => {
  const f = fixture();
  jest.mocked(getActorComponent).mockReturnValue(undefined);
  expect(f.binding.read().validProducerIds).toEqual([]);
});
