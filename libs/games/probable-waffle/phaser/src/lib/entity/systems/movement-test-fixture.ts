import type Phaser from "phaser";
import type { ActorId, Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../data/actor-component";
import { getSceneComponent, getSceneService } from "../../world/services/scene-component-helpers";
import { NavigationService } from "../../world/services/navigation.service";
import { MovementOccupancyService, type MovementDynamicBlocker } from "../../world/services/movement-occupancy.service";
import { getGameObjectCurrentTile, isGameObjectActiveInActiveScene, isSceneActive } from "../../data/game-object-helper";
import { MovementRuntime } from "./movement-runtime";

/** Shared native-boundary double. It supplies no map, pathfinder, order authority or useful-effect evidence. */
export function movementTestFixture() {
  const events = { on: jest.fn(), once: jest.fn(), off: jest.fn() };
  const delayedCall = jest.fn((_delay: number, callback: () => void) => { callback(); });
  const scene = { events, time: { delayedCall } } as unknown as Phaser.Scene;
  const actor = { scene, once: jest.fn() } as unknown as Phaser.GameObjects.GameObject;
  const navigation = {
    getTileWorldCenter: jest.fn((tile: Vector2Simple): Vector2Simple | undefined => ({ x: tile.x, y: tile.y })),
    getNavigableHeightAtTile: jest.fn((_tile: Vector2Simple) => 0),
    findPathFromGameObjectToTile: jest.fn(async (): Promise<Vector2Simple[] | null> => null),
    findAndUseNavigablePathBetweenGameObjectsWithRadius: jest.fn(async (): Promise<Vector2Simple[] | null> => null),
    findPathFromGameObjectToTileAvoidingDynamicBlockers: jest.fn(async (
      _actor: Phaser.GameObjects.GameObject, _tile: Vector2Simple, _blockers: MovementDynamicBlocker[]
    ): Promise<Vector2Simple[] | null> => null),
    getConnectedNavigableTiles: jest.fn((_tile: Vector2Simple, _options: { sameHeightOnly?: boolean; maxTiles?: number } = {}) =>
      [{ x: 0, y: 0 }, { x: 1, y: 0 }]),
    isWithinGridBounds: jest.fn(() => false),
    isTileNavigable: jest.fn(() => true),
    canTraverseBetweenTiles: jest.fn(() => true),
    getClosestUnoccupiedTile: jest.fn(async () => undefined),
    drawDebugPath: jest.fn()
  } satisfies Pick<NavigationService, "getTileWorldCenter" | "getNavigableHeightAtTile" | "findPathFromGameObjectToTile" |
    "findAndUseNavigablePathBetweenGameObjectsWithRadius" | "findPathFromGameObjectToTileAvoidingDynamicBlockers" |
    "getConnectedNavigableTiles" | "isWithinGridBounds" | "isTileNavigable" | "canTraverseBetweenTiles" |
    "getClosestUnoccupiedTile" | "drawDebugPath">;
  const occupancy = {
    releaseStep: jest.fn(), releaseDestination: jest.fn(), releaseAll: jest.fn(),
    getActorFootprintAtTile: jest.fn((_actor: Phaser.GameObjects.GameObject, tile: Vector2Simple) => [tile]),
    tryReserveStep: jest.fn((): { reserved: boolean; blockers: ActorId[] } => ({ reserved: true, blockers: [] })),
    hasAnyActiveStepReservation: jest.fn(() => true),
    getDynamicBlockersForActor: jest.fn((): MovementDynamicBlocker[] => []),
    isFootprintFree: jest.fn(() => true), reserveDestination: jest.fn(() => true)
  } satisfies Pick<MovementOccupancyService, "releaseStep" | "releaseDestination" | "releaseAll" |
    "getActorFootprintAtTile" | "tryReserveStep" | "hasAnyActiveStepReservation" | "getDynamicBlockersForActor" |
    "isFootprintFree" | "reserveDestination">;
  jest.mocked(getActorComponent).mockImplementation((_actor, component) => component === IdComponent
    ? { id: "actor:1" } as never : undefined);
  jest.mocked(getSceneService).mockImplementation((_scene, service) => service === NavigationService
    ? navigation as never : service === MovementOccupancyService ? occupancy as never : undefined);
  jest.mocked(getSceneComponent).mockReturnValue({ tilemap: { tileWidth: 0, tileHeight: 0 } } as never);
  jest.mocked(getGameObjectCurrentTile).mockReturnValue({ x: 0, y: 0, z: 0 });
  jest.mocked(isGameObjectActiveInActiveScene).mockReturnValue(true);
  jest.mocked(isSceneActive).mockReturnValue(true);
  const runtime = new MovementRuntime(actor);
  runtime.init();
  return { actor, scene, events, delayedCall, navigation, occupancy, runtime };
}
