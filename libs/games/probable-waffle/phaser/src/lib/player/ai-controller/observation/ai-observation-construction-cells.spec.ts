import type Phaser from "phaser";
// prettier-ignore
import { createAiTestOwnedActor } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { getActorComponent } from "../../../data/actor-component";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { getTileCoordsUnderObject } from "../../../library/tile-under-object";
import { ColliderComponent } from "../../../entity/components/movement/collider-component";
import { getSceneComponent, getSceneService } from "../../../world/services/scene-component-helpers";
import { permittedAiObservationTopology, projectAiObservationMap } from "./ai-observation-map";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../data/game-object-helper", () => ({ getGameObjectCurrentTile: jest.fn() }));
jest.mock("../../../library/tile-under-object", () => ({ getTileCoordsUnderObject: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({
  getSceneComponent: jest.fn(),
  getSceneService: jest.fn()
}));

it("ignores inactive and foreign-scene children before reading navigation components", () => {
  const scene = { children: { each: (visit: (child: Phaser.GameObjects.GameObject) => void) => {
    visit({ active: false, scene } as unknown as Phaser.GameObjects.GameObject);
    visit({ active: true, scene: {} } as unknown as Phaser.GameObjects.GameObject);
  } } } as unknown as Phaser.Scene;
  jest.mocked(getSceneComponent).mockReturnValue({ tilemap: { width: 8, height: 8 } } as never);
  jest.mocked(getActorComponent).mockReturnValue(undefined);

  const topology = permittedAiObservationTopology(scene, [], new Map());

  expect(topology.blockedTileKeys.size).toBe(0);
  expect(topology.navigableTileKeys.size).toBe(0);
  expect(getActorComponent).not.toHaveBeenCalled();
});

it("ignores a live actor that became inactive or left the scene before topology capture", () => {
  const scene = { children: { each: () => undefined } } as unknown as Phaser.Scene;
  const actor = { active: false, scene } as unknown as Phaser.GameObjects.GameObject;
  jest.mocked(getSceneComponent).mockReturnValue({ tilemap: { width: 8, height: 8 } } as never);
  jest.mocked(getActorComponent).mockReturnValue({ colliderDefinition: { enabled: true } } as never);

  const topology = permittedAiObservationTopology(
    scene,
    [{ actorId: "visible", visibility: "visible" } as never],
    new Map([["visible", actor]])
  );

  expect(topology.blockedTileKeys.size).toBe(0);
  expect(topology.navigableTileKeys.size).toBe(0);
  expect(getGameObjectCurrentTile).not.toHaveBeenCalled();
});

it("uses the already captured position for topology instead of rereading a live scene tile", () => {
  const scene = { children: { each: () => undefined } } as unknown as Phaser.Scene;
  const actor = { active: true, scene } as unknown as Phaser.GameObjects.GameObject;
  jest.mocked(getSceneComponent).mockReturnValue({ tilemap: { width: 8, height: 8 } } as never);
  jest.mocked(getTileCoordsUnderObject).mockReturnValue([]);
  jest.mocked(getActorComponent).mockImplementation((_actor, component) =>
    component === ColliderComponent ? ({ colliderDefinition: { enabled: true } } as never) : undefined
  );

  permittedAiObservationTopology(
    scene,
    [{
      actorId: "visible",
      visibility: "visible",
      logicalPosition: { status: "known", value: { x: 3, y: 5, z: 0 }, observedTick: 20 }
    } as never],
    new Map([["visible", actor]])
  );

  expect(getGameObjectCurrentTile).not.toHaveBeenCalled();
});

it("reports current placement occupancy without blocking travel, while keeping static terrain blocked", () => {
  jest.mocked(getActorComponent).mockReturnValue(undefined);
  jest.mocked(getTileCoordsUnderObject).mockReturnValue([{ x: 4, y: 4 }]);
  jest.mocked(getSceneComponent).mockReturnValue({ tilemap: { width: 8, height: 8 } } as never);
  jest.mocked(getSceneService).mockReturnValue({
    isTileGridWithoutBlockingObjectsNavigable: () => true,
    isTileNavigable: () => true,
    getNavigableHeightAtTile: () => 0
  } as never);
  const actor = {
    ...createAiTestOwnedActor("body"),
    mainBuilding: { status: "known" as const, value: true, observedTick: 0 },
    logicalPosition: { status: "known" as const, value: { x: 4, y: 4, z: 0 }, observedTick: 0 }
  };
  const map = projectAiObservationMap(
    {} as Phaser.Scene,
    1,
    0,
    [actor],
    new Map([["body", {} as Phaser.GameObjects.GameObject]]),
    0,
    undefined,
    { blockedTileKeys: new Set(["7,7"]), navigableTileKeys: new Set() },
    undefined,
    () => "access:region:ground:test" as never
  );
  expect(map.constructionCells?.find((cell) => cell.tileKey === "4,4")).toMatchObject({
    groundPassable: true,
    observedBlocked: true,
    groundAccessNodeId: "access:region:ground:test"
  });
  expect(map.constructionCells?.find((cell) => cell.tileKey === "4,5")).toMatchObject({
    groundPassable: true,
    observedBlocked: false
  });
  expect(map.constructionCells?.find((cell) => cell.tileKey === "7,7")).toMatchObject({
    groundPassable: false,
    observedBlocked: true
  });
});

it("includes producer-sized placement space beyond the original home-anchor window", () => {
  jest.mocked(getActorComponent).mockReturnValue(undefined);
  jest.mocked(getTileCoordsUnderObject).mockReturnValue([]);
  jest.mocked(getSceneComponent).mockReturnValue({ tilemap: { width: 50, height: 50 } } as never);
  jest.mocked(getSceneService).mockReturnValue({
    isTileGridWithoutBlockingObjectsNavigable: () => true,
    isTileNavigable: () => true,
    getNavigableHeightAtTile: () => 0
  } as never);
  const actor = {
    ...createAiTestOwnedActor("main"),
    mainBuilding: { status: "known" as const, value: true, observedTick: 0 },
    logicalPosition: { status: "known" as const, value: { x: 44, y: 5, z: 0 }, observedTick: 0 }
  };
  const crowdedHome = new Set(
    Array.from({ length: 18 * 18 }, (_, index) => `${32 + (index % 18)},${Math.floor(index / 18)}`)
  );
  const map = projectAiObservationMap(
    {} as Phaser.Scene,
    1,
    0,
    [actor],
    new Map([["main", {} as Phaser.GameObjects.GameObject]]),
    0,
    undefined,
    { blockedTileKeys: crowdedHome, navigableTileKeys: new Set() },
    undefined,
    undefined,
    2
  );
  const openHome = projectAiObservationMap(
    {} as Phaser.Scene,
    1,
    0,
    [actor],
    new Map([["main", {} as Phaser.GameObjects.GameObject]]),
    0,
    undefined,
    { blockedTileKeys: new Set(), navigableTileKeys: new Set() },
    undefined,
    undefined,
    2
  );

  expect(map.constructionCells?.some((cell) => cell.tileKey === "24,5" && cell.groundPassable)).toBe(true);
  expect(openHome.constructionCells?.some((cell) => cell.tileKey === "28,5")).toBe(false);
});
