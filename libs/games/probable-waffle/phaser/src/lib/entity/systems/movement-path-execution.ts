import type { Vector2Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { PathMoveConfig } from "@fuzzy-waddle/probable-waffle-gameplay/entity/systems/path-move-config";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { MovementTerrainType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/movement/movement-terrain-type";
import { getActorComponent } from "../../data/actor-component";
import { getGameObjectCurrentTile, isGameObjectActiveInActiveScene, isSceneActive } from "../../data/game-object-helper";
import { MovementStepBlockedError } from "./movement-step-blocked-error";
import type { BlockedStepRecoveryState } from "./blocked-step-recovery-state";
import type { MovementRuntime } from "./movement-runtime";
import type { MovementTween } from "./movement-tween";
import type { MovementPresentation } from "./movement-presentation";
import type { MovementQueryContext } from "./movement-query-context";
import { MovementQueryObservation } from "./movement-query-observation";

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

/** Executes a mutable native path and its bounded wait/sidestep/repath/fallback recovery. */
export class MovementPathExecution {
  constructor(
    private readonly runtime: MovementRuntime,
    private readonly tween: MovementTween,
    private readonly presentation: MovementPresentation
  ) {}

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
  async moveAlongPathByFollowingPreCalculatedStaticPath(
    path: Vector2Simple[],
    config?: PathMoveConfig,
    recoveryState: BlockedStepRecoveryState = {
      waitAttemptsByTile: new Map<string, number>(),
      sideStepAttempts: 0,
      repathAttempts: 0
    },
    queryContext?: MovementQueryContext
  ): Promise<void> {
    if (!path.length) {
      config?.onComplete?.();
      this.presentation.playMovementAnimation(false, config);
      return;
    }
    const nextTile = path.shift();
    if (!nextTile) return Promise.reject("No next tile to move to");

    this.tween.cancelMovement();
    config?.onPathUpdate?.(nextTile);

    const onComplete = async () => {
      await this.moveAlongPathByFollowingPreCalculatedStaticPath(path, config, recoveryState, queryContext);
    };

    const onStop = () => {
      config?.onStop?.();
      this.presentation.playMovementAnimation(false, config);
    };

    try {
      await this.tween.moveActorToTileWithTween(nextTile, config, onComplete, onStop);
    } catch (error) {
      if (!(error instanceof MovementStepBlockedError)) {
        throw error;
      }
      await this.recoverFromBlockedPathStep(error, nextTile, path, config, recoveryState, queryContext);
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
    recoveryState: BlockedStepRecoveryState,
    queryContext?: MovementQueryContext
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
      this.runtime.movementOccupancyService?.hasAnyActiveStepReservation(error.blockers)
    ) {
      recoveryState.waitAttemptsByTile.set(blockedTileKey, waitAttempts + 1);
      await this.waitForBlockedStep();
      await this.moveAlongPathByFollowingPreCalculatedStaticPath(
        [blockedTile, ...remainingPath],
        config,
        recoveryState,
        queryContext
      );
      return;
    }

    if (recoveryState.sideStepAttempts < BLOCKED_STEP_MAX_SIDE_STEP_ATTEMPTS) {
      const sideStepTile = this.getBestSideStepTile(blockedTile, finalDestination);
      if (sideStepTile) {
        recoveryState.sideStepAttempts++;
        config?.onPathUpdate?.(sideStepTile);
        await this.tween.moveActorToTileWithTween(sideStepTile, config);
        const recovered = await this.repathToDestination(finalDestination, config, recoveryState, queryContext);
        if (recovered) return;
      }
    }

    if (recoveryState.repathAttempts < BLOCKED_STEP_MAX_REPATH_ATTEMPTS) {
      recoveryState.repathAttempts++;
      const recovered = await this.repathToDestination(finalDestination, config, recoveryState, queryContext);
      if (recovered) return;
    }

    const fallbackTile = await this.findReachableFallbackTile(finalDestination, queryContext);
    if (!fallbackTile) throw error;
    await this.moveToFallbackTile(fallbackTile, config, recoveryState, queryContext);
  }

  private waitForBlockedStep(): Promise<void> {
    return new Promise((resolve) => {
      const scene = this.runtime.gameObject.scene;
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
    recoveryState: BlockedStepRecoveryState,
    queryContext?: MovementQueryContext,
    queryStage: "repath" | "fallback" = "repath"
  ): Promise<boolean> {
    if (!this.runtime.navigationService) return Promise.reject("No navigationService");
    const actorId = getActorComponent(this.runtime.gameObject, IdComponent)?.id;
    let newPath: Vector2Simple[] | null = null;
    let waitAttempts = 0;
    while (isGameObjectActiveInActiveScene(this.runtime.gameObject) && waitAttempts <= BLOCKED_STEP_MAX_REPATH_WAIT_ATTEMPTS) {
      // Repathing overlays only dynamic blockers. Static height edges stay owned
      // by NavigationService so wall/stairs connectivity cannot diverge here.
      const dynamicBlockers =
        actorId && this.runtime.movementOccupancyService
          ? this.runtime.movementOccupancyService.getDynamicBlockersForActor(actorId, {
              includeDestinationReservations: false
            })
          : [];
      newPath = await MovementQueryObservation.invoke(this.runtime.gameObject, queryContext, queryStage,
        () => this.runtime.navigationService!.findPathFromGameObjectToTileAvoidingDynamicBlockers(
          this.runtime.gameObject, destinationTile, dynamicBlockers));
      if (newPath && newPath.length) break;

      // Congestion can temporarily make every route around a large obstacle look closed.
      // Keep the order alive and retry after other actors release their current steps.
      waitAttempts++;
      if (waitAttempts > BLOCKED_STEP_MAX_REPATH_WAIT_ATTEMPTS) break;
      await this.waitForBlockedStep();
    }
    if (!newPath || !newPath.length) return false;
    newPath.shift();
    await this.moveAlongPathByFollowingPreCalculatedStaticPath(newPath, config, recoveryState, queryContext);
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
  private async findReachableFallbackTile(destinationTile: Vector2Simple,
    queryContext?: MovementQueryContext): Promise<Vector2Simple | undefined> {
    const navigationService = this.runtime.navigationService;
    const movementOccupancy = this.runtime.movementOccupancyService;
    const actorId = getActorComponent(this.runtime.gameObject, IdComponent)?.id;
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
          const footprint = movementOccupancy.getActorFootprintAtTile(this.runtime.gameObject, candidate);
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
      const fallback = await this.getFirstReachableCandidate(candidates, destinationTile, queryContext);
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
    destinationTile: Vector2Simple,
    queryContext?: MovementQueryContext
  ): Promise<Vector2Simple | undefined> {
    const navigationService = this.runtime.navigationService;
    const movementOccupancy = this.runtime.movementOccupancyService;
    const actorId = getActorComponent(this.runtime.gameObject, IdComponent)?.id;
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
      const path = await MovementQueryObservation.invoke(this.runtime.gameObject, queryContext, "fallback",
        () => navigationService.findPathFromGameObjectToTileAvoidingDynamicBlockers(
          this.runtime.gameObject, candidate, dynamicBlockers));
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
    recoveryState: BlockedStepRecoveryState,
    queryContext?: MovementQueryContext
  ): Promise<void> {
    const actorId = getActorComponent(this.runtime.gameObject, IdComponent)?.id;
    const heightLayer = this.runtime.navigationService?.getNavigableHeightAtTile(fallbackTile) ?? 0;
    const footprint = this.runtime.movementOccupancyService?.getActorFootprintAtTile(this.runtime.gameObject, fallbackTile);
    if (actorId && footprint) {
      this.runtime.movementOccupancyService?.releaseDestination(actorId);
      this.runtime.movementOccupancyService?.reserveDestination(actorId, footprint, heightLayer);
    }
    // Reserve the escape slot before repathing so another actor cannot claim it
    // while this unit is recalculating its route.
    const recovered = await this.repathToDestination(fallbackTile, config, recoveryState, queryContext, "fallback");
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
    const currentTile = getGameObjectCurrentTile(this.runtime.gameObject);
    const navigationService = this.runtime.navigationService;
    const movementOccupancy = this.runtime.movementOccupancyService;
    const actorId = getActorComponent(this.runtime.gameObject, IdComponent)?.id;
    if (!currentTile || !navigationService || !movementOccupancy || !actorId) return undefined;

    const terrainType =
      this.runtime.actorTranslateComponent?.actorTranslateDefinition.movementTerrainType ?? MovementTerrainType.Ground;
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
        const footprint = movementOccupancy.getActorFootprintAtTile(this.runtime.gameObject, candidate);
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
}
