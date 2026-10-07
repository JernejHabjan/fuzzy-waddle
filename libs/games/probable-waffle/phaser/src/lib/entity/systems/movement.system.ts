import type Phaser from "phaser";
import type { ActorId, Vector2Simple, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { IsoDirection } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/iso-directions";
import type { PathMoveConfig } from "@fuzzy-waddle/probable-waffle-gameplay/entity/systems/path-move-config";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { Subscription } from "rxjs";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { getActorSystem } from "../../data/actor-system";
import {
  getGameObjectCurrentTile,
  getGameObjectTileInNavigableRadius,
  getGameObjectTileInRadius,
  isGameObjectActiveInActiveScene,
  onObjectReady
} from "../../data/game-object-helper";
import { getActorComponent } from "../../data/actor-component";
import { HealthComponent } from "../components/combat/components/health-component";
import { PawnAiController } from "../../prefabs/ai-agents/pawn-ai-controller";
import { OrderType } from "../../ai/order-type";
import { OrderData } from "../../ai/OrderData";
import { FlyingComponent } from "../components/movement/flying-component";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { MovementRuntime } from "./movement-runtime";
import { MovementPresentation } from "./movement-presentation";
import { MovementTween } from "./movement-tween";
import { MovementPathExecution } from "./movement-path-execution";
import { MovementFormation } from "./movement-formation";
import type { MovementQueryContext } from "./movement-query-context";
import { MovementQueryObservation } from "./movement-query-observation";
import { MovementCompletionObservation } from "./movement-completion-observation";

/**
 * Actor-system token and public movement facade. Shared MOVE admission stays here; actor-local owners handle
 * readiness dependencies, formation, native path execution, interpolation and presentation. No save state is added.
 */
export class MovementSystem {
  private readonly DEBUG = false;
  private commandBusSubscription?: Subscription;
  private readonly runtime: MovementRuntime;
  private readonly presentation: MovementPresentation;
  private readonly tween: MovementTween;
  private readonly pathExecution: MovementPathExecution;
  private readonly formation: MovementFormation;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    this.runtime = new MovementRuntime(gameObject);
    this.presentation = new MovementPresentation(this.runtime);
    this.tween = new MovementTween(this.runtime, this.presentation);
    this.pathExecution = new MovementPathExecution(this.runtime, this.tween, this.presentation);
    this.formation = new MovementFormation(this.runtime);
    this.listenToMoveEvents();
    onObjectReady(gameObject, this.init, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  private init() {
    this.runtime.init();
  }

  private listenToMoveEvents() {
    const commandBus = getSceneService(this.gameObject.scene, CommandBusService);
    if (!commandBus) {
      console.error("MovementSystem: CommandBusService not found — move commands will not be received");
      return;
    }

    const myId = getActorComponent(this.gameObject, IdComponent)?.id;

    this.commandBusSubscription = commandBus.command$.subscribe(async (cmd) => {
      if (cmd.type !== "MOVE") return;

      const actorId = myId ?? getActorComponent(this.gameObject, IdComponent)?.id;
      if (!actorId || !cmd.actorIds.includes(actorId)) return;

      try {
        this.runtime.movementOccupancyService?.releaseDestination(actorId);
        const newWorldVec3 = await this.formation.getTileVec3ByDynamicFlocking(cmd.tileVec3, cmd.actorIds as ActorId[]);
        const payerPawnAiController = getActorComponent(this.gameObject, PawnAiController);
        if (payerPawnAiController) {
          const newOrder = new OrderData(OrderType.Move, {
            targetTileLocation: newWorldVec3,
            commandContext: cmd.execution
              ? { execution: cmd.execution, playerNumber: cmd.playerNumber, actorIds: cmd.actorIds }
              : undefined
          });
          if (cmd.queue) {
            payerPawnAiController.blackboard.addOrder(newOrder);
          } else {
            payerPawnAiController.blackboard.overrideOrderQueueAndActiveOrder(newOrder);
          }

          this.presentation.playOrderSound(payerPawnAiController.blackboard.peekNextPlayerOrder()!);
          commandBus.reportOutcome(cmd, "applied", "applied", [actorId]);
        } else {
          const accepted = await this.moveToLocationByFollowingStaticPath(newWorldVec3);
          commandBus.reportOutcome(
            cmd,
            accepted ? "completed" : "failed",
            accepted ? "applied" : "application_failed",
            [actorId]
          );
        }
      } catch {
        commandBus.reportOutcome(cmd, "failed", "application_failed", [actorId], [], "movement_application_failed");
      }
    });
  }

  instantlyMoveToWorldCoordinates(logicalWorldTransform: Vector3Simple): void {
    this.tween.tweenUpdate(logicalWorldTransform);
  }

  async moveToLocationByFollowingStaticPath(
    tileVec3: Vector3Simple,
    pathMoveConfig?: PathMoveConfig,
    queryContext?: MovementQueryContext
  ): Promise<boolean> {
    if (!isGameObjectActiveInActiveScene(this.gameObject)) {
      MovementCompletionObservation.begin(queryContext?.actor === this.gameObject ? queryContext : undefined,
        "path", tileVec3)?.returned(false);
      return false;
    }
    const flyingComponent = getActorComponent(this.gameObject, FlyingComponent);
    const usePathfinding = !flyingComponent;
    const completion = MovementCompletionObservation.begin(queryContext?.actor === this.gameObject ? queryContext : undefined,
      usePathfinding ? "path" : "direct", tileVec3);
    if (!usePathfinding) {
      completion?.destination(tileVec3);
      return this.tween.moveDirectlyToLocationWithoutPathfinding(tileVec3, pathMoveConfig, completion)
        .then(() => { completion?.returned(true); return true; })
        .catch(() => { completion?.returned(false); return false; });
    }

    if (!this.runtime.navigationService) { completion?.returned(false); return false; }

    let path: Vector2Simple[] | null;
    try {
      path = await MovementQueryObservation.invoke(this.gameObject, queryContext, "initial",
        () => this.runtime.navigationService!.findPathFromGameObjectToTile(this.gameObject, tileVec3));
    } catch (error) { completion?.threw(); throw error; }
    if (!path || !path.length) { completion?.returned(false); return false; }

    if (this.DEBUG) console.log(`Moving to tile ${tileVec3.x}, ${tileVec3.y}`);

    if (this.DEBUG) this.runtime.navigationService.drawDebugPath(path);

    let success = false;
    try {
      if (path.length) {
        completion?.destination(path[path.length - 1]);
        // Remove the first tile, as it's the current tile
        path.shift();
        await this.pathExecution.moveAlongPathByFollowingPreCalculatedStaticPath(
          path, pathMoveConfig, undefined, queryContext, completion);
        success = true;
      }
    } catch (e) {
      // console.error("Error moving along path", e);
    } finally {
      const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
      if (actorId) this.runtime.movementOccupancyService?.releaseDestination(actorId);
    }

    completion?.returned(success);
    return success;
  }

  async moveToActorByAdjustingPathDynamically(
    gameObject: Phaser.GameObjects.GameObject,
    pathMoveConfig?: Partial<PathMoveConfig>,
    queryContext?: MovementQueryContext
  ): Promise<boolean> {
    return this.moveToActorByFollowingDeterministicSnapshotPath(gameObject, pathMoveConfig, queryContext);
  }

  private async moveToActorByFollowingDeterministicSnapshotPath(
    destinationGameObject: Phaser.GameObjects.GameObject,
    pathMoveConfig?: Partial<PathMoveConfig>,
    queryContext?: MovementQueryContext
  ): Promise<boolean> {
    const flyingComponent = getActorComponent(this.gameObject, FlyingComponent);
    const usePathfinding = !flyingComponent;
    const completion = MovementCompletionObservation.begin(queryContext?.actor === this.gameObject ? queryContext : undefined,
      usePathfinding ? "path" : "direct");
    if (!usePathfinding) {
      const vec3 = getGameObjectCurrentTile(destinationGameObject);
      if (!vec3) { completion?.returned(false); return false; }
      completion?.destination(vec3);
      return this.tween.moveDirectlyToLocationWithoutPathfinding(
        {
          x: vec3.x,
          y: vec3.y,
          z: 0
        } satisfies Vector3Simple,
        pathMoveConfig as PathMoveConfig,
        completion
      )
        .then(() => { completion?.returned(true); return true; })
        .catch(() => { completion?.returned(false); return false; });
    }

    // Actor-target movement snapshots a path to the nearest reachable tile by
    // the target object. The order stays deterministic until recovery chooses
    // to wait, sidestep, or repath after a blockage.
    let path: Vector2Simple[] | null;
    try {
      path = await this.getPathToClosestNavigableTileBetweenGameObjectsInRadius(
        destinationGameObject, pathMoveConfig?.radiusTilesAroundDestination, queryContext);
    } catch (error) { completion?.threw(); throw error; }
    if (!path || !path.length) { completion?.returned(false); return false; }

    this.cancelMovement();

    let success = false;
    try {
      completion?.destination(path[path.length - 1]);
      path.shift();
      await this.pathExecution.moveAlongPathByFollowingPreCalculatedStaticPath(
        path, pathMoveConfig as PathMoveConfig, undefined, queryContext, completion);
      success = true;
    } catch {
      // Preserve the native false result after destination cleanup; cleanup errors still reject.
    } finally {
      const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
      if (actorId) this.runtime.movementOccupancyService?.releaseDestination(actorId);
    }
    completion?.returned(success);
    return success;
  }

  private destroy() {
    this.cancelMovement();
    const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
    if (actorId) this.runtime.movementOccupancyService?.releaseAll(actorId);
    this.commandBusSubscription?.unsubscribe();
  }

  async canMoveTo(targetGameObject: Phaser.GameObjects.GameObject, range?: number,
    queryContext?: MovementQueryContext): Promise<boolean> {
    const path = await this.getPathToClosestNavigableTileBetweenGameObjectsInRadius(targetGameObject, range, queryContext);
    return !!path && path.length > 0;
  }

  async getPathToClosestNavigableTileBetweenGameObjectsInRadius(
    targetGameObject: Phaser.GameObjects.GameObject,
    range?: number,
    queryContext?: MovementQueryContext
  ): Promise<Vector2Simple[] | null> {
    if (!this.runtime.navigationService) throw new Error("No navigationService");
    return MovementQueryObservation.invoke(this.gameObject, queryContext, "initial",
      () => this.runtime.navigationService!.findAndUseNavigablePathBetweenGameObjectsWithRadius(
        this.gameObject, targetGameObject, range));
  }

  /**
   * Finds the closest unoccupied tile around the target tile and returns it as Vector3Simple.
   * Unoccupied means no actor sits on the tile (regardless of collider).
   * Useful for preventing units from stacking on top of each other.
   */
  async getClosestUnoccupiedTileVec3(
    tileVec3: Vector3Simple,
    maxRadius: number = 10
  ): Promise<Vector3Simple | undefined> {
    if (!this.runtime.navigationService) return undefined;

    const targetTile = { x: tileVec3.x, y: tileVec3.y };
    const closestUnoccupiedTile = await this.runtime.navigationService.getClosestUnoccupiedTile(targetTile, maxRadius);

    if (!closestUnoccupiedTile) return undefined;

    return {
      x: closestUnoccupiedTile.x,
      y: closestUnoccupiedTile.y,
      z: tileVec3.z
    };
  }

  cancelMovement() {
    this.tween.cancelMovement();
  }
}

export async function getRandomTileInNavigableRadius(
  gameObject: Phaser.GameObjects.GameObject,
  radius: number
): Promise<Vector2Simple | null> {
  const movementSystem = getActorSystem<MovementSystem>(gameObject, MovementSystem);
  if (!movementSystem) return Promise.reject("No movement system found");
  const flyingComponent = getActorComponent(gameObject, FlyingComponent);
  const usePathfinding = !flyingComponent;
  const newTile = usePathfinding
    ? await getGameObjectTileInNavigableRadius(gameObject, radius)
    : getGameObjectTileInRadius(gameObject, radius);
  if (!newTile) {
    return Promise.reject("No new tile found");
  }

  return newTile;
}

export async function moveGameObjectToRandomTileInNavigableRadius(
  gameObject: Phaser.GameObjects.GameObject,
  radius: number,
  pathMoveConfig?: PathMoveConfig
): Promise<void> {
  const movementSystem = getActorSystem<MovementSystem>(gameObject, MovementSystem);
  if (!movementSystem) return Promise.reject("No movement system found");
  const newTile = await getRandomTileInNavigableRadius(gameObject, radius);
  if (!newTile) {
    return Promise.reject("No new tile found");
  }
  await movementSystem.moveToLocationByFollowingStaticPath(
    {
      x: newTile.x,
      y: newTile.y,
      z: 0
    } satisfies Vector3Simple,
    pathMoveConfig
  );
}

export function getGameObjectDirectionBetweenTiles(
  oldTileWorldXY: Vector2Simple | undefined,
  newTileWorldXY: Vector2Simple | undefined
): IsoDirection | undefined {
  if (!newTileWorldXY) return;
  if (!oldTileWorldXY) return;

  // here we're comparing world coordinates to determine the direction. Iso tile coordinates produce different results
  const directionX = newTileWorldXY.x - oldTileWorldXY.x;
  const directionY = newTileWorldXY.y - oldTileWorldXY.y;

  return getIsoDirectionFromDirectionalVector(directionX, directionY);
}

export function getIsoDirectionFromDirectionalVector(directionX: number, directionY: number): IsoDirection {
  if (directionX === 0 && directionY === 0) return "south"; // default fallback

  // Adjust for isometric scaling: in a 2:1 isometric projection, Y axis is compressed
  const isoAdjustedX = directionX;
  const isoAdjustedY = directionY * 2;

  const absX = Math.abs(isoAdjustedX);
  const absY = Math.abs(isoAdjustedY);

  if (absX > absY) {
    return isoAdjustedX > 0 ? "east" : "west";
  } else if (absY > absX) {
    return isoAdjustedY > 0 ? "south" : "north";
  } else {
    if (isoAdjustedX > 0 && isoAdjustedY > 0) {
      return "southeast";
    } else if (isoAdjustedX < 0 && isoAdjustedY > 0) {
      return "southwest";
    } else if (isoAdjustedX > 0 && isoAdjustedY < 0) {
      return "northeast";
    } else {
      return "northwest";
    }
  }
}
