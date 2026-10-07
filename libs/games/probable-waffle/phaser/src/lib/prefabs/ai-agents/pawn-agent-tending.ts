import Phaser from "phaser";
import { State } from "mistreevous";
import { getActorComponent } from "../../data/actor-component";
import { getActorSystem } from "../../data/actor-system";
import { MovementSystem } from "../../entity/systems/movement.system";
import { OrderType } from "../../ai/order-type";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { OrderData } from "../../ai/OrderData";
import { AnimationActorComponent } from "../../entity/components/animation/animation-actor-component";
import { TendableComponent } from "../../entity/components/tendable/tendable-component";
import { isCropResourceSource } from "../../entity/components/tendable/growth-stage.interface";
import { AnimationType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/animation/animation-type";
import { getGameObjectTileInRadius } from "../../data/game-object-helper";

/** Owns crop tending actions, presentation and post-construction Gather admission.
 * Actor-local collaborators own no subscriptions, timers or saved state; the controller owns their lifetime.
 */
export class PawnAgentTending {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly blackboard: PawnAiBlackboard
  ) {}

  TargetHasTendableComponent(): boolean {
    const target = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    if (!target) return false;
    return !!getActorComponent(target, TendableComponent);
  }

  GrowthReady(): boolean {
    const target = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    if (!target) return false;
    return getActorComponent(target, TendableComponent)?.isReadyForHarvest() ?? false;
  }

  GrowthPercentBelow(threshold: number): boolean {
    const target = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    if (!target) return false;
    const tendable = getActorComponent(target, TendableComponent);
    if (!tendable) return false;
    return tendable.growthPercent < threshold;
  }

  AssignSelfAsTender(): State {
    const target = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    if (!target) return State.FAILED;
    const tendable = getActorComponent(target, TendableComponent);
    if (!tendable) return State.FAILED;
    if (tendable.isTenderAssigned(this.gameObject)) return State.SUCCEEDED;
    if (!tendable.canAssignTender()) return State.FAILED;
    tendable.assignTender(this.gameObject);
    return State.SUCCEEDED;
  }

  UnassignSelfAsTender(): State {
    const target = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    if (target) {
      getActorComponent(target, TendableComponent)?.unassignTender(this.gameObject);
    }
    return State.SUCCEEDED;
  }

  async MoveToRandomSpotOnTarget(): Promise<State> {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    // Use the worker's MovementSystem — the field has none
    const movementSystem = getActorSystem(this.gameObject, MovementSystem);
    if (!movementSystem) return State.FAILED;
    try {
      // Use spatial (non-pathfinding) tile lookup — field's own tile may be blocked by its collider
      const randomTile = getGameObjectTileInRadius(target, 2);
      if (!randomTile) return State.FAILED;
      const success = await movementSystem.moveToLocationByFollowingStaticPath({
        x: randomTile.x,
        y: randomTile.y,
        z: 0
      });
      return success ? State.SUCCEEDED : State.FAILED;
    } catch {
      return State.FAILED;
    }
  }

  PlaySeedingAnimation(): State {
    getActorComponent(this.gameObject, AnimationActorComponent)?.playCustomAnimation(AnimationType.Thrust);
    return State.SUCCEEDED;
  }

  PlayTendingAnimation(): State {
    const target = this.blackboard.getCurrentOrder()?.data.targetGameObject;
    const anim = isCropResourceSource(target)
      ? (target.getActiveCropTendAnimation() ?? AnimationType.Dig)
      : AnimationType.Dig;
    getActorComponent(this.gameObject, AnimationActorComponent)?.playCustomAnimation(anim);
    return State.SUCCEEDED;
  }

  /**
   * After finishing construction of a tendable building (e.g. a Field), immediately
   * issue a Gather order on it so the builder begins tending/harvesting without
   * needing a manual command.  Always returns SUCCEEDED so the build sequence continues.
   */
  AutoAssignTendOrderIfTendable(): State {
    const currentOrder = this.blackboard.getCurrentOrder();
    const target = currentOrder?.data.targetGameObject;
    if (!target) return State.SUCCEEDED;
    if (!getActorComponent(target, TendableComponent)) return State.SUCCEEDED;
    this.blackboard.addOrder(new OrderData(OrderType.Gather, { targetGameObject: target }));
    return State.SUCCEEDED;
  }

}
