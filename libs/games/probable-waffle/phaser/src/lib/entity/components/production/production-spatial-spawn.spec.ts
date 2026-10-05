import Phaser from "phaser";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectBounds, getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { IsoHelper } from "../../../world/tilemap/iso-helper";
import { PRODUCTION_SPATIAL_AUTHORITY_EVENT, type ProductionSpatialAuthorityEvent } from
  "../../../world/services/multiplayer/production-spatial-authority-event";
import { productionCaptureItem } from "../../../player/ai-controller/testing/ai-runtime-production-capture-fixtures";
import { spawnProductionActor } from "./production-spawner";

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
