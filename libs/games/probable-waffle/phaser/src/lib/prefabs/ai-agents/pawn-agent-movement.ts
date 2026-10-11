import { MovementQueryObservation } from "../../entity/systems/movement-query-observation";
import Phaser from "phaser";
import { State } from "mistreevous";
import type { IPlayerPawnControllerAgent, PlayerPawnRangeType } from "./player-pawn-ai-controller.agent.interface";
import { getActorComponent } from "../../data/actor-component";
import { DistanceHelper } from "../../library/distance-helper";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { getActorSystem } from "../../data/actor-system";
import { getRandomTileInNavigableRadius, MovementSystem } from "../../entity/systems/movement.system";
import { OrderType } from "../../ai/order-type";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { GathererComponent } from "../../entity/components/resource/gatherer-component";
import type { Vector2Simple, Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { ResourceDrainComponent } from "../../entity/components/resource/resource-drain-component";
import { BuilderComponent } from "../../entity/components/construction/builder-component";
import { OrderData } from "../../ai/OrderData";
import { HealingComponent } from "../../entity/components/combat/components/healing-component";
import type { PathMoveConfig } from "@fuzzy-waddle/probable-waffle-gameplay/entity/systems/path-move-config";

/** Owns native range/reachability probes and movement actions. Each method keeps its own order reads across awaits.
 * Actor-local collaborators own no subscriptions, timers or saved state; the controller owns their lifetime.
 */
export class PawnAgentMovement {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly blackboard: PawnAiBlackboard,
    private readonly agent: Pick<IPlayerPawnControllerAgent, "Stop" | "MoveToTarget" | "MoveToLocation">,
    private readonly closestAttackableEnemy: () => Phaser.GameObjects.GameObject | null
  ) {}

  /** A native range probe; a returned route is used only for distance, never executed here. */
  async InRange(type: PlayerPawnRangeType): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) {
      // console.log("[Build] InRange: No current order");
      return State.FAILED;
    }
    const targetGameObject = currentOrder.data.targetGameObject;
    const targetLocation = currentOrder.data.targetTileLocation;
    const range = this.getRangeToTarget(type);
    if (range === undefined) {
      // console.log("[Build] InRange: Range undefined for type", type);
      return State.FAILED;
    }
    if (targetGameObject) {
      const movementSystem = getActorSystem(this.gameObject, MovementSystem);
      let distance: null | number;
      if (movementSystem) {
        const nrTiles = await movementSystem.getPathToClosestNavigableTileBetweenGameObjectsInRadius(
          targetGameObject,
          range,
          MovementQueryObservation.capture(this.gameObject, this.blackboard, currentOrder, "range_probe")
        );
        if (nrTiles === null) {
          // Target is unreachable - this is handled by the behavior tree
          // console.log("[Build] InRange: Target unreachable (no path), type=", type);
          return State.FAILED;
        }
        distance = nrTiles.length;
      } else {
        distance = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, targetGameObject);
      }
      if (distance === null) {
        // console.log("[Build] InRange: Distance is null");
        return State.FAILED;
      }
      // noinspection UnnecessaryLocalVariableJS
      const result = distance <= range ? State.SUCCEEDED : State.FAILED;
      // console.log(
      //   "[Build] InRange: type=",
      //   type,
      //   "distance=",
      //   distance,
      //   "range=",
      //   range,
      //   "result=",
      //   result === State.SUCCEEDED ? "SUCCEEDED" : "FAILED"
      // );

      return result;
    } else if (targetLocation) {
      const movementSystem = getActorSystem(this.gameObject, MovementSystem);
      if (!movementSystem) return State.FAILED;
      const distance = DistanceHelper.getTileDistanceBetweenGameObjectAndTile(this.gameObject, targetLocation);
      if (distance === null) return State.FAILED;
      return distance <= range ? State.SUCCEEDED : State.FAILED;
    } else {
      return State.FAILED;
    }
  }

  private getRangeToTarget(type: PlayerPawnRangeType): number | undefined {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return undefined;

    const targetGameObject = currentOrder.data.targetGameObject;
    const targetLocation = currentOrder.data.targetTileLocation;
    if (targetGameObject) {
      switch (type) {
        case "move":
          return 0;
        case "attack":
          return getActorComponent(this.gameObject, AttackComponent)?.getAttackRange(targetGameObject);
        case "gather":
          return getActorComponent(this.gameObject, GathererComponent)?.getGatherRange(targetGameObject);
        case "dropOff":
          return getActorComponent(targetGameObject, ResourceDrainComponent)?.getDropOffRange();
        case "construct":
          return getActorComponent(this.gameObject, BuilderComponent)?.getConstructionRange();
        case "heal":
          return getActorComponent(this.gameObject, HealingComponent)?.getHealRange();
        case "repair":
          return getActorComponent(this.gameObject, BuilderComponent)?.getRepairRange();
        default:
          throw new Error("Invalid range type");
      }
    } else if (targetLocation) {
      // range to location is always 0
      return 0;
    }
    return undefined;
  }

  /** Retains the selected target across the separately awaited reachability probe. */
  async MoveToTarget(type: PlayerPawnRangeType): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) {
      // console.log("[Build] MoveToTarget: No current order");
      return State.FAILED;
    }
    const target = currentOrder.data.targetGameObject;
    if (!target) {
      // console.log("[Build] MoveToTarget: No target");
      return State.FAILED;
    }
    const range = this.getRangeToTarget(type);
    if (range === undefined) {
      // console.log("[Build] MoveToTarget: Range undefined");
      return State.FAILED;
    }
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) {
      // console.log("[Build] MoveToTarget: No movement system");
      return State.FAILED;
    }
    try {
      const canMoveToTarget = await this.CanMoveToTarget(range);
      if (!canMoveToTarget) {
        // console.log("[Build] MoveToTarget: Cannot move to target (unreachable), type=", type);
        this.stopFailedMove(currentOrder);
        return State.FAILED;
      }
      // console.log("[Build] MoveToTarget: Moving to target, type=", type);
      const success = await movementSystem.moveToActorByAdjustingPathDynamically(
        target,
        {
          radiusTilesAroundDestination: range,
          onUpdateThrottled: () => {
            // if the target is not alive, stop moving
            const healthComponent = getActorComponent(target, HealthComponent);
            if (healthComponent && healthComponent.killed) {
              this.agent.Stop("MoveToTarget");
            }
          }
        } satisfies Partial<PathMoveConfig>,
        MovementQueryObservation.capture(this.gameObject, this.blackboard, currentOrder, "actor_movement")
      );
      // console.log("[Build] MoveToTarget: Movement result=", success ? "SUCCESS" : "FAILED");
      if (!success) this.stopFailedMove(currentOrder);
      return success ? State.SUCCEEDED : State.FAILED;
    } catch (e) {
      console.error("[Build] MoveToTarget: Error", e);
      this.stopFailedMove(currentOrder);
      return State.FAILED;
    }
  }

  async MoveToTargetOrLocation(type: PlayerPawnRangeType): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    const location = currentOrder.data.targetTileLocation;
    if (target) {
      return await this.agent.MoveToTarget(type);
    } else if (location) {
      return await this.agent.MoveToLocation();
    } else {
      return Promise.resolve(State.FAILED);
    }
  }

  /** The attack-move callback mutates this invocation's order and cancels its native movement. */
  async MoveToLocation() {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const location = currentOrder.data.targetTileLocation;
    if (!location) return State.FAILED;
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;
    try {
      // Attack-move support: while moving to location during an Attack order (without a target yet),
      // acquire the first visible enemy and cancel movement so the tree can proceed to attack.
      const isAttackMove = currentOrder.orderType === OrderType.Attack && !currentOrder.data.targetGameObject;
      let success: boolean;
      if (isAttackMove) {
        success = await movementSystem.moveToLocationByFollowingStaticPath(
          location,
          {
            onUpdateThrottled: () => {
              const enemy = this.closestAttackableEnemy();
              if (enemy) {
                currentOrder.data.targetGameObject = enemy;
                movementSystem.cancelMovement();
              }
            }
          } satisfies Partial<PathMoveConfig>,
          MovementQueryObservation.capture(this.gameObject, this.blackboard, currentOrder, "location_movement")
        );
      } else {
        success = await movementSystem.moveToLocationByFollowingStaticPath(
          location,
          undefined,
          MovementQueryObservation.capture(this.gameObject, this.blackboard, currentOrder, "location_movement")
        );
      }
      if (!success) this.stopFailedMove(currentOrder);
      return success ? State.SUCCEEDED : State.FAILED;
    } catch (e) {
      // console.error("Error in MoveToLocation", e);
      if (this.blackboard.getCurrentOrder() === currentOrder) this.agent.Stop("MoveToLocation");
      return State.FAILED;
    }
  }

  /** A refused Move is terminal, not progress. Late returns cannot stop a replacement or an attack/gather cycle. */
  private stopFailedMove(order: OrderData): void {
    if (
      order.orderType === OrderType.Move &&
      this.blackboard.getCurrentOrder() === order &&
      this.gameObject.active &&
      this.gameObject.scene?.sys.isActive()
    ) {
      this.agent.Stop("Move - Movement Failed");
    }
  }

  private async CanMoveToTarget(range: number): Promise<boolean> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return Promise.resolve(false);
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return Promise.resolve(false);
    // noinspection UnnecessaryLocalVariableJS
    return await movementSystem.canMoveTo(
      target,
      range,
      MovementQueryObservation.capture(this.gameObject, this.blackboard, currentOrder, "reachability_probe")
    );
  }

  /**
   * Command the agent to move randomly within the specified range
   */
  async AssignMoveRandomlyInRange(range: number) {
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;
    let randomTile: Vector2Simple | null = null;
    try {
      randomTile = await getRandomTileInNavigableRadius(this.gameObject, range);
      if (!randomTile) return State.FAILED;
    } catch (e) {
      return State.FAILED;
    }
    const targetLocation = { x: randomTile.x, y: randomTile.y, z: 0 } satisfies Vector3Simple;
    this.blackboard.addOrder(new OrderData(OrderType.Move, { targetTileLocation: targetLocation }));
    return State.SUCCEEDED;
  }
}
