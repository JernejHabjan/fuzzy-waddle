import type Phaser from "phaser";
// prettier-ignore
import { createAiTestOwnedActor } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { getActorComponent } from "../../../data/actor-component";
import { getTileCoordsUnderObject } from "../../../library/tile-under-object";
import { getSceneComponent, getSceneService } from "../../../world/services/scene-component-helpers";
import { projectAiObservationMap } from "./ai-observation-map";

jest.mock("../../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../../library/tile-under-object", () => ({ getTileCoordsUnderObject: jest.fn() }));
jest.mock("../../../world/services/scene-component-helpers", () => ({
  getSceneComponent: jest.fn(),
  getSceneService: jest.fn()
}));

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
    { blockedTileKeys: new Set(["7,7"]), navigableTileKeys: new Set() }
  );
  expect(map.constructionCells?.find((cell) => cell.tileKey === "4,4")).toMatchObject({
    groundPassable: true,
    observedBlocked: true
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
