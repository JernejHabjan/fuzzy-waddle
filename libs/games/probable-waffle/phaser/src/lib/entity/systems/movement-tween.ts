import Phaser from "phaser";
import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { PathMoveConfig } from "@fuzzy-waddle/probable-waffle-gameplay/entity/systems/path-move-config";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { getActorComponent } from "../../data/actor-component";
import { getGameObjectCurrentTile, isGameObjectActiveInActiveScene, isSceneActive } from "../../data/game-object-helper";
import { ActorTranslateComponent } from "../components/movement/actor-translate-component";
import { HealthComponent } from "../components/combat/components/health-component";
import { RepresentableComponent } from "../components/representable-component";
import { throttle } from "../../library/throttle";
import { getInterpolatedSimulationNow } from "../../world/services/simulation-time";
import { applyCampaignProgressionModifiers } from "../../campaign/campaign-progression-modifier";
import { MovementStepBlockedError } from "./movement-step-blocked-error";
import type { MovementRuntime } from "./movement-runtime";
import type { MovementPresentation } from "./movement-presentation";

/**
 * Owns the active per-actor movement callback and step reservation lifetime. UPDATE/SHUTDOWN subscriptions,
 * interpolation, throttling and native callback/Promise ordering are retained from MovementSystem.
 */
export class MovementTween {
  // Active movement is driven from interpolated simulation time so visuals freeze
  // with lockstep instead of reaching the tile early and waiting for the next
  // authoritative simulation tick to unlock the following step.
  private _cancelCurrentMovement?: () => void;

  constructor(private readonly runtime: MovementRuntime, private readonly presentation: MovementPresentation) {}

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
  async moveActorToTileWithTween(
    tile: Vector2Simple,
    config?: PathMoveConfig | Partial<PathMoveConfig>,
    onComplete?: (() => void) | (() => Promise<void>),
    onStop?: () => void
  ): Promise<void> {
    if (!isGameObjectActiveInActiveScene(this.runtime.gameObject)) {
      return Promise.reject("Scene is not active");
    }
    const tileWorldXY = this.runtime.navigationService?.getTileWorldCenter(tile);
    if (!tileWorldXY) return Promise.reject("No tile world xy to move to");

    // Get the navigable height at the destination tile
    const navigableHeight = this.runtime.navigationService?.getNavigableHeightAtTile(tile) ?? 0;
    const newLogicalTransform = { ...tileWorldXY, z: navigableHeight } as Vector3Simple;

    const actorId = getActorComponent(this.runtime.gameObject, IdComponent)?.id;
    const movementOccupancy = this.runtime.movementOccupancyService;
    if (actorId && movementOccupancy) {
      const footprint = movementOccupancy.getActorFootprintAtTile(this.runtime.gameObject, tile);
      const reservation = movementOccupancy.tryReserveStep(actorId, footprint, navigableHeight);
      if (!reservation.reserved) {
        return Promise.reject(new MovementStepBlockedError(tile, reservation.blockers));
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

  tweenUpdate = (logicalTransform: Vector3Simple) => {
    if (!this.runtime.actorTranslateComponent) return;
    this.runtime.actorTranslateComponent.moveActorToLogicalPosition(logicalTransform);
  };

  cancelMovement() {
    this._cancelCurrentMovement?.();
    this._cancelCurrentMovement = undefined;
    const actorId = getActorComponent(this.runtime.gameObject, IdComponent)?.id;
    if (actorId) this.runtime.movementOccupancyService?.releaseStep(actorId);
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
  moveDirectlyToLocationWithoutPathfinding(
    vec3: Vector3Simple,
    pathMoveConfig?: PathMoveConfig
  ): Promise<void> {
    // don't use pathfinding
    // use worldXY to move directly to location
    this.cancelMovement();

    const tileWorldXY = this.runtime.navigationService?.getTileWorldCenter(vec3);
    if (!tileWorldXY) {
      return Promise.reject("No tile world xy to move to");
    }

    const newLogicalTransform = {
      x: tileWorldXY.x,
      y: tileWorldXY.y,
      z: vec3.z
    } as Vector3Simple;
    const currentTile = getGameObjectCurrentTile(this.runtime.gameObject);
    // The multiplier scales duration by tile distance so long flying moves don't complete in the same time as short hops.
    const tileDistanceMultiplier = currentTile
      ? Math.max(Math.abs(vec3.x - currentTile.x), Math.abs(vec3.y - currentTile.y), 1)
      : 1;

    const onComplete = () => {
      pathMoveConfig?.onComplete?.();
      this.presentation.playMovementAnimation(false, pathMoveConfig);
    };

    const onStop = () => {
      pathMoveConfig?.onStop?.();
      if (!pathMoveConfig?.ignoreAnimations) this.presentation.playMovementAnimation(false, pathMoveConfig);
    };

    return this.startMovementTween(newLogicalTransform, pathMoveConfig, onComplete, onStop, tileDistanceMultiplier);
  }

  /**
   * Starts the scene tween for an already-authoritative movement decision.
   * It converts path/tick state into visuals and owns cancellation and completion callbacks.
   * Progress uses interpolated simulation time, preserving the existing logical-position updates.
   */
  private startMovementTween(
    newLogicalTransform: Vector3Simple,
    config: PathMoveConfig | Partial<PathMoveConfig> | undefined,
    onComplete?: (() => void) | (() => Promise<void>),
    onStop?: () => void,
    tileDistanceMultiplier: number = 1
  ): Promise<void> {
    const scene = this.runtime.gameObject.scene;
    if (!isGameObjectActiveInActiveScene(this.runtime.gameObject) || !scene) {
      return Promise.reject("Game object scene is unavailable");
    }

    const actorTranslateComponent = getActorComponent(this.runtime.gameObject, ActorTranslateComponent);
    const throttledTweenUpdate = config?.onUpdateThrottled
      ? throttle(config.onUpdateThrottled, config.onUpdateThrottle ?? 360)
      : undefined;

    return new Promise<void>((resolve, reject) => {
      const isKilled = getActorComponent(this.runtime.gameObject, HealthComponent)?.killed ?? false;
      if (isKilled) return reject("Actor is killed");
      this.presentation.onMovementStart(newLogicalTransform, config);
      const representableComponent = getActorComponent(this.runtime.gameObject, RepresentableComponent);
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
          if (!config?.ignoreAnimations) this.presentation.playMovementAnimation(false, config);
        }
        resolve();
      };

      const updateMovement = () => {
        if (!isGameObjectActiveInActiveScene(this.runtime.gameObject) || !isSceneActive(scene)) {
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
    const tileWidth = this.runtime.tileMapComponent.tilemap.tileWidth;
    const tileHeight = this.runtime.tileMapComponent.tilemap.tileHeight;
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
    const speedModifier =
      (this.runtime.statusEffectComponent?.getMovementSpeedModifier() ?? 1.0) *
      applyCampaignProgressionModifiers(this.runtime.gameObject, "movement-speed", 1);
    // Higher modifier = faster = shorter duration
    // Lower modifier (e.g., 0.5 for 50% slow) = slower = longer duration
    if (speedModifier !== 1.0 && speedModifier > 0) {
      duration = duration / speedModifier;
    }

    return duration;
  }
}
