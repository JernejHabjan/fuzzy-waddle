import Phaser from "phaser";
import { State } from "mistreevous";
import type { PlayerPawnAiControllerAgent } from "./player-pawn-ai-controller.agent";
import { getActorComponent } from "../../data/actor-component";
import { OrderType } from "../../ai/order-type";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { ContainableComponent } from "../../entity/components/building/containable-component";
import { BuilderComponent } from "../../entity/components/construction/builder-component";
import { OrderData } from "../../ai/OrderData";
import { ConstructionSiteComponent } from "../../entity/components/construction/construction-site-component";

/** Owns building/repair actions and their native component admission checks.
 * Actor-local collaborators own no subscriptions, timers or saved state; the controller owns their lifetime.
 */
export class PawnAgentConstruction {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly blackboard: PawnAiBlackboard,
    private readonly agent: Pick<PlayerPawnAiControllerAgent, "SelfIsAlive">
  ) {}

  /**
   * Command the agent to leave a construction site or container
   */
  LeaveConstructionSiteOrCurrentContainer() {
    const containableComponent = getActorComponent(this.gameObject, ContainableComponent);
    if (!containableComponent) return State.SUCCEEDED;
    containableComponent.leaveContainer();
    return State.SUCCEEDED;
  }

  async AssignNextBuildOrder(): Promise<State> {
    const builderComponent = getActorComponent(this.gameObject, BuilderComponent);
    if (!builderComponent) {
      // console.log("[Build] AssignNextBuildOrder: No builder component");
      return State.FAILED;
    }
    const range = builderComponent.getConstructionSeekRange();
    const target = await builderComponent.getClosestConstructionSite(range);
    if (!target) {
      // console.log("[Build] AssignNextBuildOrder: No reachable construction site found");
      return State.FAILED;
    }
    // console.log("[Build] AssignNextBuildOrder: Found target", target);
    this.blackboard.addOrder(new OrderData(OrderType.Build, { targetGameObject: target }));

    return State.SUCCEEDED;
  }

  ConstructBuilding() {
    const builderComponent = getActorComponent(this.gameObject, BuilderComponent);
    if (!builderComponent) {
      // console.log("[Build] ConstructBuilding: No builder component");
      return State.FAILED;
    }
    if (!this.agent.SelfIsAlive()) {
      // console.log("[Build] ConstructBuilding: Self not alive");
      return State.FAILED;
    }
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) {
      // console.log("[Build] ConstructBuilding: No current order");
      return State.FAILED;
    }
    const target = currentOrder.data.targetGameObject;
    if (!target) {
      // console.log("[Build] ConstructBuilding: No target");
      return State.FAILED;
    }
    // Check if in range before trying to construct
    const constructionSiteComponent = getActorComponent(target, ConstructionSiteComponent);
    if (!constructionSiteComponent) {
      // console.log("[Build] ConstructBuilding: No construction site component");
      return State.FAILED;
    }
    if (!constructionSiteComponent.canAssignBuilder()) {
      // console.log("[Build] ConstructBuilding: Cannot assign builder");
      return State.FAILED;
    }
    if (builderComponent.remainingCooldown > 0) {
      // console.log("[Build] ConstructBuilding: Cooldown not ready");
      return State.FAILED;
    }
    // console.log("[Build] ConstructBuilding: Assigning to construction site", target);
    builderComponent.assignToConstructionSite(target);
    return State.SUCCEEDED;
  }

  CanAssignBuilder(): boolean {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) {
      // console.log("[Build] CanAssignBuilder: No current order");
      return false;
    }
    const target = currentOrder.data.targetGameObject;
    if (!target) {
      // console.log("[Build] CanAssignBuilder: No target");
      return false;
    }
    const constructionSiteComponent = getActorComponent(target, ConstructionSiteComponent);
    if (!constructionSiteComponent) {
      // console.log("[Build] CanAssignBuilder: No construction site component on target");
      return false;
    }
    // noinspection UnnecessaryLocalVariableJS
    const canAssign = constructionSiteComponent.canAssignBuilder();
    // console.log("[Build] CanAssignBuilder:", canAssign);
    return canAssign;
  }

  HasBuilderComponent(): boolean {
    return !!getActorComponent(this.gameObject, BuilderComponent);
  }

  ConstructionSiteFinished(): boolean {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    const constructionSiteComponent = getActorComponent(target, ConstructionSiteComponent);
    if (!constructionSiteComponent) return false;
    return constructionSiteComponent.isFinished;
  }
  TargetHealthFull(): boolean {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    const healthComponent = getActorComponent(target, HealthComponent);
    if (!healthComponent) return false;
    return healthComponent.healthIsFull;
  }
  RepairBuilding(): State {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return State.FAILED;
    if (!this.agent.SelfIsAlive()) return State.FAILED;
    const target = currentOrder.data.targetGameObject;
    if (!target) return State.FAILED;
    const targetHealth = getActorComponent(target, HealthComponent);
    if (targetHealth && !targetHealth.alive) return State.FAILED;
    const builderComponent = getActorComponent(this.gameObject, BuilderComponent);
    if (!builderComponent) return State.FAILED;
    const constructionSiteComponent = getActorComponent(target, ConstructionSiteComponent);
    if (!constructionSiteComponent) return State.FAILED;
    if (!constructionSiteComponent.canAssignRepairer()) return State.FAILED;
    if (builderComponent.remainingCooldown > 0) return State.FAILED;
    builderComponent.assignToRepairSite(target);
    return State.SUCCEEDED;
  }
  CanAssignRepairer(): boolean {
    const currentOrder = this.blackboard.getCurrentOrder();
    if (!currentOrder) return false;
    const target = currentOrder.data.targetGameObject;
    if (!target) return false;
    const constructionSiteComponent = getActorComponent(target, ConstructionSiteComponent);
    if (!constructionSiteComponent) return false;
    return constructionSiteComponent.canAssignRepairer();
  }

}
