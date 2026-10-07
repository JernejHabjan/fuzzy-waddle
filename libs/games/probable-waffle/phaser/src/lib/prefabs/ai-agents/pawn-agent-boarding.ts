import type { IPlayerPawnControllerAgent } from "./player-pawn-ai-controller.agent.interface";
import Phaser from "phaser";
import { State } from "mistreevous";
import { getActorComponent } from "../../data/actor-component";
import { DistanceHelper } from "../../library/distance-helper";
import { getActorSystem } from "../../data/actor-system";
import { MovementSystem } from "../../entity/systems/movement.system";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { ContainableComponent } from "../../entity/components/building/containable-component";
import { ContainerComponent } from "../../entity/components/building/container-component";
import type { PathMoveConfig } from "@fuzzy-waddle/probable-waffle-gameplay/entity/systems/path-move-config";
import { NavigationService } from "../../world/services/navigation.service";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { isWaterUnit } from "../../data/game-object-helper";

/** Owns passenger/container shore rendezvous, boarding requests and their native cleanup order.
 * Actor-local collaborators own no subscriptions, timers or saved state; the controller owns their lifetime.
 */
export class PawnAgentBoarding {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly blackboard: PawnAiBlackboard,
    private readonly agent: Pick<IPlayerPawnControllerAgent, "CanBoardContainerNow">
  ) {}

  HasContainableComponent(): boolean {
    return !!getActorComponent(this.gameObject, ContainableComponent);
  }

  /** True if self is a water-terrain unit (e.g. a transport boat). */
  IsWaterUnit(): boolean {
    return isWaterUnit(this.gameObject);
  }

  /** True if the current order's target container is a water-terrain unit (e.g. a transport boat). */
  IsWaterContainerTarget(): boolean {
    const target = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    return !!target && isWaterUnit(target);
  }

  IsAlreadyInContainer(): boolean {
    return getActorComponent(this.gameObject, ContainableComponent)?.isContained() ?? false;
  }

  /** True if self is adjacent to the target container and the container still has capacity. */
  CanBoardContainerNow(): boolean {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;

    const containerComp = getActorComponent(target, ContainerComponent);
    if (!containerComp || !containerComp.canLoadGameObject(this.gameObject)) return false;

    // Unit must be within boarding range (adjacent tile) of the container
    const dist = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, target);
    return dist !== null && dist <= 1;
  }

  /** Load self into the target container and cancel any pending boarding request. */
  BoardContainer(): State {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;

    const containerComp = getActorComponent(target, ContainerComponent);
    if (!containerComp) return State.FAILED;
    if (!containerComp.canLoadGameObject(this.gameObject)) return State.FAILED;

    containerComp.cancelBoardingRequest(this.gameObject);
    containerComp.loadGameObject(this.gameObject);
    getActorComponent(this.gameObject, ContainableComponent)?.setContainer(target);
    return State.SUCCEEDED;
  }

  /**
   * Try to walk directly adjacent to the container using land pathfinding.
   * Succeeds when the unit is (or gets) within boarding range of the ship.
   * Fast-fails for water containers (boats in deep water) so the MDSL selector
   * falls through immediately to MoveToNearestShoreForContainer.
   */
  async MoveAdjacentToContainer(): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;

    // Water units cannot be reached via land pathfinding — skip the walk attempt
    if (isWaterUnit(target)) return State.FAILED;

    // Already adjacent — skip movement entirely
    if (this.agent.CanBoardContainerNow()) return State.SUCCEEDED;

    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;

    try {
      const success = await movementSystem.moveToActorByAdjustingPathDynamically(target, {
        radiusTilesAroundDestination: 1
      } satisfies Partial<PathMoveConfig>);
      // Movement may return false when path is empty (unit already at destination tile).
      // Accept that case too if we're now within boarding range.
      return success || this.agent.CanBoardContainerNow() ? State.SUCCEEDED : State.FAILED;
    } catch {
      return State.FAILED;
    }
  }

  /**
   * Fallback for when the container is not directly reachable (deep water).
   * Finds the meeting point (water-side shore tile + adjacent land tile), registers the boarding
   * request immediately so the boat starts heading to shore in parallel, then walks to the land tile.
   * Cancels the request if movement fails.
   */
  async MoveToNearestShoreForContainer(): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;

    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;

    const navService = getSceneService(this.gameObject.scene, NavigationService);
    if (!navService) return State.FAILED;

    // Find the nearest shore tile (water-side) from the ship's current position
    const shipTile = navService.getCenterTileCoordUnderObject(target);
    if (!shipTile) return State.FAILED;

    const shoreTile = navService.findNearestShoreTile(shipTile);
    if (!shoreTile) return State.FAILED;

    // Shore tile is a water tile — the ground unit must walk to the adjacent land tile instead
    const groundMeetingPoint = navService.findGroundTileAdjacentToShoreTile(shoreTile);
    if (!groundMeetingPoint) return State.FAILED;

    const containerComp = getActorComponent(target, ContainerComponent);
    const containableComp = getActorComponent(this.gameObject, ContainableComponent);

    // Register boarding intent NOW so the boat starts navigating to shore in parallel
    // while this unit is still walking to the meeting point.
    // Pass the water-side shore tile so boat and unit converge on the same spot.
    if (containerComp) {
      containerComp.registerBoardingRequest(this.gameObject, shoreTile);
      if (containableComp) containableComp.pendingContainerBoardingRequest = target;
    }

    const shoreLocation: Vector3Simple = { x: groundMeetingPoint.x, y: groundMeetingPoint.y, z: 0 };
    const success = await movementSystem.moveToLocationByFollowingStaticPath(shoreLocation);

    if (!success && containerComp) {
      // Clean up if we couldn't reach the shore
      containerComp.cancelBoardingRequest(this.gameObject);
      if (containableComp) containableComp.pendingContainerBoardingRequest = null;
    }

    return success ? State.SUCCEEDED : State.FAILED;
  }

  HasContainerComponent(): boolean {
    return !!getActorComponent(this.gameObject, ContainerComponent);
  }

  HasPendingBoarders(): boolean {
    return getActorComponent(this.gameObject, ContainerComponent)?.hasPendingBoarders() ?? false;
  }

  /**
   * Navigate the container actor to the shore tile where the first pending boarder is waiting.
   * Uses the pre-agreed shore tile stored on the boarding request when available, so the boat
   * converges on the exact same tile the boarder already walked to.
   * Falls back to finding the nearest shore to the boarder's current position otherwise.
   */
  async MoveToShoreForBoarding(): Promise<State> {
    const containerComp = getActorComponent(this.gameObject, ContainerComponent);
    if (!containerComp) return State.FAILED;
    const boarders = containerComp.getPendingBoarders();
    if (boarders.length === 0) return State.FAILED;

    const navService = getSceneService(this.gameObject.scene, NavigationService);
    if (!navService) return State.FAILED;
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;

    const firstBoarder = boarders[0]!;
    // Prefer the shore tile the boarder pre-negotiated when it registered
    let shoreTile = containerComp.getTargetShoreForBoarder(firstBoarder);
    if (!shoreTile) {
      const boarderTile = navService.getCenterTileCoordUnderObject(firstBoarder);
      if (!boarderTile) return State.FAILED;
      shoreTile = navService.findNearestShoreTile(boarderTile) ?? undefined;
    }
    if (!shoreTile) return State.FAILED;

    const shoreLocation: Vector3Simple = { x: shoreTile.x, y: shoreTile.y, z: 0 };
    const success = await movementSystem.moveToLocationByFollowingStaticPath(shoreLocation);
    return success ? State.SUCCEEDED : State.FAILED;
  }

  /**
   * When self (container actor) is on a shore tile, load all pending boarders that are
   * adjacent (within boarding range) of the container.
   */
  LoadPendingBoarders(): State {
    const containerComp = getActorComponent(this.gameObject, ContainerComponent);
    if (!containerComp) return State.FAILED;

    const navService = getSceneService(this.gameObject.scene, NavigationService);
    if (!navService) return State.FAILED;

    const selfTile = navService.getCenterTileCoordUnderObject(this.gameObject);
    if (!selfTile || !navService.isShoreTile(selfTile)) return State.FAILED;

    const boarders = containerComp.getPendingBoarders();
    let loaded = 0;
    for (const boarder of boarders) {
      if (!containerComp.canLoadGameObject(boarder)) continue;
      // Boarder must be within boarding range of the container (adjacent tile)
      const dist = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, boarder);
      if (dist === null || dist > 2) continue;
      containerComp.cancelBoardingRequest(boarder);
      containerComp.loadGameObject(boarder);
      getActorComponent(boarder, ContainableComponent)?.setContainer(this.gameObject);
      loaded++;
    }

    return loaded > 0 ? State.SUCCEEDED : State.FAILED;
  }

}
