import { BehaviorTree } from '../characters/AI/BehaviorTree';
import { Blackboard } from '../characters/AI/blackboard';
import { IComponent } from '../services/component.service';
import { Actor } from '../actor';
import { TilePlacementData } from '../input/tilemap/tilemap-input.handler';
import { OrderData } from '../characters/AI/order-data';
import { Queue } from '../kismet/queue';
import { BeginConstructionArgs, OrderType } from '../characters/AI/order-type';
import { ActorsAbleToBeBuiltClass } from '../characters/builder-component';
import { GathererComponent } from '../characters/gatherer-component';

export interface IPawnAiControllable {
  pawnAiControllerComponent: PawnAiControllerComponent;
}

export class PawnAiControllerComponent implements IComponent {
  // declare queue of OrderData
  orders: Queue<OrderData> = new Queue<OrderData>();

  constructor(private owner: Actor, public blackboard: Blackboard, public behaviorTree: BehaviorTree) {}

  init(): void {
    this.behaviorTree.run();
  }

  /**
   * look for a feasible target in its acquisition radius // circle overlap actors
   */
  findTargetInAcquisitionRadius(): void {
    // todo
  }

  getCurrentOrder(): OrderType | undefined {
    return this.blackboard.orderType;
  }

  addOrder(order: OrderData): void {
    if (!order.orderType) {
      return;
    }
    this.addOrder(order);
  }

  insertOrder(order: OrderData): void {
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

  issueOrder(orderData: OrderData) {
    console.log('issueOrder', orderData);
    this.orders.empty();
    this.addOrder(orderData);
    this.obtainNextOrder();
  }

  issueAttackOrder(target: Actor) {
    const orderData: OrderData = {
      orderType: OrderType.Attack,
      targetActor: target
    };

    this.issueOrder(orderData);
  }

  issueBeginConstructionOrder(constructableBuildingClass: ActorsAbleToBeBuiltClass, targetLocation: TilePlacementData) {
    const orderData: OrderData = {
      orderType: OrderType.BeginConstruction,
      targetLocation,
      args: [constructableBuildingClass] as BeginConstructionArgs
    };
    this.issueOrder(orderData);
  }

  issueContinueConstructionOrder(constructionSite: Actor) {
    const orderData: OrderData = {
      orderType: OrderType.ContinueConstruction,
      targetActor: constructionSite
    };
    this.issueOrder(orderData);
  }

  issueGatherOrder(resourceSource: Actor) {
    const orderData: OrderData = {
      orderType: OrderType.Gather,
      targetActor: resourceSource
    };
    this.issueOrder(orderData);
  }

  insertContinueGathersOrder(): boolean {
    const gathererComponent = this.owner.components.findComponentOrNull(GathererComponent);
    if (!gathererComponent) {
      return false;
    }
    const resourceSource = gathererComponent.getPreferredResourceSource();
    if (!resourceSource) {
      return false;
    }
    const orderData: OrderData = {
      orderType: OrderType.Gather,
      targetActor: resourceSource
    };
    this.insertOrder(orderData);

    return true;
  }

  issueMoveOrder(tilePlacementData: TilePlacementData) {
    const orderData: OrderData = {
      orderType: OrderType.Move,
      targetLocation: tilePlacementData
    };
    this.issueOrder(orderData);
  }

  private composeReturnResourcesOrder(): OrderData | null {
    const gathererComponent = this.owner.components.findComponentOrNull(GathererComponent);
    if (!gathererComponent) {
      return null;
    }
    const resourceDrain = gathererComponent.findClosestResourceDrain();
    if (!resourceDrain) {
      return null;
    }
    const orderData: OrderData = {
      orderType: OrderType.ReturnResources,
      targetActor: resourceDrain
    };
    return orderData;
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
    const orderData: OrderData = {
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
    this.blackboard.orderType = orderData.orderType;
    this.blackboard.targetActor = orderData.targetActor;
    this.blackboard.targetLocation = orderData.targetLocation;
  }
}
