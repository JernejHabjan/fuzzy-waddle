import Phaser from "phaser";
import { DamageType, ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import type { AttackData } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/attack-data";
import { WeaponType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/weapon-type";
import { HIGH_GROUND_THRESHOLD } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/high-ground-constants";
import {
  createAiTestObservation,
  requireAiTestEntry
} from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { getActorComponent } from "../../data/actor-component";
import { getGameObjectCurrentTile, getGameObjectLogicalTransform } from "../../data/game-object-helper";
import { OwnerComponent } from "../../entity/components/owner-component";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { RepresentableComponent } from "../../entity/components/representable-component";
import { ProductionComponent } from "../../entity/components/production/production-component";
import { DistanceHelper } from "../../library/distance-helper";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { AiObservationVisibilityPolicy } from "./observation/ai-observation-visibility-policy";
import { captureAiProducerExposure } from "./capture-ai-producer-exposure";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../data/game-object-helper", () => ({
  getGameObjectCurrentTile: jest.fn(),
  getGameObjectLogicalTransform: jest.fn()
}));
jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));

/** Uses real attack choice/range and high-ground methods behind synthetic index/visibility/position authority. */
function fixture() {
  const scene = {} as Phaser.Scene;
  const producer = { scene, active: true, name: ObjectNames.Sandhold } as Phaser.GameObjects.GameObject;
  const enemy = { scene, active: true, name: ObjectNames.AnkGuard } as Phaser.GameObjects.GameObject;
  const attack = {
    cooldown: 250,
    damage: 3,
    damageType: DamageType.Physical,
    canTargetAir: false,
    range: 3,
    minRange: 2,
    highGroundRangeBonus: 1,
    animationType: "attack",
    weaponType: WeaponType.TivaraMace,
    sounds: { preparing: null, fire: null, hit: null },
    delays: { fire: 0, hit: 0 }
  } satisfies AttackData;
  const attacks = [attack, { ...attack, range: 8 }];
  const component = Object.create(AttackComponent.prototype) as AttackComponent;
  Reflect.set(component, "gameObject", enemy);
  Reflect.set(component, "attackDefinition", { attacks });
  const choose = jest.spyOn(component, "getAttack");
  const mayObserve = jest.spyOn(AiObservationVisibilityPolicy.prototype, "mayObserve").mockReturnValue(true);
  const distance = jest.spyOn(DistanceHelper, "getTileDistanceBetweenGameObjects").mockReturnValue(4);
  const elevation = { enemy: HIGH_GROUND_THRESHOLD, producer: 0 };
  jest.mocked(getActorComponent).mockImplementation((actor, owner) => {
    if (owner === IdComponent) return { id: actor === producer ? "producer" : "enemy" } as never;
    if (owner === OwnerComponent) return { getOwner: () => (actor === producer ? 1 : 2) } as never;
    if (owner === AttackComponent && actor === enemy) return component as never;
    if (owner === ProductionComponent && actor === producer) return {} as never;
    if (owner === RepresentableComponent)
      return {
        logicalWorldTransform: { z: 0 },
        getActualLogicalZ: () => (actor === producer ? elevation.producer : elevation.enemy)
      } as never;
    return undefined;
  });
  jest
    .mocked(getSceneService)
    .mockImplementation((_scene, service) =>
      service === ActorIndexSystem
        ? ({ getActorById: (id: string) => (id === "producer" ? producer : enemy) } as never)
        : undefined
    );
  jest.mocked(getGameObjectCurrentTile).mockReturnValue({ x: 4, y: 5 });
  jest.mocked(getGameObjectLogicalTransform).mockReturnValue({ x: 0, y: 0, z: 0 });
  const base = createAiTestObservation();
  const source = requireAiTestEntry(base.actors, 0);
  if (!source) throw new Error("synthetic_actor_missing");
  const known = <T>(value: T) => ({ status: "known" as const, value, observedTick: 20 });
  const owned = {
    ...source,
    actorId: "producer",
    objectName: ObjectNames.Sandhold,
    owner: 1,
    relation: "self" as const,
    visibility: "owned" as const,
    observedTick: 20,
    logicalPosition: known({ x: 4, y: 5, z: 0 }),
    queue: known({ capacity: 1, occupied: 0, itemIds: [] })
  };
  const threat = {
    ...owned,
    actorId: "enemy",
    objectName: ObjectNames.AnkGuard,
    owner: 2,
    relation: "enemy" as const,
    visibility: "visible" as const,
    combatProfile: known({
      maxHealth: 10,
      maxArmour: 0,
      armourPermille: 0,
      passiveRegenerationPerSecond: 0,
      healing: null,
      spells: [],
      statuses: [],
      attacks: attacks.map((weapon) => ({
        damage: weapon.damage,
        range: weapon.range,
        minRange: weapon.minRange,
        highGroundRangeBonus: 1,
        cooldownTicks: 5,
        impactDelayTicks: 0,
        areaRadius: 0,
        targetDomains: ["ground", "water"] as const
      }))
    })
  };
  const observation = { ...base, tick: 20, playerNumber: 1, actors: [owned, threat] };
  return { scene, observation, component, choose, mayObserve, distance, elevation, attacks, attack };
}

describe("current producer target exposure", () => {
  afterEach(() => jest.restoreAllMocks());
  it("retains real equal-damage attack choice separately from positioning range and minimum-range band", () => {
    const f = fixture();
    expect(requireAiTestEntry(captureAiProducerExposure(f.scene, f.observation, 20, false).pairs, 0)).toMatchObject({
      status: "known",
      attackIndex: 0,
      range: 4,
      positioningRange: 9,
      highGroundBonus: 1,
      withinSelectedWeaponBand: true
    });
    f.distance.mockReturnValue(1);
    expect(
      requireAiTestEntry(captureAiProducerExposure(f.scene, f.observation, 20, false).pairs, 0)
        ?.withinSelectedWeaponBand
    ).toBe(false);
    f.elevation.enemy = HIGH_GROUND_THRESHOLD - 1;
    expect(requireAiTestEntry(captureAiProducerExposure(f.scene, f.observation, 20, false).pairs, 0)).toMatchObject({
      range: 3,
      highGroundBonus: 0
    });
  });
  it("never reads target weapons for stale/restored or currently hidden consumed contacts", () => {
    const f = fixture();
    expect(captureAiProducerExposure(f.scene, f.observation, 21, false).pairs).toEqual([]);
    expect(captureAiProducerExposure(f.scene, f.observation, 20, true).pairs).toEqual([]);
    f.mayObserve.mockReturnValue(false);
    expect(requireAiTestEntry(captureAiProducerExposure(f.scene, f.observation, 20, false).pairs, 0)?.status).toBe(
      "unavailable"
    );
    expect(f.choose).not.toHaveBeenCalled();
  });
  it("requires exact consumed weapon and tile binding instead of repairing it from live state", () => {
    const f = fixture();
    jest.mocked(getGameObjectCurrentTile).mockReturnValue({ x: 99, y: 5 });
    expect(requireAiTestEntry(captureAiProducerExposure(f.scene, f.observation, 20, false).pairs, 0)?.status).toBe(
      "unavailable"
    );
    expect(f.choose).not.toHaveBeenCalled();
    jest.mocked(getGameObjectCurrentTile).mockReturnValue({ x: 4, y: 5 });
    f.attack.range = 99;
    expect(requireAiTestEntry(captureAiProducerExposure(f.scene, f.observation, 20, false).pairs, 0)?.status).toBe(
      "unavailable"
    );
    expect(f.choose).not.toHaveBeenCalled();
  });
});
