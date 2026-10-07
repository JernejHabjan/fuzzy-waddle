import { MovementFormation } from "./movement-formation";
import { FlyingComponent } from "../components/movement/flying-component";
import { getActorComponent } from "../../data/actor-component";
import { movementTestFixture } from "./movement-test-fixture";

jest.mock("../../data/actor-component", () => ({ getActorComponent: jest.fn() }));
jest.mock("../../world/services/scene-component-helpers", () => ({ getSceneComponent: jest.fn(), getSceneService: jest.fn() }));
jest.mock("../../data/game-object-helper", () => ({
  getGameObjectCurrentTile: jest.fn(), isGameObjectActiveInActiveScene: jest.fn(), isSceneActive: jest.fn()
}));

describe("native formation selection extraction (unrun until final gate)", () => {
  beforeEach(() => jest.clearAllMocks());
  afterEach(() => jest.restoreAllMocks());

  it("keeps single actors and flying groups on the original tile reference without probing", async () => {
    const f = movementTestFixture(), formation = new MovementFormation(f.runtime), tile = { x: 0, y: 0, z: 0 };
    expect(await formation.getTileVec3ByDynamicFlocking(tile, ["actor:1"])).toBe(tile);
    const lookup = jest.mocked(getActorComponent).getMockImplementation();
    jest.mocked(getActorComponent).mockImplementation((actor, component) => component === FlyingComponent
      ? {} as never : lookup?.(actor, component));
    expect(await formation.getTileVec3ByDynamicFlocking(tile, ["actor:1", "actor:2"])).toBe(tile);
    expect(f.navigation.getConnectedNavigableTiles).not.toHaveBeenCalled();
    expect(f.occupancy.reserveDestination).not.toHaveBeenCalled();
  });

  it("prefers same-height slots, ignores destination blockers and tries another slot after a reservation conflict", async () => {
    const f = movementTestFixture(), formation = new MovementFormation(f.runtime), tile = { x: 0, y: 0, z: 0 };
    f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers.mockResolvedValue([{ x: 0, y: 0 }]);
    f.occupancy.reserveDestination.mockReturnValueOnce(false).mockReturnValueOnce(true);
    expect(await formation.getTileVec3ByDynamicFlocking(tile, ["actor:2", "actor:1"])).toEqual({ x: 1, y: 0, z: 0 });
    expect(f.navigation.getConnectedNavigableTiles).toHaveBeenCalledWith({ x: 0, y: 0 },
      { sameHeightOnly: true, maxTiles: 96 });
    expect(f.navigation.getConnectedNavigableTiles).toHaveBeenCalledTimes(1);
    expect(f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers.mock.calls.map((call) => call[1]))
      .toEqual([{ x: 0, y: 0 }, { x: 1, y: 0 }]);
    expect(f.occupancy.getDynamicBlockersForActor).toHaveBeenCalledWith("actor:1", { includeDestinationReservations: false });
    expect(f.occupancy.reserveDestination).toHaveBeenCalledTimes(2);
  });

  it("preserves the lexicographic ID slot assignment and no-path fallback", async () => {
    const f = movementTestFixture(), formation = new MovementFormation(f.runtime), tile = { x: 0, y: 0, z: 0 };
    f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers.mockResolvedValue([{ x: 0, y: 0 }]);
    expect(await formation.getTileVec3ByDynamicFlocking(tile, ["actor:0", "actor:1"])).toEqual({ x: 1, y: 0, z: 0 });
    f.navigation.findPathFromGameObjectToTileAvoidingDynamicBlockers.mockResolvedValue(null);
    expect(await formation.getTileVec3ByDynamicFlocking(tile, ["actor:0", "actor:1"])).toBe(tile);
    expect(f.occupancy.reserveDestination).toHaveBeenCalledTimes(1);
  });
});
