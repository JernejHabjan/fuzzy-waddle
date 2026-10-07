import Phaser from "phaser";
import { State } from "mistreevous";
import { getActorComponent } from "../../data/actor-component";
import { AttackComponent } from "../../entity/components/combat/components/attack-component";
import { getActorSystem } from "../../data/actor-system";
import { MovementSystem } from "../../entity/systems/movement.system";
import { OrderLabelToTypeMap, OrderType } from "../../ai/order-type";
import { PawnAiBlackboard } from "./pawn-ai-blackboard";
import { HealthComponent } from "../../entity/components/combat/components/health-component";
import { ContainableComponent } from "../../entity/components/building/containable-component";
import { ContainerComponent } from "../../entity/components/building/container-component";
import { BuilderComponent } from "../../entity/components/construction/builder-component";
import { OrderData } from "../../ai/OrderData";
import { AnimationActorComponent } from "../../entity/components/animation/animation-actor-component";
import { TendableComponent } from "../../entity/components/tendable/tendable-component";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { CommandBusService } from "../../world/services/multiplayer/command-bus.service";
import { classifyPlayerPawnOrderTerminalOutcome } from "./player-pawn-order-terminal-outcome";

/** Owns native queue selection, stop cleanup and terminal reporting. No state is copied from the shared blackboard.
 * Actor-local collaborators own no subscriptions, timers or saved state; the controller owns their lifetime.
 */
export class PawnAgentOrders {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly blackboard: PawnAiBlackboard
  ) {}

  OrderExistsInQueue() {
    return this.blackboard.anyOrderInQueue();
  }

  AssignNextOrderFromQueue() {
    const playerOrder = this.blackboard.peekNextPlayerOrder();
    if (!playerOrder) return State.FAILED;
    this.blackboard.setCurrentOrder(playerOrder);
    // Cancel any pending boarding request when starting a non-boarding order
    if (playerOrder.orderType !== OrderType.EnterContainer) {
      getActorComponent(this.gameObject, ContainableComponent)?.cancelAnyPendingBoardingRequest();
    }
    return State.SUCCEEDED;
  }

  PlayerOrderIs(orderType: string) {
    const currentOrder = this.blackboard.getCurrentOrder();
    return currentOrder?.orderType === OrderLabelToTypeMap[orderType];
  }

  /** Cleans native assignments, resets/reports the captured order, then pops the queue in the original order. */
  Stop = (fromNode: string) => {
    // console.log(`Stop called from: ${fromNode}`);

    const currentOrder = this.blackboard.getCurrentOrder();
    if (currentOrder) {
      if (currentOrder.orderType !== OrderType.EnterContainer) {
        // Exit any container the actor is in for non-boarding orders
        const containableComponent = getActorComponent(this.gameObject, ContainableComponent);
        if (containableComponent) {
          containableComponent.leaveContainer();
        }
        // Also cancel any pending boarding request registered while walking to shore
        getActorComponent(this.gameObject, ContainableComponent)?.cancelAnyPendingBoardingRequest();
      } else if (fromNode !== "EnterContainer:MovedToShore") {
        // EnterContainer order cancelled before the unit reached shore — cancel boarding request
        const target = currentOrder.data.targetGameObject;
        if (target) {
          getActorComponent(target, ContainerComponent)?.cancelBoardingRequest(this.gameObject);
        }
      }
      // Unassign from any farm being tended
      const tendableTarget = currentOrder.data.targetGameObject;
      if (tendableTarget) {
        getActorComponent(tendableTarget, TendableComponent)?.unassignTender(this.gameObject);
      }

      switch (currentOrder.orderType) {
        case OrderType.Move:
          // movement cancelled below
          break;
        case OrderType.Build:
          const builderComponent = getActorComponent(this.gameObject, BuilderComponent);
          if (builderComponent) {
            builderComponent.leaveConstructionSite();
          }
          break;
        case OrderType.Repair:
          const builderComponent2 = getActorComponent(this.gameObject, BuilderComponent);
          if (builderComponent2) {
            builderComponent2.leaveRepairSite();
          }
          break;
      }

      // cancel any ongoing attack (e.g., active projectile flight)
      const attackComponent = getActorComponent(this.gameObject, AttackComponent);
      if (attackComponent) {
        attackComponent.cancelCurrentAttack();
      }

      this.blackboard.resetCurrentOrder(false);
      this.reportOrderTerminalOutcome(currentOrder, fromNode);
      const animationActorComponent = getActorComponent(this.gameObject, AnimationActorComponent);
      if (animationActorComponent) {
        const healthComponent = getActorComponent(this.gameObject, HealthComponent);
        if (!healthComponent || healthComponent.alive) animationActorComponent.playOrderAnimation(OrderType.Stop);
      }
      const movementSystem = getActorSystem(this.gameObject, MovementSystem);
      movementSystem?.cancelMovement();
    }

    this.blackboard.popCurrentOrderFromQueue();
    return State.SUCCEEDED;
  };

  private reportOrderTerminalOutcome(order: OrderData | undefined, reason: string): void {
    const context = order?.data.commandContext;
    if (!context) return;
    const actorId = getActorComponent(this.gameObject, IdComponent)?.id;
    const tick = getSceneService(this.gameObject.scene, SimulationTickService)?.currentTick ?? 0;
    const terminal = classifyPlayerPawnOrderTerminalOutcome(reason);
    getSceneService(this.gameObject.scene, CommandBusService)?.reportPersistedOutcome({
      schemaVersion: 1,
      kind: terminal.kind,
      reason: terminal.reason,
      tick,
      playerNumber: context.playerNumber,
      commandId: context.execution.commandId,
      commitmentKey: context.execution.commitmentKey,
      authorityEpoch: context.execution.authorityEpoch,
      sequence: context.execution.sequence,
      ...(context.execution.intentId ? { intentId: context.execution.intentId } : {}),
      ...(context.execution.effectId ? { effectId: context.execution.effectId } : {}),
      actorIds: actorId ? [actorId] : [],
      worldLinkIds: [],
      detail: reason
    });
  }

  /** Settles every still-addressed order before this actor leaves the world. */
  reportInterruptedOrdersOnShutdown(): void {
    if (!this.gameObject.scene.sys.isActive()) return;
    const orders = [this.blackboard.getCurrentOrder(), ...this.blackboard.getQueuedOrders()].filter(
      (order): order is OrderData => order !== undefined
    );
    const commandIds = new Set<string>();
    for (const order of orders) {
      const commandId = order.data.commandContext?.execution.commandId;
      if (!commandId || commandIds.has(commandId)) continue;
      commandIds.add(commandId);
      this.reportOrderTerminalOutcome(order, "actor destroyed before order completion");
    }
  }

}
