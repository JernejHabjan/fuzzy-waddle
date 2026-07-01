import { ObjectNames, type Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { environment } from "../../../../../environments/environment";
import Wall, { WallType } from "../../prefabs/buildings/tivara/wall/Wall";
import Stairs, { StairsType } from "../../prefabs/buildings/tivara/stairs/Stairs";
import { NavigationService } from "./navigation.service";
import type GameProbableWaffleScene from "../scenes/GameProbableWaffleScene";
import type { SceneActorCreator } from "./scene-actor-creator";

const STORAGE_FLAG = "probableWaffleNavigationFixture";

/**
 * Development-only navigation fixture for manual height graph checks. It is
 * gated by localStorage so normal maps, production builds, and tests do not
 * receive extra actors unless a developer explicitly opts in.
 */
export class NavigationDebugFixture {
  constructor(
    private readonly scene: GameProbableWaffleScene,
    private readonly creator: SceneActorCreator
  ) {}

  createIfEnabled(): void {
    if (environment.production || !this.isEnabled()) {
      return;
    }

    this.createConnectedElevatedRoute();
    this.createDisconnectedWall();
    this.createNarrowCorridor();
    this.createSameTileHeightReference();
    this.scene.events.emit(NavigationService.UpdateNavigationEvent);
  }

  private isEnabled(): boolean {
    try {
      return globalThis.localStorage?.getItem(STORAGE_FLAG) === "1";
    } catch {
      return false;
    }
  }

  private createConnectedElevatedRoute(): void {
    this.createStairs({ x: 640, y: 640, z: 0 }, StairsType.TopLeft);
    this.createWall({ x: 672, y: 624, z: 0 }, WallType.Empty);
    this.createWall({ x: 704, y: 608, z: 0 }, WallType.Empty);
    this.createActor(ObjectNames.WatchTower, { x: 736, y: 592, z: 0 });
    this.createStairs({ x: 608, y: 656, z: 0 }, StairsType.BottomRight);
  }

  private createDisconnectedWall(): void {
    this.createWall({ x: 832, y: 640, z: 0 }, WallType.Empty);
    this.createWall({ x: 864, y: 624, z: 0 }, WallType.BottomLeftBottomRight);
  }

  private createNarrowCorridor(): void {
    this.createWall({ x: 640, y: 800, z: 0 }, WallType.Full);
    this.createWall({ x: 704, y: 768, z: 0 }, WallType.Full);
    this.createActor(ObjectNames.TivaraWorker, { x: 608, y: 816, z: 0 }, 1);
    this.createActor(ObjectNames.TivaraWorkerFemale, { x: 576, y: 832, z: 0 }, 1);
  }

  private createSameTileHeightReference(): void {
    this.createWall({ x: 928, y: 704, z: 0 }, WallType.Empty);
    this.createActor(ObjectNames.TivaraWorkerMale, { x: 928, y: 704, z: 0 }, 1);
  }

  private createWall(position: Vector3Simple, wallType: WallType): void {
    const actor = this.createActor(ObjectNames.Wall, position);
    if (actor instanceof Wall) {
      actor.updateWall(wallType);
    }
  }

  private createStairs(position: Vector3Simple, stairsType: StairsType): void {
    const actor = this.createActor(ObjectNames.Stairs, position);
    if (actor instanceof Stairs) {
      actor.updateStairs(stairsType);
    }
  }

  private createActor(
    actorName: ObjectNames,
    position: Vector3Simple,
    ownerId?: number
  ): Phaser.GameObjects.GameObject | undefined {
    return this.creator.createFinishedActor(actorName, position, ownerId);
  }
}
