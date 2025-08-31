import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getSceneComponent, getSceneService } from "../../world/components/scene-component-helpers";
import { NavigationService, TerrainType } from "../../world/services/navigation.service";
import { throttle } from "../../library/throttle";
import { getActorSystem } from "../../data/actor-system";
import {
  getGameObjectCurrentTile,
  getGameObjectTileInNavigableRadius,
  getGameObjectTileInRadius,
  getGameObjectVisibility,
  onObjectReady
} from "../../data/game-object-helper";
import { Subscription } from "rxjs";
import { AudioService } from "../../world/services/audio.service";
import { getCommunicator, getCurrentPlayerNumber } from "../../data/scene-data";
import { SelectableComponent } from "../actor/components/selectable-component";
import { getActorComponent } from "../../data/actor-component";
import { ActorTranslateComponent, type IsoDirection } from "../actor/components/actor-translate-component";
import { HealthComponent } from "../combat/components/health-component";
import { PawnAiController } from "../../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import { OrderType } from "../character/ai/order-type";
import { OrderData } from "../character/ai/OrderData";
import { AudioActorComponent } from "../actor/components/audio-actor-component";
import {
  SharedActorActionsSfxGrassSounds,
  SharedActorActionsSfxGravelSounds,
  SharedActorActionsSfxSandSounds,
  SharedActorActionsSfxSnowSounds,
  SharedActorActionsSfxStoneSounds
} from "../../sfx/SharedActorActionsSfx";
import { OwnerComponent } from "../actor/components/owner-component";
import { AnimationActorComponent } from "../actor/components/animation-actor-component";
import { FlightComponent } from "../actor/components/flight-component";
import { WalkableComponent } from "../actor/components/walkable-component";
import { RepresentableComponent } from "../actor/components/representable-component";
import Tween = Phaser.Tweens.Tween;
import GameObject = Phaser.GameObjects.GameObject;
import { IdComponent } from "../actor/components/id-component";
import { getTileCoordsUnderObject } from "../../library/tile-under-object";
import { TilemapComponent } from "../../world/components/tilemap.component";

export interface PathMoveConfig {
  radiusTilesAroundDestination?: number;
  onUpdateThrottle?: number;
  onComplete?: () => void;
  onPathUpdate?: (newTileXY: Vector2Simple) => void;
  onUpdateThrottled?: () => void;
  onUpdate?: () => void;
  onStop?: () => void;
  ignoreAnimations?: boolean;
}

export class MovementSystem {
  private _navigationService?: NavigationService;
  private _currentTween?: Tween;
  private readonly DEBUG = false;
  private playerChangedSubscription?: Subscription;
  private actorTranslateComponent?: ActorTranslateComponent;
  private tileMapComponent!: TilemapComponent;
  private audioService: AudioService | undefined;
  private audioActorComponent: AudioActorComponent | undefined;
  private animationActorComponent?: AnimationActorComponent;
  private shiftKey: Phaser.Input.Keyboard.Key | undefined;
  private targetGameObject?: GameObject;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    this.listenToMoveEvents();
    onObjectReady(gameObject, this.init, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  private init() {
    this.actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    this.animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
    this.audioActorComponent = getActorComponent(this.gameObject, AudioActorComponent);
    this.tileMapComponent = getSceneComponent(this.gameObject.scene, TilemapComponent)!;
    this.subscribeToShiftKey();
  }

  private subscribeToShiftKey() {
    this.shiftKey = this.gameObject.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }

  private listenToMoveEvents() {
    this.playerChangedSubscription = getCommunicator(this.gameObject.scene)
      .playerChanged?.onWithFilter((p) => p.property === "command.issued.move") // todo it's actually blackboard that should replicate
      .subscribe(async (payload) => {
        const isSelected = getActorComponent(this.gameObject, SelectableComponent)?.getSelected();
        if (!isSelected) return;
        const canIssueCommand = this.canIssueCommand();
        if (!canIssueCommand) return;
        const tileVec3 = payload.data.data!["tileVec3"] as Vector3Simple;
        const selectedActorObjectIds = payload.data.data!["selectedActorObjectIds"] as string[];
        const newWorldVec3 = await this.getTileVec3ByDynamicFlocking(tileVec3, selectedActorObjectIds);
        const payerPawnAiController = getActorComponent(this.gameObject, PawnAiController);
        if (payerPawnAiController) {
          const newOrder = new OrderData(OrderType.Move, { targetTileLocation: newWorldVec3 });
          if (this.shiftKey?.isDown) {
            payerPawnAiController.blackboard.addOrder(newOrder);
          } else {
            payerPawnAiController.blackboard.overrideOrderQueueAndActiveOrder(newOrder);
          }

          this.playOrderSound(payerPawnAiController.blackboard.peekNextPlayerOrder()!);
        } else {
          this.moveToLocationByFollowingStaticPath(newWorldVec3);
        }
      });
  }

  private playOrderSound(action: OrderData) {
    if (!this.audioActorComponent) return;
    this.audioActorComponent.playOrderSound(action);
  }

  instantlyMoveToWorldCoordinates(logicalWorldTransform: Vector3Simple): void {
    this.tweenUpdate(logicalWorldTransform);
  }

  private get navigationService(): NavigationService | undefined {
    this._navigationService = this._navigationService ?? getSceneService(this.gameObject.scene, NavigationService);
    return this._navigationService;
  }

  async moveToLocationByFollowingStaticPath(
    tileVec3: Vector3Simple,
    pathMoveConfig?: PathMoveConfig
  ): Promise<boolean> {
    const flightComponent = getActorComponent(this.gameObject, FlightComponent);
    const usePathfinding = !flightComponent;
    if (!usePathfinding) {
      return this.moveDirectlyToLocationWithoutPathfinding(tileVec3, pathMoveConfig)
        .then(() => true)
        .catch(() => false);
    }

    if (!this.navigationService) return false;

    const path = await this.navigationService.findAndUsePathFromGameObjectToTile(this.gameObject, tileVec3);
    if (!path.length) return false;

    if (this.DEBUG) console.log(`Moving to tile ${tileVec3.x}, ${tileVec3.y}`);

    if (this.DEBUG) this.navigationService.drawDebugPath(path);

    try {
      if (!path.length) return false;
      // Remove the first tile, as it's the current tile
      path.shift();
      await this.moveAlongPathByFollowingPreCalculatedStaticPath(path, pathMoveConfig);
    } catch (e) {
      // console.error("Error moving along path", e);
      return false;
    }

    return true;
  }

  async moveToActorByAdjustingPathDynamically(
    gameObject: GameObject,
    pathMoveConfig?: Partial<PathMoveConfig>
  ): Promise<boolean> {
    const flightComponent = getActorComponent(gameObject, FlightComponent);
    const usePathfinding = !flightComponent;
    if (!usePathfinding) {
      const vec3 = getGameObjectCurrentTile(gameObject);
      if (!vec3) return false;
      return this.moveDirectlyToLocationWithoutPathfinding(
        {
          x: vec3.x,
          y: vec3.y,
          z: 0
        } satisfies Vector3Simple,
        pathMoveConfig
      )
        .then(() => true)
        .catch(() => false);
    }

    return this.calculateAndFollowPathOfMovingTarget(gameObject, pathMoveConfig);
  }

  /**
   * Calculates and follows a dynamic path to a moving target game object.
   * This method is used for "following" behavior where the target may move during pathfinding.
   *
   * Unlike moveAlongPathByFollowingPreCalculatedStaticPath which follows a static pre-calculated path, this method:
   * - Recalculates the path dynamically after each step
   * - Handles moving targets that may change position
   * - Finds the closest walkable tile within a specified radius of the target
   * - Stops and recalculates if the target moves significantly
   *
   * Use cases:
   * - Following another character/unit
   * - Moving to interact with a movable object
   * - AI units pursuing a target
   *
   * @param destinationGameObject The target game object to follow/move towards
   * @param pathMoveConfig Optional configuration for movement behavior
   * @returns Promise<boolean> - true if movement started successfully, false otherwise
   */
  private async calculateAndFollowPathOfMovingTarget(
    destinationGameObject: GameObject,
    pathMoveConfig?: Partial<PathMoveConfig>
  ): Promise<boolean> {
    if (!this.navigationService) return false;

    const path = await this.getPathToClosestWalkableTileBetweenGameObjectsInRadius(
      destinationGameObject,
      pathMoveConfig?.radiusTilesAroundDestination
    );
    if (!path.length) return false;

    if (this.DEBUG) this.navigationService.drawDebugPath(path);

    // Cancel any ongoing movement before starting new path
    this.cancelMovement();

    try {
      if (!path.length) return false;
      // Remove the first tile, as it's the current tile
      path.shift();

      // Start moving along the first step of the path
      if (path.length > 0) {
        const nextTile = path[0]!;
        const tileWorldXY = this.navigationService?.getTileWorldCenter(nextTile);
        if (!tileWorldXY) return false;

        let newZ = 0;
        const walkableComponent = getActorComponent(destinationGameObject, WalkableComponent);
        if (walkableComponent && walkableComponent.getDestinationHeight) {
          newZ += walkableComponent.getDestinationHeight();
        }
        const newLogicalTransform = {
          x: tileWorldXY.x,
          y: tileWorldXY.y,
          z: newZ
        } as Vector3Simple;

        const onComplete = () => {
          // After completing one step, call the callback
          pathMoveConfig?.onComplete?.();

          // If still following, calculate a new path from the current position
          if (this.targetGameObject) {
            this.calculateAndFollowPathOfMovingTarget(this.targetGameObject, pathMoveConfig);
          } else if (path.length > 1) {
            // If not following but there are more steps, continue the path
            path.shift(); // Remove the step we just completed
            this.moveAlongPathByFollowingPreCalculatedStaticPath(path, pathMoveConfig);
          } else {
            // End of path and not following
            this.playMovementAnimation(false, pathMoveConfig);
          }
        };

        const onStop = () => {
          pathMoveConfig?.onStop?.();
          // no need to stop animation, otherwise it's not smooth
        };

        await this.startMovementTween(newLogicalTransform, pathMoveConfig, onComplete, onStop);
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  /**
   * Moves the game object along a pre-calculated static path tile by tile.
   * This is the core pathfinding movement method that executes a sequence of tile movements.
   *
   * The method works recursively:
   * - Takes the next tile from the path array
   * - Moves to that tile using a tween animation
   * - When movement completes, recursively calls itself for the next tile
   * - Continues until the entire path is traversed
   *
   * Use cases:
   * - Executing a complete path from point A to point B
   * - Moving along a predetermined route
   * - Player-commanded movement to a specific location
   * - AI following a calculated route
   *
   * @param path Array of tile coordinates representing the movement path
   * @param config Optional configuration for movement behavior and callbacks
   * @returns Promise<void> - resolves when the entire path is completed
   */
  private async moveAlongPathByFollowingPreCalculatedStaticPath(
    path: Vector2Simple[],
    config?: PathMoveConfig
  ): Promise<void> {
    if (!path.length) {
      config?.onComplete?.();
      this.playMovementAnimation(false, config);
      return;
    }
    const nextTile = path.shift();
    if (!nextTile) return Promise.reject("No next tile to move to");
    const tileWorldXY = this.navigationService?.getTileWorldCenter(nextTile);
    if (!tileWorldXY) return Promise.reject("No tile world xy to move to");
    this.cancelMovement();
    config?.onPathUpdate?.(nextTile);

    const newLogicalTransform = { ...tileWorldXY, z: 0 } as Vector3Simple;

    const onComplete = async () => {
      await this.moveAlongPathByFollowingPreCalculatedStaticPath(path, config);
    };

    const onStop = () => {
      config?.onStop?.();
      this.playMovementAnimation(false, config);
    };

    return this.startMovementTween(newLogicalTransform, config, onComplete, onStop);
  }

  private tweenUpdate = (logicalTransform: Vector3Simple) => {
    if (!this.actorTranslateComponent) return;
    this.actorTranslateComponent.moveActorToLogicalPosition(logicalTransform);
  };

  cancelMovement() {
    if (this._currentTween) {
      this._currentTween.stop();
      this._currentTween = undefined;
    }
  }

  /**
   * Moves the game object directly to a target location without pathfinding.
   * This method bypasses navigation obstacles and moves in a straight line to the destination.
   *
   * This is primarily used for:
   * - Flying units that can ignore ground obstacles
   * - Teleportation or instant movement effects
   * - Debug/admin movement commands
   * - Movement in open areas without obstacles
   *
   * The movement is handled as a single tween animation from current position to target,
   * without considering navigation mesh or walkable tiles along the route.
   *
   * @param vec3 The target world coordinates (x, y, z) to move to
   * @param pathMoveConfig Optional configuration for movement behavior
   * @returns Promise<void> - resolves when movement is completed
   */
  private moveDirectlyToLocationWithoutPathfinding(
    vec3: Vector3Simple,
    pathMoveConfig?: PathMoveConfig
  ): Promise<void> {
    // don't use pathfinding
    // use worldXY to move directly to location
    this.cancelMovement();

    const tileWorldXY = this.navigationService?.getTileWorldCenter(vec3);
    if (!tileWorldXY) {
      return Promise.reject("No tile world xy to move to");
    }

    const newLogicalTransform = {
      x: tileWorldXY.x,
      y: tileWorldXY.y,
      z: vec3.z
    } as Vector3Simple;

    const onComplete = () => {
      pathMoveConfig?.onComplete?.();
      this.playMovementAnimation(false, pathMoveConfig);
    };

    const onStop = () => {
      pathMoveConfig?.onStop?.();
      if (!pathMoveConfig?.ignoreAnimations) this.playMovementAnimation(false, pathMoveConfig);
    };

    return this.startMovementTween(newLogicalTransform, pathMoveConfig, onComplete, onStop);
  }

  private startMovementTween(
    newLogicalTransform: Vector3Simple,
    config: PathMoveConfig | Partial<PathMoveConfig> | undefined,
    onComplete?: (() => void) | (() => Promise<void>),
    onStop?: () => void
  ): Promise<void> {
    const actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    const throttledTweenUpdate = config?.onUpdateThrottled
      ? throttle(config.onUpdateThrottled, config.onUpdateThrottle ?? 360)
      : undefined;

    return new Promise<void>((resolve, reject) => {
      this.onMovementStart(newLogicalTransform, config);
      const representableComponent = getActorComponent(this.gameObject, RepresentableComponent);
      if (!representableComponent) return reject("No representable component");
      const logicalTransform = { ...representableComponent.logicalWorldTransform };
      this._currentTween = this.gameObject.scene.tweens.add({
        targets: logicalTransform,
        x: newLogicalTransform.x,
        y: newLogicalTransform.y,
        z: newLogicalTransform.z,
        duration:
          actorTranslateComponent?.actorTranslateDefinition?.tileMoveDuration ??
          new Error("No tile move duration defined"),
        onComplete: async () => {
          if (onComplete) {
            await onComplete();
          }
          resolve();
        },
        onStop: () => {
          if (onStop) {
            onStop();
          } else {
            config?.onStop?.();
            if (!config?.ignoreAnimations) this.playMovementAnimation(false, config);
          }
          // reject("Movement stopped");
          resolve();
        },
        onUpdate: () => {
          this.tweenUpdate(logicalTransform);
          throttledTweenUpdate?.();
          config?.onUpdate?.();
        }
      });
    });
  }

  private onMovementStart(newTileWorldXY: Vector3Simple, config?: PathMoveConfig | Partial<PathMoveConfig>) {
    this.playMovementSound();
    if (this.actorTranslateComponent) this.actorTranslateComponent.updateDirection(newTileWorldXY);
    this.playMovementAnimation(true, config);
  }

  private playMovementSound() {
    if (!this.audioService) return;
    const visibilityComponent = getGameObjectVisibility(this.gameObject);
    if (!visibilityComponent || !visibilityComponent.visible) return;
    const movementSoundDefinition = this.getMovementSound();
    if (!movementSoundDefinition) return;
    // get random from movementSoundDefinition
    const randomIndex = Math.floor(Math.random() * movementSoundDefinition.length);
    const movementSound = movementSoundDefinition[randomIndex]!;
    this.audioService.playSpatialAudioSprite(this.gameObject, movementSound.key, movementSound.spriteName, {
      volume: 70 // make it quieter so it doesn't drown out other sounds
    });
  }

  private playMovementAnimation(isMoving: boolean, config?: PathMoveConfig) {
    if (!this.animationActorComponent) return;
    if (config?.ignoreAnimations) return;
    this.animationActorComponent.playOrderAnimation(isMoving ? OrderType.Move : OrderType.Stop);
  }

  private getMovementSound() {
    const navigationService = this.navigationService;
    if (!this.audioService || !navigationService) return;
    const terrainUnderActor = navigationService.getTerrainUnderActor(this.gameObject);
    if (!terrainUnderActor) {
      console.warn("No terrain under actor");
      return SharedActorActionsSfxGravelSounds; // default to gravel
    }
    switch (terrainUnderActor) {
      case TerrainType.Grass:
        return SharedActorActionsSfxGrassSounds;
      case TerrainType.Gravel:
        return SharedActorActionsSfxGravelSounds;
      case TerrainType.Water:
        console.warn("No movement sound for water");
        return undefined; // todo add water sound
      case TerrainType.Sand:
        return SharedActorActionsSfxSandSounds;
      case TerrainType.Snow:
        return SharedActorActionsSfxSnowSounds;
      case TerrainType.Stone:
        return SharedActorActionsSfxStoneSounds;
      default:
        console.warn("No movement sound for terrain type", terrainUnderActor);
        return undefined;
    }
  }

  private destroy() {
    this.cancelMovement();
    this.shiftKey?.destroy();
    this.playerChangedSubscription?.unsubscribe();
  }

  async canMoveTo(targetGameObject: Phaser.GameObjects.GameObject, range?: number): Promise<boolean> {
    const path = await this.getPathToClosestWalkableTileBetweenGameObjectsInRadius(targetGameObject, range);
    return path.length > 0;
  }

  async getPathToClosestWalkableTileBetweenGameObjectsInRadius(
    targetGameObject: Phaser.GameObjects.GameObject,
    range?: number
  ): Promise<Vector2Simple[]> {
    if (!this.navigationService) return [];
    return await this.navigationService.findAndUseWalkablePathBetweenGameObjectsWithRadius(
      this.gameObject,
      targetGameObject,
      range
    );
  }

  private canIssueCommand() {
    const currentPlayerNr = getCurrentPlayerNumber(this.gameObject.scene);
    const actorPlayerNr = getActorComponent(this.gameObject, OwnerComponent)?.getOwner();
    return actorPlayerNr === currentPlayerNr;
  }

  /**
   * Prevents units from clumping up in the same point.
   * It places units in a classic RTS game formation, arranging them in a grid around the target tile.
   * Todo - this is not the most efficient way to do this:
   * Todo - instead of finding tileVec3 here, we should rework "command.issued.move"
   * Todo - to send the target tileVec3 for each actor
   */
  private async getTileVec3ByDynamicFlocking(
    tileVec3: Vector3Simple,
    selectedActorObjectIds: string[]
  ): Promise<Vector3Simple> {
    const unitCount = selectedActorObjectIds.length;
    if (unitCount < 2) {
      return tileVec3;
    }

    const idComponent = getActorComponent(this.gameObject, IdComponent);
    if (!idComponent || !this.navigationService) return tileVec3;

    const ownId = idComponent.id;
    const ownIndex = selectedActorObjectIds.findIndex((id) => id === ownId);

    if (ownIndex === -1) {
      console.warn(
        `[MovementSystem] getTileVec3ByDynamicFlocking: ownId (${ownId}) not found in selectedActorObjectIds. This should not happen if logic is correct. Returning original tileVec3.`,
        { ownId, selectedActorObjectIds, tileVec3 }
      );
      return tileVec3; // Should not happen if logic is correct
    }

    // Use a tighter formation spacing for better visual formation
    const tilesUnderGameObject = getTileCoordsUnderObject(this.tileMapComponent.tilemap, this.gameObject);
    const size = tilesUnderGameObject.length > 0 ? Math.ceil(Math.sqrt(tilesUnderGameObject.length)) : 1;
    // Reduce spacing to just the unit size without additional buffer for tighter formations
    const spacingInTiles = Math.max(1, size);

    const gridSize = Math.ceil(Math.sqrt(unitCount));
    const formationPoints: Vector2Simple[] = [];

    // Generate a grid of potential destination points around the target
    const startX = tileVec3.x - Math.floor(gridSize / 2) * spacingInTiles;
    const startY = tileVec3.y - Math.floor(gridSize / 2) * spacingInTiles;

    for (let r = 0; r < gridSize; r++) {
      for (let c = 0; c < gridSize; c++) {
        formationPoints.push({
          x: startX + c * spacingInTiles,
          y: startY + r * spacingInTiles
        });
      }
    }

    // Sort the selected units by their ID to ensure a consistent order
    const sortedSelectedIds = [...selectedActorObjectIds].sort();
    const ownSortedIndex = sortedSelectedIds.findIndex((id) => id === ownId);

    // Sort formation points by distance to the original target tile
    formationPoints.sort((a, b) => {
      const distA = Math.sqrt(Math.pow(a.x - tileVec3.x, 2) + Math.pow(a.y - tileVec3.y, 2));
      const distB = Math.sqrt(Math.pow(b.x - tileVec3.x, 2) + Math.pow(b.y - tileVec3.y, 2));
      return distA - distB;
    });

    // Assign a unique formation point to this unit based on its sorted index
    if (ownSortedIndex < formationPoints.length) {
      const assignedPoint = formationPoints[ownSortedIndex];
      if (!assignedPoint) return tileVec3;
      const destinationTile: Vector2Simple = { x: assignedPoint.x, y: assignedPoint.y };

      // Check if the assigned point is valid and reachable
      if (this.navigationService.isTileWalkable(destinationTile)) {
        try {
          const path = await this.navigationService.findAndUsePathFromGameObjectToTile(
            this.gameObject,
            destinationTile
          );
          if (path.length > 0) {
            return {
              x: destinationTile.x,
              y: destinationTile.y,
              z: tileVec3.z // Keep the original Z coordinate
            } satisfies Vector3Simple;
          }
        } catch (e) {
          // Path not found, will fallback
        }
      }
    }

    // Fallback to original target if no suitable position is found
    return tileVec3;
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
    if (!this.navigationService) return undefined;

    const targetTile = { x: tileVec3.x, y: tileVec3.y };
    const closestUnoccupiedTile = await this.navigationService.getClosestUnoccupiedTile(targetTile, maxRadius);

    if (!closestUnoccupiedTile) return undefined;

    return {
      x: closestUnoccupiedTile.x,
      y: closestUnoccupiedTile.y,
      z: tileVec3.z
    };
  }
}

export async function getRandomTileInNavigableRadius(
  gameObject: Phaser.GameObjects.GameObject,
  radius: number
): Promise<Vector2Simple | undefined> {
  const movementSystem = getActorSystem<MovementSystem>(gameObject, MovementSystem);
  if (!movementSystem) return Promise.reject("No movement system found");
  const flightComponent = getActorComponent(gameObject, FlightComponent);
  const usePathfinding = !flightComponent;
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
