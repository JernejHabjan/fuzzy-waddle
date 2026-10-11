import Phaser from "phaser";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorSystem } from "../../../data/actor-system";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectBounds, getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { IsoHelper } from "../../../world/tilemap/iso-helper";
import { PRODUCTION_SPATIAL_AUTHORITY_EVENT, type ProductionSpatialAuthorityEvent } from
  "../../../world/services/multiplayer/production-spatial-authority-event";
import { productionCaptureItem } from "../../../player/ai-controller/testing/ai-runtime-production-capture-fixtures";
import { spawnProductionActor } from "./production-spawner";

jest.mock("../../../data/actor-system", () => ({ getActorSystem: jest.fn() }));
jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ getGameObjectBounds: jest.fn(), getGameObjectLogicalTransform: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({ getSceneService: jest.fn() }));
jest.mock("../../../prefabs/definitions/actor-definitions", () => ({ getPwActorDefinition: jest.fn() }));

describe("native production spawn choice", () => {
  afterEach(() => jest.restoreAllMocks());
  it("retains ground/water native choices before creation without adding queries or claiming a complete route", async () => {
    for (const water of [false, true]) {
      const events = new Phaser.Events.EventEmitter();
      const actor = { scene: { events }, active: true } as unknown as Phaser.GameObjects.GameObject;
      const records: ProductionSpatialAuthorityEvent[] = [];
      events.on(PRODUCTION_SPATIAL_AUTHORITY_EVENT, (event: ProductionSpatialAuthorityEvent) => records.push(event));
      jest.mocked(getGameObjectLogicalTransform).mockReturnValue({ x: 0, y: 0, z: 64 });
      jest.mocked(getGameObjectBounds).mockReturnValue({ width: 10, height: 20 } as never);
      jest.mocked(getActorComponent).mockReturnValue(undefined);
      jest.mocked(getPwActorDefinition).mockReturnValue({ components: { translatable: {
        movementTerrainType: water ? MovementTerrainType.Water : MovementTerrainType.Ground } } } as never);
      jest.spyOn(IsoHelper, "isometricTileToWorldXY").mockReturnValue({ x: 100, y: 200 });
      const create = jest.fn(() => undefined);
      jest.mocked(getSceneService).mockReturnValue({ createFinishedActor: create } as never);
      const tile = { x: 4, y: 5 };
      const navigation = { getCenterTileCoordUnderObject: jest.fn(() => tile), findNearestWaterTile: jest.fn(() => tile),
        getSpawnPointAroundGameObject: jest.fn(() => tile) };
      const item = { ...productionCaptureItem(), remainingTime: 0 };
      const rally = { isSet: () => false };
      if (!item.productionData) throw new Error("synthetic_production_missing");
      await spawnProductionActor(actor, item.productionData, rally as never, navigation as never, undefined, item);
      expect(records[0]).toMatchObject({ kind: "spawn", waterUnit: water, tile, position: { x: 100, y: 200, z: 64 } });
      expect(water ? navigation.findNearestWaterTile : navigation.getSpawnPointAroundGameObject).toHaveBeenCalledTimes(1);
      expect(create).toHaveBeenCalledTimes(1);
    }
  });
});

describe("native produced-object rally branch observation", () => {
  afterEach(() => jest.restoreAllMocks());
  for (const mode of ["unset", "movement_fallback", "actor_action", "tile_action", "no_target"] as const) {
    it(`records ${mode} before its native invocation, without additional selection reads`, async () => {
      const events = new Phaser.Events.EventEmitter();
      const scene = { events };
      const producer = { scene, active: true } as unknown as Phaser.GameObjects.GameObject;
      const product = { scene, active: true } as unknown as Phaser.GameObjects.GameObject;
      const target = { scene, active: true } as unknown as Phaser.GameObjects.GameObject;
      const records: ProductionSpatialAuthorityEvent[] = [];
      events.on(PRODUCTION_SPATIAL_AUTHORITY_EVENT, (event: ProductionSpatialAuthorityEvent) => records.push(event));
      jest.mocked(getGameObjectLogicalTransform).mockReturnValue({ x: 0, y: 0, z: 0 });
      jest.mocked(getGameObjectBounds).mockReturnValue({ width: 10, height: 20 } as never);
      jest.mocked(getPwActorDefinition).mockReturnValue({ components: {} } as never);
      jest.spyOn(IsoHelper, "isometricTileToWorldXY").mockReturnValue({ x: 100, y: 200 });
      jest.mocked(getActorComponent).mockImplementation((actor, component) =>
        component === IdComponent && actor === product ? { id: "actual-product" } as never : undefined);
      const create = jest.fn(() => product);
      jest.mocked(getSceneService).mockReturnValue({ createFinishedActor: create } as never);
      const assertObserved = () => expect(records[1]).toMatchObject({ kind: "output", producer, product, rallyMode: mode });
      const action = jest.fn(assertObserved);
      jest.mocked(getActorSystem).mockReturnValue(mode === "movement_fallback" ? undefined : { executeAction: action } as never);
      const rallyTile = { x: 8, y: 9, z: 0 };
      const rally = { isSet: jest.fn(() => mode !== "unset"),
        getTargetTileVec3: jest.fn(() => mode === "tile_action" ? rallyTile : undefined),
        getTargetGameObject: jest.fn(() => mode === "actor_action" ? target : undefined),
        navigateGameObjectToRallyPoint: jest.fn(assertObserved) };
      const navigation = { getSpawnPointAroundGameObject: jest.fn(() => ({ x: 3, y: 4 })) };
      const item = { ...productionCaptureItem(), remainingTime: 0 };
      if (!item.productionData) throw new Error("synthetic_production_missing");
      expect(await spawnProductionActor(producer, item.productionData, rally as never, navigation as never, undefined, item))
        .toBe("actual-product");
      assertObserved();
      expect(create).toHaveBeenCalledTimes(1); expect(navigation.getSpawnPointAroundGameObject).toHaveBeenCalledTimes(1);
      expect(rally.isSet).toHaveBeenCalledTimes(2);
      expect(rally.getTargetGameObject).toHaveBeenCalledTimes(mode === "unset" || mode === "movement_fallback" ? 0 : 1);
      expect(rally.getTargetTileVec3).toHaveBeenCalledTimes(mode === "unset" ? 0 :
        mode === "tile_action" || mode === "no_target" ? 2 : 1);
      expect(action).toHaveBeenCalledTimes(mode === "actor_action" || mode === "tile_action" ? 1 : 0);
      expect(rally.navigateGameObjectToRallyPoint).toHaveBeenCalledTimes(mode === "movement_fallback" ? 1 : 0);
    });
  }
});
