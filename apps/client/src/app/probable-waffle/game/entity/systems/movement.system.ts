import { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getSceneService } from "../../scenes/components/scene-component-helpers";
import { NavigationService, TerrainType } from "../../scenes/services/navigation.service";
import { throttle } from "../../library/throttle";
import { DepthHelper } from "../../world/map/depth.helper";
import { getActorSystem } from "../../data/actor-system";
import {
  getGameObjectCurrentTile,
  getGameObjectTileInNavigableRadius,
  getGameObjectTileInRadius,
  getGameObjectTransform,
  getGameObjectTransformRaw,
  getGameObjectVisibility,
  onObjectReady
} from "../../data/game-object-helper";
import { Subscription } from "rxjs";
import { AudioService } from "../../scenes/services/audio.service";
import { getCommunicator, getCurrentPlayerNumber } from "../../data/scene-data";
import { SelectableComponent } from "../actor/components/selectable-component";
import { getActorComponent } from "../../data/actor-component";
import { ActorTranslateComponent, IsoDirection } from "../actor/components/actor-translate-component";
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
import Tween = Phaser.Tweens.Tween;
import GameObject = Phaser.GameObjects.GameObject;

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
    this.subscribeToShiftKey();
  }

  private subscribeToShiftKey() {
    this.shiftKey = this.gameObject.scene.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.SHIFT);
  }

  private listenToMoveEvents() {
    this.playerChangedSubscription = getCommunicator(this.gameObject.scene)
      .playerChanged?.onWithFilter((p) => p.property === "command.issued.move") // todo it's actually blackboard that should replicate
      .subscribe((payload) => {
        const isSelected = getActorComponent(this.gameObject, SelectableComponent)?.getSelected();
        if (!isSelected) return;
        const canIssueCommand = this.canIssueCommand();
        if (!canIssueCommand) return;
        const tileVec3 = payload.data.data!["tileVec3"] as Vector3Simple;
        const payerPawnAiController = getActorComponent(this.gameObject, PawnAiController);
        if (payerPawnAiController) {
          const newOrder = new OrderData(OrderType.Move, { targetLocation: tileVec3 });
          if (this.shiftKey?.isDown) {
            payerPawnAiController.blackboard.addOrder(newOrder);
          } else {
            payerPawnAiController.blackboard.overrideOrderQueueAndActiveOrder(newOrder);
          }

          this.playOrderSound(payerPawnAiController.blackboard.peekNextPlayerOrder()!);
        } else {
          this.moveToLocation(tileVec3);
        }
      });
  }

  private playOrderSound(action: OrderData) {
    if (!this.audioActorComponent) return;
    this.audioActorComponent.playOrderSound(action);
  }

  instantlyMoveToWorldCoordinates(vec3: Partial<Vector3Simple>): void {
    const transform = getGameObjectTransform(this.gameObject);
    if (!transform) return;

    if (vec3.x !== undefined) transform.x = vec3.x;
    if (vec3.y !== undefined) transform.y = vec3.y;
    if (vec3.z !== undefined) transform.z = vec3.z;
    this.tweenUpdate();
  }

  private get navigationService(): NavigationService | undefined {
    this._navigationService = this._navigationService ?? getSceneService(this.gameObject.scene, NavigationService);
    return this._navigationService;
  }

  async moveToLocation(tileVec3: Vector3Simple, pathMoveConfig?: PathMoveConfig): Promise<boolean> {
    const flightComponent = getActorComponent(this.gameObject, FlightComponent);
    const usePathfinding = !flightComponent;
    if (!usePathfinding) {
      return this.moveDirectlyToLocation(tileVec3, pathMoveConfig)
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
      await this.moveAlongPath(path, pathMoveConfig);
    } catch (e) {
      // console.error("Error moving along path", e);
      return false;
    }

    return true;
  }

  async moveToActor(gameObject: GameObject, pathMoveConfig?: Partial<PathMoveConfig>): Promise<boolean> {
    const flightComponent = getActorComponent(gameObject, FlightComponent);
    const usePathfinding = !flightComponent;
    if (!usePathfinding) {
      const vec3 = getGameObjectCurrentTile(gameObject);
      if (!vec3) return false;
      return this.moveDirectlyToLocation(
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

    return this.calculateAndFollowPath(gameObject, pathMoveConfig);
  }

  private async calculateAndFollowPath(
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
        const nextTile = path[0];
        const tileWorldXY = this.navigationService?.getTileWorldCenter(nextTile);
        if (!tileWorldXY) return false;

        const throttledTweenUpdate = pathMoveConfig?.onUpdateThrottled
          ? throttle(pathMoveConfig.onUpdateThrottled, pathMoveConfig.onUpdateThrottle ?? 360)
          : undefined;

        let newZ = 0;
        const flightComponent = getActorComponent(this.gameObject, FlightComponent);
        if (flightComponent && flightComponent.flightDefinition?.height) {
          newZ = flightComponent.flightDefinition.height;
        } else {
          // If not flying, check for walkable component
          const walkableComponent = getActorComponent(destinationGameObject, WalkableComponent);
          if (walkableComponent && walkableComponent.getDestinationHeight) {
            newZ += walkableComponent.getDestinationHeight();
          }
        }
        const newCoords = {
          x: tileWorldXY.x,
          y: tileWorldXY.y - newZ,
          z: newZ
        } as Vector3Simple;

        this.onMovementStart(newCoords, pathMoveConfig);
        const actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
        const tileStepDuration =
          actorTranslateComponent?.actorTranslateDefinition?.tileMoveDuration ??
          new Error("No tile move duration defined");
        // Only move one step at a time when following
        this._currentTween = this.gameObject.scene.tweens.add({
          targets: this.gameObject,
          x: newCoords.x,
          y: newCoords.y,
          z: newCoords.z,
          duration: tileStepDuration,
          onComplete: () => {
            // After completing one step, call the callback
            pathMoveConfig?.onComplete?.();

            // If still following, calculate a new path from the current position
            if (this.targetGameObject) {
              this.calculateAndFollowPath(this.targetGameObject, pathMoveConfig);
            } else if (path.length > 1) {
              // If not following but there are more steps, continue the path
              path.shift(); // Remove the step we just completed
              this.moveAlongPath(path, pathMoveConfig);
            } else {
              // End of path and not following
              this.playMovementAnimation(false, pathMoveConfig);
            }
          },
          onStop: () => {
            pathMoveConfig?.onStop?.();
            // no need to stop animation, otherwise it's not smooth
          },
          onUpdate: () => {
            this.tweenUpdate();
            throttledTweenUpdate?.();
            pathMoveConfig?.onUpdate?.();
          }
        });
      }

      return true;
    } catch (e) {
      return false;
    }
  }

  private async moveAlongPath(path: Vector2Simple[], config?: PathMoveConfig): Promise<void> {
    if (!path.length) return Promise.resolve();
    const nextTile = path.shift();
    if (!nextTile) return Promise.reject("No next tile to move to");
    const tileWorldXY = this.navigationService?.getTileWorldCenter(nextTile);
    if (!tileWorldXY) return Promise.reject("No tile world xy to move to");
    this.cancelMovement();
    config?.onPathUpdate?.(nextTile);
    const throttledTweenUpdate = config?.onUpdateThrottled
      ? throttle(config.onUpdateThrottled, config.onUpdateThrottle ?? 360)
      : undefined;

    const actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    const tileStepDuration =
      actorTranslateComponent?.actorTranslateDefinition?.tileMoveDuration ?? new Error("No tile move duration defined");
    return new Promise<void>((resolve, reject) => {
      this.onMovementStart({ ...tileWorldXY, z: 0 }, config);
      this._currentTween = this.gameObject.scene.tweens.add({
        targets: this.gameObject,
        x: tileWorldXY.x,
        y: tileWorldXY.y,
        duration: tileStepDuration,
        onComplete: async () => {
          try {
            await this.moveAlongPath(path, config);
            config?.onComplete?.();
            this.playMovementAnimation(false, config);
            resolve();
          } catch (e) {
            // console.error("Error moving along path", e);
            reject(e);
          }
        },
        onStop: () => {
          reject("Movement stopped");
          config?.onStop?.();
          this.playMovementAnimation(false, config);
        },
        onUpdate: () => {
          this.tweenUpdate();
          throttledTweenUpdate?.();
          config?.onUpdate?.();
        }
      });
    });
  }

  private tweenUpdate = () => {
    DepthHelper.setActorDepth(this.gameObject);
    const transform = getGameObjectTransformRaw(this.gameObject);
    if (!transform) return;
    if (!this.actorTranslateComponent) return;
    this.actorTranslateComponent.moveActorToPosition({
      x: transform.x,
      y: transform.y,
      z: transform.z
    });
  };

  cancelMovement() {
    if (this._currentTween) {
      this._currentTween.stop();
      this._currentTween = undefined;
    }
  }

  private moveDirectlyToLocation(vec3: Vector3Simple, pathMoveConfig?: PathMoveConfig): Promise<void> {
    const actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    // don't use pathfinding
    // use worldXY to move directly to location
    this.cancelMovement();
    const throttledTweenUpdate = pathMoveConfig?.onUpdateThrottled
      ? throttle(pathMoveConfig.onUpdateThrottled, pathMoveConfig.onUpdateThrottle ?? 360)
      : undefined;

    return new Promise<void>((resolve, reject) => {
      const tileWorldXY = this.navigationService?.getTileWorldCenter(vec3);
      if (!tileWorldXY) {
        reject("No tile world xy to move to");
        return;
      }

      let newZ = 0;
      const flightComponent = getActorComponent(this.gameObject, FlightComponent);
      if (flightComponent && flightComponent.flightDefinition?.height) {
        newZ = flightComponent.flightDefinition.height;
      }
      const newCoords = {
        x: tileWorldXY.x,
        y: tileWorldXY.y - newZ,
        z: newZ
      } as Vector3Simple;
      this.onMovementStart(newCoords, pathMoveConfig);
      this._currentTween = this.gameObject.scene.tweens.add({
        targets: this.gameObject,
        x: newCoords,
        y: newCoords.y,
        z: newCoords.z,
        duration:
          actorTranslateComponent?.actorTranslateDefinition?.tileMoveDuration ??
          new Error("No tile move duration defined"),
        onComplete: async () => {
          pathMoveConfig?.onComplete?.();
          this.playMovementAnimation(false, pathMoveConfig);
          resolve();
        },
        onStop: () => {
          pathMoveConfig?.onStop?.();
          if (!pathMoveConfig?.ignoreAnimations) this.playMovementAnimation(false, pathMoveConfig);
          reject("Movement stopped");
        },
        onUpdate: () => {
          this.tweenUpdate();
          throttledTweenUpdate?.();
          pathMoveConfig?.onUpdate?.();
        }
      });
    });
  }

  private onMovementStart(newTileWorldXY: Vector3Simple, config?: PathMoveConfig) {
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
    const movementSound = movementSoundDefinition[randomIndex];
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
  await movementSystem.moveToLocation(
    {
      x: newTile.x,
      y: newTile.y,
      z: 0
    } satisfies Vector3Simple,
    pathMoveConfig
  );
}

export function getGameObjectDirection(
  gameObject: Phaser.GameObjects.GameObject,
  newTile: Vector2Simple
): IsoDirection | undefined {
  const currentTile = getGameObjectCurrentTile(gameObject);
  if (!currentTile) return;

  const navigationService = getSceneService(gameObject.scene, NavigationService);
  if (!navigationService) return;

  const currentTileWorldXY = navigationService.getTileWorldCenter(currentTile);
  const newTileWorldXY = navigationService.getTileWorldCenter(newTile);

  return getGameObjectDirectionBetweenTiles(currentTileWorldXY, newTileWorldXY);
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
