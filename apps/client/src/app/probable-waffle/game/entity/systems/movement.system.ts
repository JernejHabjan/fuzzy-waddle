import { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getSceneService } from "../../scenes/components/scene-component-helpers";
import { NavigationService } from "../../scenes/services/navigation.service";
import { throttle } from "../../library/throttle";
import { DepthHelper } from "../../world/map/depth.helper";
import { getActorSystem } from "../../data/actor-system";
import {
  getGameObjectCurrentTile,
  getGameObjectTileInNavigableRadius,
  getGameObjectTileInRadius,
  getGameObjectTransform,
  onObjectReady
} from "../../data/game-object-helper";
import { Subscription } from "rxjs";
import { AudioService } from "../../scenes/services/audio.service";
import { getCommunicator } from "../../data/scene-data";
import { SelectableComponent } from "../actor/components/selectable-component";
import { getActorComponent } from "../../data/actor-component";
import { ActorTranslateComponent } from "../actor/components/actor-translate-component";
import { HealthComponent } from "../combat/components/health-component";
import { PawnAiController } from "../../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import { OrderType } from "../character/ai/order-type";
import { OrderData } from "../character/ai/OrderData";
import Tween = Phaser.Tweens.Tween;
import GameObject = Phaser.GameObjects.GameObject;

export interface PathMoveConfig {
  usePathfinding?: boolean;
  radiusTilesAroundDestination?: number;
  tileStepDuration?: number;
  onUpdateThrottle?: number;
  onComplete?: () => void;
  onPathUpdate?: (newTileXY: Vector2Simple) => void;
  onUpdateThrottled?: () => void;
  onUpdate?: () => void;
  onStop?: () => void;
}

export class MovementSystem {
  private readonly defaultTileStepDuration = 500;
  private _navigationService?: NavigationService;
  private _currentTween?: Tween;
  private readonly DEBUG = false;
  private playerChangedSubscription?: Subscription;
  private actorTranslateComponent?: ActorTranslateComponent;
  private audioService: AudioService | undefined;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    this.listenToMoveEvents();
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  private init() {
    this.actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    this.audioService = getSceneService(this.gameObject.scene, AudioService);
  }

  private listenToMoveEvents() {
    this.playerChangedSubscription = getCommunicator(this.gameObject.scene)
      .playerChanged?.onWithFilter((p) => p.property === "command.issued.move") // todo it's actually blackboard that should replicate
      .subscribe((payload) => {
        switch (payload.property) {
          case "command.issued.move":
            const tileVec3 = payload.data.data!["tileVec3"] as Vector3Simple;
            const isSelected = getActorComponent(this.gameObject, SelectableComponent)?.getSelected();
            if (isSelected) {
              // todo, note that we may also navigate to object and not to the tile under the object - use this.moveToActor(gameObject)

              const payerPawnAiController = getActorComponent(this.gameObject, PawnAiController);
              if (payerPawnAiController) {
                payerPawnAiController.blackboard.resetAll();
                payerPawnAiController.blackboard.addOrder(new OrderData(OrderType.Move, { targetLocation: tileVec3 }));
              } else {
                this.moveToLocation(tileVec3);
              }
            }
            break;
        }
      });

    // todo this needs to be removed from here, and add this to the pawn ai controller which will then accordingly to blackboard issue MovementSystem.moveToLocation
  }

  // todo this should maybe later move to component like ActorTransform which will also broadcast event for transform to game and update actors depth
  instantlyMoveToWorldCoordinates(vec3: Partial<Vector3Simple>): void {
    const transform = getGameObjectTransform(this.gameObject);
    if (!transform) return;

    if (vec3.x) transform.x = vec3.x;
    if (vec3.y) transform.y = vec3.y;
    if (vec3.z) transform.z = vec3.z;
    this.tweenUpdate();
  }

  private get navigationService(): NavigationService | undefined {
    this._navigationService = this._navigationService ?? getSceneService(this.gameObject.scene, NavigationService);
    return this._navigationService;
  }

  async moveToLocation(vec3: Vector3Simple, pathMoveConfig?: PathMoveConfig): Promise<boolean> {
    if (pathMoveConfig?.usePathfinding === false) {
      return this.moveDirectlyToLocation(vec3, pathMoveConfig)
        .then(() => true)
        .catch(() => false);
    }

    if (!this.navigationService) return false;

    const path = await this.navigationService.findAndUsePathFromGameObjectToTile(this.gameObject, vec3);
    if (!path.length) return false;

    if (this.DEBUG) console.log(`Moving to tile ${vec3.x}, ${vec3.y}`);

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
    if (pathMoveConfig?.usePathfinding === false) {
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

    if (!this.navigationService) return false;

    const path = await this.navigationService.findAndUseWalkablePathBetweenGameObjectsWithRadius(
      this.gameObject,
      gameObject,
      pathMoveConfig?.radiusTilesAroundDestination
    );
    if (!path.length) return false;

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

    return new Promise<void>((resolve, reject) => {
      this.onMovementStart();
      this._currentTween = this.gameObject.scene.tweens.add({
        targets: this.gameObject,
        x: tileWorldXY.x,
        y: tileWorldXY.y,
        duration: config?.tileStepDuration ?? this.defaultTileStepDuration,
        onComplete: async () => {
          try {
            await this.moveAlongPath(path, config);
            config?.onComplete?.();
            resolve();
          } catch (e) {
            // console.error("Error moving along path", e);
            reject(e);
          }
        },
        onStop: () => {
          reject("Movement stopped");
          config?.onStop?.();
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
    const transform = getGameObjectTransform(this.gameObject);
    if (!transform) return;
    if (!this.actorTranslateComponent) return;
    this.actorTranslateComponent.moveActorToPosition(transform);
  };

  cancelMovement() {
    this._currentTween?.stop();
  }

  private moveDirectlyToLocation(vec3: Vector3Simple, pathMoveConfig: PathMoveConfig): Promise<void> {
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

      this.onMovementStart();
      this._currentTween = this.gameObject.scene.tweens.add({
        targets: this.gameObject,
        x: tileWorldXY.x,
        y: tileWorldXY.y,
        duration: pathMoveConfig?.tileStepDuration ?? this.defaultTileStepDuration,
        onComplete: async () => {
          pathMoveConfig?.onComplete?.();
          resolve();
        },
        onStop: () => {
          pathMoveConfig?.onStop?.();
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

  private onMovementStart() {
    if (!this.audioService) return;
    this.audioService.playSpatialAudioSprite(this.gameObject, "character", "footstep");
  }

  private destroy() {
    this.playerChangedSubscription?.unsubscribe();
  }

  async canMoveTo(targetGameObject: Phaser.GameObjects.GameObject, range?: number): Promise<boolean> {
    if (!this.navigationService) return false;

    const path = await this.navigationService.findAndUseWalkablePathBetweenGameObjectsWithRadius(
      this.gameObject,
      targetGameObject,
      range
    );
    return path.length > 0;
  }
}

export async function getRandomTileInNavigableRadius(
  gameObject: Phaser.GameObjects.GameObject,
  radius: number,
  pathMoveConfig?: PathMoveConfig
): Promise<Vector2Simple | undefined> {
  const movementSystem = getActorSystem<MovementSystem>(gameObject, MovementSystem);
  if (!movementSystem) return Promise.reject("No movement system found");
  const newTile =
    pathMoveConfig?.usePathfinding === false
      ? getGameObjectTileInRadius(gameObject, radius)
      : await getGameObjectTileInNavigableRadius(gameObject, radius);
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
  const actorTranslateComponent = getActorComponent(gameObject, ActorTranslateComponent);
  if (!actorTranslateComponent) return Promise.reject("No actor translate component found");
  const newPathMoveConfig = {
    ...pathMoveConfig,
    usePathfinding: actorTranslateComponent.actorTranslateDefinition.usePathfinding ?? true,
    tileStepDuration: actorTranslateComponent.actorTranslateDefinition.tileStepDuration
  } satisfies PathMoveConfig;

  const newTile = await getRandomTileInNavigableRadius(gameObject, radius, newPathMoveConfig);
  if (!newTile) {
    return Promise.reject("No new tile found");
  }
  await movementSystem.moveToLocation(
    {
      x: newTile.x,
      y: newTile.y,
      z: 0
    } satisfies Vector3Simple,
    newPathMoveConfig
  );
  // todo todo this movementSystem.moveToLocation should be called from the pawn ai controller. Here we should only get the new tile
}

export function getGameObjectDirection(
  gameObject: Phaser.GameObjects.GameObject,
  newTile: Vector2Simple
): "north" | "south" | "east" | "west" | "northeast" | "northwest" | "southeast" | "southwest" | undefined {
  const currentTile = getGameObjectCurrentTile(gameObject);
  if (!currentTile) return;

  const navigationService = getSceneService(gameObject.scene, NavigationService);
  if (!navigationService) return;

  const currentTileWorldXY = navigationService.getTileWorldCenter(currentTile);
  const newTileWorldXY = navigationService.getTileWorldCenter(newTile);
  if (!newTileWorldXY) return;
  if (!currentTileWorldXY) return;

  // here we're comparing world coordinates to determine the direction. Iso tile coordinates produce different results
  const directionX = newTileWorldXY.x - currentTileWorldXY.x;
  const directionY = newTileWorldXY.y - currentTileWorldXY.y;

  return getDirectionFromDirectionVector(directionX, directionY);
}

export function getDirectionFromDirectionVector(
  directionX: number,
  directionY: number
): "north" | "south" | "east" | "west" | "northeast" | "northwest" | "southeast" | "southwest" | undefined {
  if (directionX === 0 && directionY === 0) return "south"; // default to south if no direction

  const absX = Math.abs(directionX);
  const absY = Math.abs(directionY);

  if (absX > absY) {
    if (directionX > 0) {
      return "east";
    } else {
      return "west";
    }
  } else if (absX < absY) {
    if (directionY > 0) {
      return "south";
    } else {
      return "north";
    }
  } else {
    // absX === absY (diagonal)
    if (directionX > 0 && directionY > 0) {
      return "southeast";
    } else if (directionX < 0 && directionY > 0) {
      return "southwest";
    } else if (directionX > 0 && directionY < 0) {
      return "northeast";
    } else {
      return "northwest";
    }
  }
}
