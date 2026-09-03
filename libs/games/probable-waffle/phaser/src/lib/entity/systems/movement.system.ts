import Phaser from "phaser";
import type { ActorId, Vector2Simple, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
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
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { RepresentableComponent } from "../components/representable-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { StatusEffectComponent } from "../components/status-effect/status-effect-component";
import { TilemapComponent } from "../../world/tilemap/tilemap.component";
import type { IsoDirection } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/iso-directions";
import type { PathMoveConfig } from "@fuzzy-waddle/probable-waffle-gameplay/entity/systems/path-move-config";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { getInterpolatedSimulationNow } from "../../world/services/simulation-time";
import { MovementOccupancyService } from "../../world/services/movement-occupancy.service";
import { applyCampaignProgressionModifiers } from "../../campaign/campaign-progression-modifier";
import { getAirFormationCandidates, type AirFormationBounds } from "../../world/services/air-formation";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
/**
 * Defines the game object alias used by this module. Keep values in this named domain so linked APIs and
 * storage boundaries do not drift into an unconstrained primitive.
 */
type GameObject = Phaser.GameObjects.GameObject;

// When another actor is already stepping through the blocked tile, wait briefly
// a couple of times before trying more disruptive recovery.
const BLOCKED_STEP_MAX_WAIT_ATTEMPTS = 2;
// Congestion waits use scene time so they pause with the simulation lifecycle.
const BLOCKED_STEP_WAIT_MS = 120;
// Small local side-steps are the first spatial recovery option after waiting.
const BLOCKED_STEP_MAX_SIDE_STEP_ATTEMPTS = 2;
// Full repaths are more expensive and can reshuffle routes, so cap retries.
const BLOCKED_STEP_MAX_REPATH_ATTEMPTS = 2;
// A repath may temporarily fail while another unit clears the route, but do
// not wait forever before escalating to the fallback-destination flow.
const BLOCKED_STEP_MAX_REPATH_WAIT_ATTEMPTS = 2;
// Last-resort fallback search radius around the original destination tile.
const BLOCKED_STEP_FALLBACK_RADIUS = 6;
// Formation expansion stops after a bounded connected-component search so large
// move groups do not flood-fill an entire platform while assigning destinations.
const FORMATION_MAX_CONNECTED_CELLS = 96;
// A 16-tile spiral supplies 1,089 pre-clamp candidates while bounding command
// work on large maps. Edge clamping still deduplicates every usable map tile.
const AIR_FORMATION_MAX_RADIUS = 16;

/**
 * Defines the structured blocked step recovery state contract for this module. Its declared surface makes wait
 * attempts by tile, side step attempts, repath attempts explicit to every consumer. Use this shared shape
 * rather than an ad-hoc object so adapters, persistence, and callers remain compatible.
 */
interface BlockedStepRecoveryState {
  /**
   * wait attempts by tile value carried by {@link BlockedStepRecoveryState}. Its declared type is the
   * compatibility boundary for producers, validators, and consumers; do not replace it with a broader inferred
   * shape.
   */
  waitAttemptsByTile: Map<string, number>;
  /**
   * numeric side step attempts carried by {@link BlockedStepRecoveryState}. Its units and valid range are
   * defined by {@link BlockedStepRecoveryState} and must remain consistent across producers and consumers.
   */
  sideStepAttempts: number;
  /**
   * numeric repath attempts carried by {@link BlockedStepRecoveryState}. Its units and valid range are defined
   * by {@link BlockedStepRecoveryState} and must remain consistent across producers and consumers.
   */
  repathAttempts: number;
}

/**
 * Signals that the next tile in an otherwise valid path is temporarily blocked
 * by dynamic actor occupancy rather than static terrain connectivity.
 */
class MovementStepBlockedError extends Error {
  constructor(
    readonly tile: Vector2Simple,
    readonly blockers: ActorId[]
  ) {
    super("Next movement tile is occupied");
  }
}

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
        .catch(() => false)
        .finally(() => {
          const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
          if (actorId) this.movementOccupancyService?.releaseAirDestination(actorId);
        });
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

    // Actor-target movement snapshots a path to the nearest reachable tile by
    // the target object. The order stays deterministic until recovery chooses
    // to wait, sidestep, or repath after a blockage.
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
    } finally {
      const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
      if (actorId) this.movementOccupancyService?.releaseDestination(actorId);
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
   * @param recoveryState Mutable counters that keep retries bounded across recursive recovery.
   * @returns Promise<void> - resolves when the entire path is completed
   */
  private async moveAlongPathByFollowingPreCalculatedStaticPath(
    path: Vector2Simple[],
    config?: PathMoveConfig,
    recoveryState: BlockedStepRecoveryState = {
      waitAttemptsByTile: new Map<string, number>(),
      sideStepAttempts: 0,
      repathAttempts: 0
    }
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
      await this.moveAlongPathByFollowingPreCalculatedStaticPath(path, config, recoveryState);
    };

    const onStop = () => {
      config?.onStop?.();
      this.playMovementAnimation(false, config);
    };

    try {
      await this.moveActorToTileWithTween(nextTile, config, onComplete, onStop);
    } catch (error) {
      if (!(error instanceof MovementStepBlockedError)) {
        throw error;
      }
      await this.recoverFromBlockedPathStep(error, nextTile, path, config, recoveryState);
    }
  }

  /**
   * Handles dynamic congestion after a single blocked step on a valid static
   * route. Recovery keeps the original order alive and escalates from the
   * least disruptive option to the most disruptive one:
   * 1. wait for transient step reservations to clear
   * 2. sidestep locally and repath to the original destination
   * 3. repath directly from the current tile
   * 4. pick a nearby same-height fallback tile and route there instead
   * @param error Dynamic occupancy details for the blocked next step.
   * @param blockedTile The tile that the actor failed to enter.
   * @param remainingPath The rest of the original path after the blocked step.
   * @param config Optional movement callbacks and animation flags for the order.
   * @param recoveryState Mutable counters that keep retries bounded across recursive recovery.
   */
  private async recoverFromBlockedPathStep(
    error: MovementStepBlockedError,
    blockedTile: Vector2Simple,
    remainingPath: Vector2Simple[],
    config: PathMoveConfig | undefined,
    recoveryState: BlockedStepRecoveryState
  ): Promise<void> {
    // Escalate from cheapest to most disruptive recovery:
    // wait -> sidestep -> repath -> same-height fallback tile.
    const finalDestination = remainingPath[remainingPath.length - 1] ?? blockedTile;
    const blockedTileKey = `${blockedTile.x},${blockedTile.y}`;
    const waitAttempts = recoveryState.waitAttemptsByTile.get(blockedTileKey) ?? 0;
    // Prefer a short wait when the blocker is another actor's active step.
    // That case usually clears without changing the selected path, which keeps
    // groups from scattering when they briefly meet at a choke point.
    if (
      waitAttempts < BLOCKED_STEP_MAX_WAIT_ATTEMPTS &&
      this.movementOccupancyService?.hasAnyActiveStepReservation(error.blockers)
    ) {
      recoveryState.waitAttemptsByTile.set(blockedTileKey, waitAttempts + 1);
      await this.waitForBlockedStep();
      await this.moveAlongPathByFollowingPreCalculatedStaticPath(
        [blockedTile, ...remainingPath],
        config,
        recoveryState
      );
      return;
    }

    if (recoveryState.sideStepAttempts < BLOCKED_STEP_MAX_SIDE_STEP_ATTEMPTS) {
      const sideStepTile = this.getBestSideStepTile(blockedTile, finalDestination);
      if (sideStepTile) {
        recoveryState.sideStepAttempts++;
        config?.onPathUpdate?.(sideStepTile);
        await this.moveActorToTileWithTween(sideStepTile, config);
        const recovered = await this.repathToDestination(finalDestination, config, recoveryState);
        if (recovered) return;
      }
    }

    if (recoveryState.repathAttempts < BLOCKED_STEP_MAX_REPATH_ATTEMPTS) {
      recoveryState.repathAttempts++;
      const recovered = await this.repathToDestination(finalDestination, config, recoveryState);
      if (recovered) return;
    }

    const fallbackTile = await this.findReachableFallbackTile(finalDestination);
    if (!fallbackTile) throw error;
    await this.moveToFallbackTile(fallbackTile, config, recoveryState);
  }

  private waitForBlockedStep(): Promise<void> {
    return new Promise((resolve) => {
      const scene = this.gameObject.scene;
      if (!isSceneActive(scene)) {
        resolve();
        return;
      }
      // Use Phaser scene time so congestion waits pause with the simulation scene lifecycle.
      scene.time.delayedCall(BLOCKED_STEP_WAIT_MS, () => resolve());
    });
  }

  /**
   * Rebuilds a dynamic-blocker path to the same destination after congestion.
   * Destination reservations are intentionally ignored here: they claim final
   * formation slots, but using them as path blockers can make a moving group
   * close every temporary route around a large object. Active step reservations
   * and current actor footprints still block traversal, and a no-path result is
   * retried a small number of times because those blockers can clear on the
   * next congestion wait. When that never happens, control returns so the
   * caller can escalate to a fallback destination instead of hanging forever.
   * @param destinationTile The original tile the order is still trying to reach.
   * @param config Optional movement callbacks and animation flags for the order.
   * @param recoveryState Mutable counters that survive across repath retries.
   */
  private async repathToDestination(
    destinationTile: Vector2Simple,
    config: PathMoveConfig | undefined,
    recoveryState: BlockedStepRecoveryState
  ): Promise<boolean> {
    if (!this.navigationService) return Promise.reject("No navigationService");
    const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
    let newPath: Vector2Simple[] | null = null;
    let waitAttempts = 0;
    while (isGameObjectActiveInActiveScene(this.gameObject) && waitAttempts <= BLOCKED_STEP_MAX_REPATH_WAIT_ATTEMPTS) {
      // Repathing overlays only dynamic blockers. Static height edges stay owned
      // by NavigationService so wall/stairs connectivity cannot diverge here.
      const dynamicBlockers =
        actorId && this.movementOccupancyService
          ? this.movementOccupancyService.getDynamicBlockersForActor(actorId, {
              includeDestinationReservations: false
            })
          : [];
      newPath = await this.navigationService.findPathFromGameObjectToTileAvoidingDynamicBlockers(
        this.gameObject,
        destinationTile,
        dynamicBlockers
      );
      if (newPath && newPath.length) break;

      // Congestion can temporarily make every route around a large obstacle look closed.
      // Keep the order alive and retry after other actors release their current steps.
      waitAttempts++;
      if (waitAttempts > BLOCKED_STEP_MAX_REPATH_WAIT_ATTEMPTS) break;
      await this.waitForBlockedStep();
    }
    if (!newPath || !newPath.length) return false;
    newPath.shift();
    await this.moveAlongPathByFollowingPreCalculatedStaticPath(newPath, config, recoveryState);
    return true;
  }

  /**
   * Finds a nearby replacement destination when the original endpoint stays
   * unreachable after waiting, sidestepping, and repathing. Candidates must:
   * - stay on the same navigable height layer as the destination
   * - fit the actor's full footprint
   * - remain reachable when dynamic blockers are overlaid
   * @param destinationTile The original target tile whose height layer and vicinity are preserved.
   */
  private async findReachableFallbackTile(destinationTile: Vector2Simple): Promise<Vector2Simple | undefined> {
    const navigationService = this.navigationService;
    const movementOccupancy = this.movementOccupancyService;
    const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
    if (!navigationService || !movementOccupancy || !actorId) return undefined;

    const destinationHeight = navigationService.getNavigableHeightAtTile(destinationTile);
    const candidates: Vector2Simple[] = [];
    // Search outward in Manhattan rings so the first accepted tile is the
    // closest deterministic fallback on the destination's height layer.
    for (let radius = 1; radius <= BLOCKED_STEP_FALLBACK_RADIUS; radius++) {
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          if (Math.abs(dx) + Math.abs(dy) !== radius) continue;
          const candidate = { x: destinationTile.x + dx, y: destinationTile.y + dy };
          if (!navigationService.isWithinGridBounds(candidate)) continue;
          if (!navigationService.isTileNavigable(candidate)) continue;
          if (navigationService.getNavigableHeightAtTile(candidate) !== destinationHeight) continue;
          const footprint = movementOccupancy.getActorFootprintAtTile(this.gameObject, candidate);
          if (
            !movementOccupancy.isFootprintFree(actorId, footprint, destinationHeight, {
              includeDestinationReservations: false
            })
          ) {
            continue;
          }
          candidates.push(candidate);
        }
      }
      const fallback = await this.getFirstReachableCandidate(candidates, destinationTile);
      if (fallback) return fallback;
    }
    return undefined;
  }

  /**
   * Chooses the first reachable candidate tile from a deterministic ordering.
   * Distance to the original destination wins first so fallback endpoints stay
   * visually close to the player's requested location.
   * @param candidates Reachability candidates that already passed local footprint checks.
   * @param destinationTile The original destination used for deterministic ranking.
   */
  private async getFirstReachableCandidate(
    candidates: Vector2Simple[],
    destinationTile: Vector2Simple
  ): Promise<Vector2Simple | undefined> {
    const navigationService = this.navigationService;
    const movementOccupancy = this.movementOccupancyService;
    const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
    if (!navigationService || !movementOccupancy || !actorId) return undefined;
    const dynamicBlockers = movementOccupancy.getDynamicBlockersForActor(actorId, {
      includeDestinationReservations: false
    });
    const orderedCandidates = [...candidates].sort((a, b) => {
      const distanceDelta = this.getTileDistance(a, destinationTile) - this.getTileDistance(b, destinationTile);
      if (distanceDelta !== 0) return distanceDelta;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });
    for (const candidate of orderedCandidates) {
      const path = await navigationService.findPathFromGameObjectToTileAvoidingDynamicBlockers(
        this.gameObject,
        candidate,
        dynamicBlockers
      );
      if (path && path.length > 0) return candidate;
    }
    return undefined;
  }

  /**
   * Reserves and routes to the fallback destination chosen after congestion
   * recovery exhausted the original endpoint. Reserving first keeps another
   * actor from stealing the same escape slot during the repath.
   * @param fallbackTile The replacement tile selected near the original destination.
   * @param config Optional movement callbacks and animation flags for the order.
   * @param recoveryState Mutable counters reused while finishing the recovered order.
   */
  private async moveToFallbackTile(
    fallbackTile: Vector2Simple,
    config: PathMoveConfig | undefined,
    recoveryState: BlockedStepRecoveryState
  ): Promise<void> {
    const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
    const heightLayer = this.navigationService?.getNavigableHeightAtTile(fallbackTile) ?? 0;
    const footprint = this.movementOccupancyService?.getActorFootprintAtTile(this.gameObject, fallbackTile);
    if (actorId && footprint) {
      this.movementOccupancyService?.releaseDestination(actorId);
      this.movementOccupancyService?.reserveDestination(actorId, footprint, heightLayer);
    }
    // Reserve the escape slot before repathing so another actor cannot claim it
    // while this unit is recalculating its route.
    const recovered = await this.repathToDestination(fallbackTile, config, recoveryState);
    if (!recovered) {
      throw new Error("Failed to repath to fallback destination");
    }
  }

  /**
   * Picks a one-step local detour around the blocked tile without changing
   * height layers. Candidates are ranked by forward progress toward the final
   * destination, then by how much they move away from the blockage.
   * @param blockedTile The immediate blocked next step from the current tile.
   * @param finalDestination The eventual order destination used to rank progress.
   */
  private getBestSideStepTile(blockedTile: Vector2Simple, finalDestination: Vector2Simple): Vector2Simple | undefined {
    const currentTile = getGameObjectCurrentTile(this.gameObject);
    const navigationService = this.navigationService;
    const movementOccupancy = this.movementOccupancyService;
    const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
    if (!currentTile || !navigationService || !movementOccupancy || !actorId) return undefined;

    const terrainType =
      this.actorTranslateComponent?.actorTranslateDefinition.movementTerrainType ?? MovementTerrainType.Ground;
    const currentHeight = navigationService.getNavigableHeightAtTile(currentTile);
    const candidates: Vector2Simple[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const candidate = { x: currentTile.x + dx, y: currentTile.y + dy };
        if (candidate.x === blockedTile.x && candidate.y === blockedTile.y) continue;
        if (!navigationService.isWithinGridBounds(candidate, terrainType)) continue;
        if (!navigationService.isTileNavigable(candidate, terrainType)) continue;
        if (!navigationService.canTraverseBetweenTiles(currentTile, candidate)) continue;
        const candidateHeight = navigationService.getNavigableHeightAtTile(candidate);
        if (candidateHeight !== currentHeight) continue;
        const footprint = movementOccupancy.getActorFootprintAtTile(this.gameObject, candidate);
        if (
          !movementOccupancy.isFootprintFree(actorId, footprint, candidateHeight, {
            includeDestinationReservations: false
          })
        ) {
          continue;
        }
        candidates.push(candidate);
      }
    }

    candidates.sort((a, b) => {
      const progressDelta = this.getTileDistance(a, finalDestination) - this.getTileDistance(b, finalDestination);
      if (progressDelta !== 0) return progressDelta;
      const blockedDelta = this.getTileDistance(b, blockedTile) - this.getTileDistance(a, blockedTile);
      if (blockedDelta !== 0) return blockedDelta;
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    return candidates[0];
  }

  private getTileDistance(a: Vector2Simple, b: Vector2Simple): number {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
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

  private tweenUpdate = (logicalTransform: Vector3Simple) => {
    if (!this.actorTranslateComponent) return;
    this.actorTranslateComponent.moveActorToLogicalPosition(logicalTransform);
  };

  /**
   * Cancels the active tween and clears transient reservations. A caller that
   * has just allocated a new air destination may retain that slot while it
   * replaces the previous tween.
   */
  cancelMovement(releaseAirDestination: boolean = true) {
    this._cancelCurrentMovement?.();
    this._cancelCurrentMovement = undefined;
    const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
    if (actorId) this.movementOccupancyService?.releaseStep(actorId);
    if (actorId && releaseAirDestination) this.movementOccupancyService?.releaseAirDestination(actorId);
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
    this.cancelMovement(false);

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

  /**
   * Starts the scene tween for an already-authoritative movement decision.
   * It converts deterministic path/tick state into visuals, owns cancellation and completion callbacks, and must not let rendering duration change simulation position.
   */
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
    const speedModifier =
      (this.statusEffectComponent?.getMovementSpeedModifier() ?? 1.0) *
      applyCampaignProgressionModifiers(this.gameObject, "movement-speed", 1);
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
    if (getActorComponent(this.gameObject, FlyingComponent)) {
      return this.getAirFormationDestination(tileVec3, selectedActorObjectIds);
    }
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

    const formationPoints = this.getConnectedFormationPoints(tileVec3, unitCount);

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
          const movementOccupancy = this.movementOccupancyService;
          const destinationHeight = this.navigationService.getNavigableHeightAtTile(destinationTile);
          const dynamicBlockers =
            movementOccupancy?.getDynamicBlockersForActor(ownId, {
              includeDestinationReservations: false
            }) ?? [];
          const path = await this.navigationService.findPathFromGameObjectToTileAvoidingDynamicBlockers(
            this.gameObject,
            destinationTile,
            dynamicBlockers
          );
          if (path !== null && path.length > 0) {
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
   * Allocates an air-only final destination. Simultaneous commands derive their
   * preferred spiral slot from sorted actor IDs; single-actor production rally
   * orders scan that same spiral around active reservations. No ground navigation
   * APIs are used, so water, cliffs, and walls remain valid flight destinations.
   */
  private getAirFormationDestination(tileVec3: Vector3Simple, selectedActorIds: ActorId[]): Vector3Simple {
    const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
    const occupancy = this.movementOccupancyService;
    const bounds = this.getAirFormationBounds();
    if (!actorId || !occupancy || !bounds) return tileVec3;

    const candidates = getAirFormationCandidates({ x: tileVec3.x, y: tileVec3.y }, bounds, AIR_FORMATION_MAX_RADIUS);
    if (candidates.length === 0) return tileVec3;

    const actorIndex = getSceneService(this.gameObject.scene, ActorIndexSystem);
    // Ground actors intentionally do not consume air slots in mixed selections.
    // The actor index is the authoritative ID lookup and avoids scene-child order.
    const flyingActorIds = selectedActorIds.filter((selectedActorId) => {
      const selectedActor = actorIndex?.getActorById(selectedActorId);
      return !!selectedActor && !!getActorComponent(selectedActor, FlyingComponent);
    });
    const sortedActorIds = (flyingActorIds.length > 0 ? flyingActorIds : selectedActorIds).slice().sort();
    const preferredIndex = Math.max(0, sortedActorIds.indexOf(actorId));
    occupancy.releaseAirDestination(actorId);

    for (let offset = 0; offset < candidates.length; offset++) {
      const candidate = candidates[(preferredIndex + offset) % candidates.length]!;
      if (occupancy.reserveAirDestination(actorId, candidate, tileVec3.z)) {
        return { x: candidate.x, y: candidate.y, z: tileVec3.z } satisfies Vector3Simple;
      }
    }

    return tileVec3;
  }

  /**
   * Allocates the next available air slot for a unit produced after earlier
   * units have already left for the same location rally point. Non-flying
   * callers retain their supplied destination so ground rally behavior stays
   * owned by its existing occupancy and navigation flow.
   */
  getAirFormationDestinationForSequentialRally(tileVec3: Vector3Simple): Vector3Simple {
    if (!getActorComponent(this.gameObject, FlyingComponent)) return tileVec3;
    const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
    return this.getAirFormationDestination(tileVec3, actorId ? [actorId] : []);
  }

  /** Reads tilemap dimensions without involving ground navigation constraints. */
  private getAirFormationBounds(): AirFormationBounds | undefined {
    const tilemap = this.tileMapComponent?.tilemap;
    if (!tilemap || tilemap.width <= 0 || tilemap.height <= 0) return undefined;
    return { minX: 0, maxX: tilemap.width - 1, minY: 0, maxY: tilemap.height - 1 } satisfies AirFormationBounds;
  }

  private getConnectedFormationPoints(tileVec3: Vector3Simple, unitCount: number): Vector2Simple[] {
    const navigationService = this.navigationService;
    if (!navigationService) return [{ x: tileVec3.x, y: tileVec3.y }];
    // Prefer connected same-height positions so formations do not assign some
    // units to the ground while others are standing on walls or stairs.
    const connectedSameHeight = navigationService.getConnectedNavigableTiles(
      { x: tileVec3.x, y: tileVec3.y },
      { sameHeightOnly: true, maxTiles: FORMATION_MAX_CONNECTED_CELLS }
    );
    if (connectedSameHeight.length >= unitCount) {
      return connectedSameHeight;
    }
    const connectedAnyHeight = navigationService.getConnectedNavigableTiles(
      { x: tileVec3.x, y: tileVec3.y },
      { sameHeightOnly: false, maxTiles: FORMATION_MAX_CONNECTED_CELLS }
    );
    return connectedSameHeight.concat(
      connectedAnyHeight.filter(
        (point) => !connectedSameHeight.some((sameHeight) => sameHeight.x === point.x && sameHeight.y === point.y)
      )
    );
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
