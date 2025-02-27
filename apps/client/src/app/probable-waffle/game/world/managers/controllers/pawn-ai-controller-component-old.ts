import { OrderData_old } from "../../../entity/character/ai/order-data_old";
import { Queue } from "../../../library/queue";
import { OrderType } from "../../../entity/character/ai/order-type";
import { PawnAiBlackboard } from "../../../entity/character/ai/pawn-ai-blackboard";
import { PawnBehaviorTree } from "../../../entity/character/ai/behavior-trees";
import { GathererComponent } from "../../../entity/actor/components/gatherer-component";
import { getActorComponent } from "../../../data/actor-component";
import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import GameObject = Phaser.GameObjects.GameObject;

export class PawnAiControllerComponentOld {
  // declare queue of OrderData
  orders: Queue<OrderData_old> = new Queue<OrderData_old>();

  constructor(
    private readonly gameObject: GameObject,
    public blackboard: PawnAiBlackboard,
    public behaviorTree: PawnBehaviorTree
  ) {
    this.init();
  }

  init(): void {
    this.behaviorTree.run();
  }

  /**
   * look for a feasible target in its acquisition radius // circle overlap gameObjects
   */
  findTargetInAcquisitionRadius(): void {}

  getCurrentOrder(): OrderType | undefined {
    return undefined;
  }

  addOrder(order: OrderData_old): void {
    if (!order.orderType) {
      return;
    }
    this.orders.enqueueBack(order);
  }

  insertOrder(order: OrderData_old): void {
    this.orders.enqueueBack(order);

    this.obtainNextOrder();
  }

  hasOrderByClass(orderType: OrderType): boolean {
    return this.getCurrentOrder() === orderType;
  }

  hasOrderQueue(): boolean {
    return !this.orders.isEmpty();
  }

  isIdle() {
    return this.hasOrderByClass(OrderType.Stop);
  }

  issueOrder(orderData: OrderData_old) {
    console.log("issueOrder", orderData);
    this.orders.empty();
    this.addOrder(orderData);
    this.obtainNextOrder();
  }

  issueAttackOrder(target: GameObject) {
    const orderData: OrderData_old = {
      orderType: OrderType.Attack,
      targetGameObject: target
    };

    this.issueOrder(orderData);
  }

  issueBeginConstructionOrder(constructableBuildingClass: string, targetLocation: Vector3Simple) {
    const orderData: OrderData_old = {
      orderType: OrderType.BeginConstruction,
      targetLocation,
      args: [constructableBuildingClass] as any
    };
    this.issueOrder(orderData);
  }

  issueContinueConstructionOrder(constructionSite: GameObject) {
    const orderData: OrderData_old = {
      orderType: OrderType.ContinueConstruction,
      targetGameObject: constructionSite
    };
    this.issueOrder(orderData);
  }

  issueGatherOrder(resourceSource: GameObject) {
    const orderData: OrderData_old = {
      orderType: OrderType.Gather,
      targetGameObject: resourceSource
    };
    this.issueOrder(orderData);
  }

  insertContinueGathersOrder(): boolean {
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) {
      return false;
    }
    const resourceSource = gathererComponent.getPreferredResourceSource();
    if (!resourceSource) {
      return false;
    }
    const orderData: OrderData_old = {
      orderType: OrderType.Gather,
      targetGameObject: resourceSource
    };
    this.insertOrder(orderData);

    return true;
  }

  issueMoveOrder(vector3: Vector3Simple) {
    const orderData: OrderData_old = {
      orderType: OrderType.Move,
      targetLocation: vector3
    };
    this.issueOrder(orderData);
  }

  issueReturnResourcesOrder() {
    const orderData = this.composeReturnResourcesOrder();
    if (!orderData) {
      return;
    }
    this.issueOrder(orderData);
  }

  insertReturnResourcesOrder() {
    const orderData = this.composeReturnResourcesOrder();
    if (!orderData) {
      return;
    }
    this.insertOrder(orderData);
  }

  issueStopOrder() {
    const orderData: OrderData_old = {
      orderType: OrderType.Stop
    };
    this.issueOrder(orderData);
  }

  obtainNextOrder() {
    if (this.orders.isEmpty()) {
      return;
    }
    const orderData = this.orders.dequeueFront();
    if (!orderData) {
      return;
    }
    // this.blackboard.aiOrderType = orderData.orderType;
    // this.blackboard.targetGameObject = orderData.targetGameObject;
    // this.blackboard.targetLocation = orderData.targetLocation;
  }

  private composeReturnResourcesOrder(): OrderData_old | null {
    const gathererComponent = getActorComponent(this.gameObject, GathererComponent);
    if (!gathererComponent) {
      return null;
    }
    const resourceDrain = gathererComponent.findClosestResourceDrain();
    if (!resourceDrain) {
      return null;
    }
    const orderData: OrderData_old = {
      orderType: OrderType.ReturnResources,
      targetGameObject: resourceDrain
    };
    return orderData;
  }
}
