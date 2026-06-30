import type { ActorId, Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getSceneComponent, getSceneService } from "../../world/services/scene-component-helpers";
import { NavigationService, TerrainType } from "../../world/services/navigation.service";
import { throttle } from "../../library/throttle";
import { getActorSystem } from "../../data/actor-system";
import {
  getGameObjectCurrentTile,
  getGameObjectTileInNavigableRadius,
  getGameObjectTileInRadius,
  getGameObjectVisibility,
  isGameObjectActiveInActiveScene,
  isSceneActive,
  onObjectReady
} from "../../data/game-object-helper";
import { Subscription } from "rxjs";
import { AudioService } from "../../world/services/audio.service";
import { getActorComponent } from "../../data/actor-component";
import { ActorTranslateComponent } from "../components/movement/actor-translate-component";
import { HealthComponent } from "../components/combat/components/health-component";
import { PawnAiController } from "../../prefabs/ai-agents/pawn-ai-controller";
import { OrderType } from "../../ai/order-type";
import { OrderData } from "../../ai/OrderData";
import { AudioActorComponent } from "../components/actor-audio/audio-actor-component";
import {
  SharedActorActionsSfxGrassSounds,
  SharedActorActionsSfxGravelSounds,
  SharedActorActionsSfxSandSounds,
  SharedActorActionsSfxSnowSounds,
  SharedActorActionsSfxStoneSounds
} from "../../sfx/shared-actor-actions-sfx";
import { AnimationActorComponent } from "../components/animation/animation-actor-component";
import { FlyingComponent } from "../components/movement/flying-component";
import { MovementTerrainType } from "../components/movement/movement-terrain-type";
import { RepresentableComponent } from "../components/representable-component";
import { IdComponent } from "../components/id-component";
import { StatusEffectComponent } from "../components/status-effect/status-effect-component";
import { getTileCoordsUnderObject } from "../../library/tile-under-object";
import { TilemapComponent } from "../../world/tilemap/tilemap.component";
import type { IsoDirection } from "../components/movement/iso-directions";
import type { PathMoveConfig } from "./path-move-config";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { getInterpolatedSimulationNow } from "../../world/services/simulation-time";
import { MovementOccupancyService } from "../../world/services/movement-occupancy.service";
import GameObject = Phaser.GameObjects.GameObject;

export class MovementSystem {
  private _navigationService?: NavigationService;
  // Active movement is driven from interpolated simulation time so visuals freeze
  // with lockstep instead of reaching the tile early and waiting for the next
  // authoritative simulation tick to unlock the following step.
  private _cancelCurrentMovement?: () => void;
  private readonly DEBUG = false;
  private commandBusSubscription?: Subscription;
  private actorTranslateComponent?: ActorTranslateComponent;
  private tileMapComponent!: TilemapComponent;
  private audioService: AudioService | undefined;
  private audioActorComponent: AudioActorComponent | undefined;
  private animationActorComponent?: AnimationActorComponent;
  private statusEffectComponent?: StatusEffectComponent;
  private _movementOccupancyService?: MovementOccupancyService;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    this.listenToMoveEvents();
    onObjectReady(gameObject, this.init, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  private init() {
    this.actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    this.animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
    this.statusEffectComponent = getActorComponent(this.gameObject, StatusEffectComponent);
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
    this.audioActorComponent = getActorComponent(this.gameObject, AudioActorComponent);
    this.tileMapComponent = getSceneComponent(this.gameObject.scene, TilemapComponent)!;
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

      this.movementOccupancyService?.releaseDestination(actorId);
      const newWorldVec3 = await this.getTileVec3ByDynamicFlocking(cmd.tileVec3, cmd.actorIds as ActorId[]);
      const payerPawnAiController = getActorComponent(this.gameObject, PawnAiController);
      if (payerPawnAiController) {
        const newOrder = new OrderData(OrderType.Move, { targetTileLocation: newWorldVec3 });
        if (cmd.queue) {
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

  private get movementOccupancyService(): MovementOccupancyService | undefined {
    this._movementOccupancyService =
      this._movementOccupancyService ?? getSceneService(this.gameObject.scene, MovementOccupancyService);
    return this._movementOccupancyService;
  }

  async moveToLocationByFollowingStaticPath(
    tileVec3: Vector3Simple,
    pathMoveConfig?: PathMoveConfig
  ): Promise<boolean> {
    if (!isGameObjectActiveInActiveScene(this.gameObject)) return false;
    const flyingComponent = getActorComponent(this.gameObject, FlyingComponent);
    const usePathfinding = !flyingComponent;
    if (!usePathfinding) {
      return this.moveDirectlyToLocationWithoutPathfinding(tileVec3, pathMoveConfig)
        .then(() => true)
        .catch(() => false);
    }

    if (!this.navigationService) return false;

    const path = await this.navigationService.findPathFromGameObjectToTile(this.gameObject, tileVec3);
    if (!path || !path.length) return false;

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
    } finally {
      const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
      if (actorId) this.movementOccupancyService?.releaseDestination(actorId);
    }

    return true;
  }

  async moveToActorByAdjustingPathDynamically(
    gameObject: GameObject,
    pathMoveConfig?: Partial<PathMoveConfig>
  ): Promise<boolean> {
    return this.moveToActorByFollowingDeterministicSnapshotPath(gameObject, pathMoveConfig);
  }

  private async moveToActorByFollowingDeterministicSnapshotPath(
    destinationGameObject: GameObject,
    pathMoveConfig?: Partial<PathMoveConfig>
  ): Promise<boolean> {
    const flyingComponent = getActorComponent(this.gameObject, FlyingComponent);
    const usePathfinding = !flyingComponent;
    if (!usePathfinding) {
      const vec3 = getGameObjectCurrentTile(destinationGameObject);
      if (!vec3) return false;
      return this.moveDirectlyToLocationWithoutPathfinding(
        {
          x: vec3.x,
          y: vec3.y,
          z: 0
        } satisfies Vector3Simple,
        pathMoveConfig as PathMoveConfig
      )
        .then(() => true)
        .catch(() => false);
    }

    const path = await this.getPathToClosestNavigableTileBetweenGameObjectsInRadius(
      destinationGameObject,
      pathMoveConfig?.radiusTilesAroundDestination
    );
    if (!path || !path.length) return false;

    this.cancelMovement();

    try {
      path.shift();
      await this.moveAlongPathByFollowingPreCalculatedStaticPath(path, pathMoveConfig as PathMoveConfig);
      return true;
    } catch {
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

    this.cancelMovement();
    config?.onPathUpdate?.(nextTile);

    const onComplete = async () => {
      await this.moveAlongPathByFollowingPreCalculatedStaticPath(path, config);
    };

    const onStop = () => {
      config?.onStop?.();
      this.playMovementAnimation(false, config);
    };

    return this.moveActorToTileWithTween(nextTile, config, onComplete, onStop);
  }

  /**
   * Common movement handler for moving an actor to a specific tile using tweens.
   * Extracts the tile-to-world conversion and tween setup logic used across multiple movement methods.
   *
   * @param tile The destination tile coordinates
   * @param config Optional movement configuration
   * @param onComplete Optional callback when movement completes
   * @param onStop Optional callback when movement is stopped
   * @returns Promise<void> - resolves when movement is completed
   */
  private async moveActorToTileWithTween(
    tile: Vector2Simple,
    config?: PathMoveConfig | Partial<PathMoveConfig>,
    onComplete?: (() => void) | (() => Promise<void>),
    onStop?: () => void
  ): Promise<void> {
    if (!isGameObjectActiveInActiveScene(this.gameObject)) {
      return Promise.reject("Scene is not active");
    }
    const tileWorldXY = this.navigationService?.getTileWorldCenter(tile);
    if (!tileWorldXY) return Promise.reject("No tile world xy to move to");

    // Get the navigable height at the destination tile
    const navigableHeight = this.navigationService?.getNavigableHeightAtTile(tile) ?? 0;
    const newLogicalTransform = { ...tileWorldXY, z: navigableHeight } as Vector3Simple;

    const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
    const movementOccupancy = this.movementOccupancyService;
    if (actorId && movementOccupancy) {
      const footprint = movementOccupancy.getActorFootprintAtTile(this.gameObject, tile);
      if (!movementOccupancy.reserveStep(actorId, footprint, navigableHeight)) {
        return Promise.reject("Next movement tile is occupied");
      }
    }

    const wrappedOnComplete = async () => {
      if (actorId) movementOccupancy?.releaseStep(actorId);
      if (onComplete) {
        await onComplete();
      }
    };

    const wrappedOnStop = () => {
      if (actorId) movementOccupancy?.releaseStep(actorId);
      onStop?.();
    };

    return this.startMovementTween(newLogicalTransform, config, wrappedOnComplete, wrappedOnStop).catch((error) => {
      if (actorId) movementOccupancy?.releaseStep(actorId);
      throw error;
    });
  }

  private tweenUpdate = (logicalTransform: Vector3Simple) => {
    if (!this.actorTranslateComponent) return;
    this.actorTranslateComponent.moveActorToLogicalPosition(logicalTransform);
  };

  cancelMovement() {
    this._cancelCurrentMovement?.();
    this._cancelCurrentMovement = undefined;
    const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
    if (actorId) this.movementOccupancyService?.releaseStep(actorId);
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
   * without considering navigation mesh or navigable tiles along the route.
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
    const currentTile = getGameObjectCurrentTile(this.gameObject);
    // The multiplier scales duration by tile distance so long flying moves don't complete in the same time as short hops.
    const tileDistanceMultiplier = currentTile
      ? Math.max(Math.abs(vec3.x - currentTile.x), Math.abs(vec3.y - currentTile.y), 1)
      : 1;

    const onComplete = () => {
      pathMoveConfig?.onComplete?.();
      this.playMovementAnimation(false, pathMoveConfig);
    };

    const onStop = () => {
      pathMoveConfig?.onStop?.();
      if (!pathMoveConfig?.ignoreAnimations) this.playMovementAnimation(false, pathMoveConfig);
    };

    return this.startMovementTween(newLogicalTransform, pathMoveConfig, onComplete, onStop, tileDistanceMultiplier);
  }

  private startMovementTween(
    newLogicalTransform: Vector3Simple,
    config: PathMoveConfig | Partial<PathMoveConfig> | undefined,
    onComplete?: (() => void) | (() => Promise<void>),
    onStop?: () => void,
    tileDistanceMultiplier: number = 1
  ): Promise<void> {
    const scene = this.gameObject.scene;
    if (!isGameObjectActiveInActiveScene(this.gameObject) || !scene) {
      return Promise.reject("Game object scene is unavailable");
    }

    const actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    const throttledTweenUpdate = config?.onUpdateThrottled
      ? throttle(config.onUpdateThrottled, config.onUpdateThrottle ?? 360)
      : undefined;

    return new Promise<void>((resolve, reject) => {
      const isKilled = getActorComponent(this.gameObject, HealthComponent)?.killed ?? false;
      if (isKilled) return reject("Actor is killed");
      this.onMovementStart(newLogicalTransform, config);
      const representableComponent = getActorComponent(this.gameObject, RepresentableComponent);
      if (!representableComponent) return reject("No representable component");
      const logicalTransform = { ...representableComponent.logicalWorldTransform };
      const baseDuration = actorTranslateComponent?.actorTranslateDefinition?.tileMoveDuration;
      if (typeof baseDuration !== "number") return reject("No tile move duration defined");
      const standardStepDistance = this.getStandardStepDistance();
      const duration = this.calculateDuration(
        baseDuration,
        logicalTransform,
        newLogicalTransform,
        standardStepDistance,
        tileDistanceMultiplier
      );
      const startTransform = { ...logicalTransform };
      const startTime = getInterpolatedSimulationNow(scene);
      let settled = false;

      const cleanup = () => {
        scene.events.off(Phaser.Scenes.Events.UPDATE, updateMovement);
        scene.events.off(Phaser.Scenes.Events.SHUTDOWN, cancelMovement);
        if (this._cancelCurrentMovement === cancelMovement) {
          this._cancelCurrentMovement = undefined;
        }
      };

      const finishMovement = async () => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        logicalTransform.x = newLogicalTransform.x;
        logicalTransform.y = newLogicalTransform.y;
        logicalTransform.z = newLogicalTransform.z;
        this.tweenUpdate(logicalTransform);
        if (onComplete) {
          await onComplete();
        }
        resolve();
      };

      const cancelMovement = () => {
        if (settled) {
          return;
        }
        settled = true;
        cleanup();
        if (onStop) {
          onStop();
        } else {
          config?.onStop?.();
          if (!config?.ignoreAnimations) this.playMovementAnimation(false, config);
        }
        resolve();
      };

      const updateMovement = () => {
        if (!isGameObjectActiveInActiveScene(this.gameObject) || !isSceneActive(scene)) {
          cancelMovement();
          return;
        }
        const elapsed = Math.max(0, getInterpolatedSimulationNow(scene) - startTime);
        const progress = duration <= 0 ? 1 : Phaser.Math.Clamp(elapsed / duration, 0, 1);
        logicalTransform.x = Phaser.Math.Linear(startTransform.x, newLogicalTransform.x, progress);
        logicalTransform.y = Phaser.Math.Linear(startTransform.y, newLogicalTransform.y, progress);
        logicalTransform.z = Phaser.Math.Linear(startTransform.z, newLogicalTransform.z, progress);
        this.tweenUpdate(logicalTransform);
        throttledTweenUpdate?.();
        config?.onUpdate?.();
        if (progress >= 1) {
          void finishMovement();
        }
      };

      // Movement progression is computed from interpolated simulation time.
      // That keeps visual travel smooth while also freezing exactly when lockstep
      // pauses, so the next path segment cannot be delayed behind a wall-clock tween.
      this._cancelCurrentMovement = cancelMovement;
      scene.events.on(Phaser.Scenes.Events.UPDATE, updateMovement);
      scene.events.once(Phaser.Scenes.Events.SHUTDOWN, cancelMovement);
      updateMovement();
    });
  }

  private getStandardStepDistance(): number {
    const tileWidth = this.tileMapComponent.tilemap.tileWidth;
    const tileHeight = this.tileMapComponent.tilemap.tileHeight;
    return tileWidth && tileHeight ? Math.sqrt(Math.pow(tileWidth / 2, 2) + Math.pow(tileHeight / 2, 2)) : 0;
  }

  private calculateDuration(
    baseDuration: number,
    from: { x: number; y: number },
    to: { x: number; y: number },
    standardStepDistance: number,
    tileDistanceMultiplier: number = 1
  ): number {
    let duration: number;
    if (standardStepDistance > 0) {
      const dist = Phaser.Math.Distance.Between(from.x, from.y, to.x, to.y);
      duration = (dist / standardStepDistance) * baseDuration;
    } else {
      duration = Math.max(baseDuration * tileDistanceMultiplier, baseDuration);
    }

    // Apply movement speed modifier from status effects (slow effects)
    const speedModifier = this.statusEffectComponent?.getMovementSpeedModifier() ?? 1.0;
    // Higher modifier = faster = shorter duration
    // Lower modifier (e.g., 0.5 for 50% slow) = slower = longer duration
    if (speedModifier !== 1.0 && speedModifier > 0) {
      duration = duration / speedModifier;
    }

    return duration;
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
    // can be random as it doesn't need to be deterministic
    const randomIndex = Math.floor(Math.random() * movementSoundDefinition.length);
    const movementSound = movementSoundDefinition[randomIndex]!;
    this.audioService.playSpatialAudioSprite(this.gameObject, movementSound.key, movementSound.spriteName, {
      volume: 70 // make it quieter so it doesn't drown out other sounds
    });
  }

  private playMovementAnimation(isMoving: boolean, config?: PathMoveConfig) {
    if (!this.animationActorComponent) return;
    if (config?.ignoreAnimations) return;
    if (!isGameObjectActiveInActiveScene(this.gameObject)) return;
    const isKilled = getActorComponent(this.gameObject, HealthComponent)?.killed ?? false;
    if (isKilled) return;
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
        // console.warn("No movement sound for water");
        return undefined; // todo add water sound, but it should not be played when crossing the bridge
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
    const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
    if (actorId) this.movementOccupancyService?.releaseAll(actorId);
    this.commandBusSubscription?.unsubscribe();
  }

  async canMoveTo(targetGameObject: Phaser.GameObjects.GameObject, range?: number): Promise<boolean> {
    const path = await this.getPathToClosestNavigableTileBetweenGameObjectsInRadius(targetGameObject, range);
    return !!path && path.length > 0;
  }

  async getPathToClosestNavigableTileBetweenGameObjectsInRadius(
    targetGameObject: Phaser.GameObjects.GameObject,
    range?: number
  ): Promise<Vector2Simple[] | null> {
    if (!this.navigationService) throw new Error("No navigationService");
    return this.navigationService.findAndUseNavigablePathBetweenGameObjectsWithRadius(
      this.gameObject,
      targetGameObject,
      range
    );
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
    selectedActorObjectIds: ActorId[]
  ): Promise<Vector3Simple> {
    const unitCount = selectedActorObjectIds.length;
    if (unitCount < 2) {
      return tileVec3;
    }
    if (getActorComponent(this.gameObject, FlyingComponent)) {
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
      if (distA !== distB) return distA - distB;
      // Deterministic tie-break for equal-distance points keeps formation assignment stable.
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    const terrainType =
      this.actorTranslateComponent?.actorTranslateDefinition.movementTerrainType ?? MovementTerrainType.Ground;
    const targetHeight = this.navigationService.getNavigableHeightAtTile(tileVec3);
    const sameHeightFormationPoints: Vector2Simple[] = [];
    const otherHeightFormationPoints: Vector2Simple[] = [];
    for (const point of formationPoints) {
      const pointHeight = this.navigationService.getNavigableHeightAtTile(point);
      if (pointHeight === targetHeight) {
        sameHeightFormationPoints.push(point);
      } else {
        otherHeightFormationPoints.push(point);
      }
    }

    // Assign a unique formation point to this unit based on its sorted index
    const orderedCandidateGroups = [sameHeightFormationPoints, otherHeightFormationPoints];
    for (const candidateGroup of orderedCandidateGroups) {
      if (candidateGroup.length === 0) continue;
      const candidateStartIndex = ownSortedIndex % candidateGroup.length;
      const orderedCandidates = [
        ...candidateGroup.slice(candidateStartIndex),
        ...candidateGroup.slice(0, candidateStartIndex)
      ];

      for (const assignedPoint of orderedCandidates) {
        const destinationTile: Vector2Simple = { x: assignedPoint.x, y: assignedPoint.y };

        // Check if the assigned point is valid and reachable
        if (this.navigationService.isTileNavigable(destinationTile, terrainType)) {
          const path = await this.navigationService.findPathFromGameObjectToTile(this.gameObject, destinationTile);
          if (path !== null && path.length > 0) {
            const destinationHeight = this.navigationService.getNavigableHeightAtTile(destinationTile);
            const movementOccupancy = this.movementOccupancyService;
            const footprint = movementOccupancy?.getActorFootprintAtTile(this.gameObject, destinationTile);
            if (footprint && !movementOccupancy?.reserveDestination(ownId, footprint, destinationHeight)) {
              continue;
            }
            return {
              x: destinationTile.x,
              y: destinationTile.y,
              z: destinationHeight
            } satisfies Vector3Simple;
          }
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
