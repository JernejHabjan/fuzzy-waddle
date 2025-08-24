import { Blackboard } from "./blackboard";
import { OrderData } from "./OrderData";

export class PawnAiBlackboard extends Blackboard {
  private orderQueue: OrderData[] = [];
  private currentOrder?: OrderData;
  private memory: Map<string, any> = new Map();
  private status: "idle" | "executing" | "paused" = "idle";
  private failedOrders: OrderData[] = [];
  cancellationHandler?: () => void;

  getStatus(): string {
    return this.status;
  }

  setStatus(newStatus: "idle" | "executing" | "paused"): void {
    this.status = newStatus;
  }

  addOrder(order: OrderData): void {
    this.orderQueue.push(order);
  }

  anyOrderInQueue(): boolean {
    return !!this.orderQueue.length;
  }

  pullNextPlayerOrder(): OrderData | undefined {
    return this.orderQueue.shift();
  }

  peekNextPlayerOrder(): OrderData | undefined {
    if (this.orderQueue.length) {
      return this.orderQueue[0];
    }
    return undefined;
  }

  getCurrentOrder(): OrderData | undefined {
    return this.currentOrder;
  }

  setCurrentOrder(order?: OrderData): void {
    this.currentOrder = order;
  }

  resetAll(): void {
    this.orderQueue = [];
    this.resetCurrentOrder();
    this.memory.clear();
    this.failedOrders = [];
    this.status = "idle";
  }

  overrideOrderQueueAndActiveOrder(orderData: OrderData): void {
    this.resetCurrentOrder();
    this.orderQueue = [orderData];
  }

  resetCurrentOrder(callCancellationHandler: boolean = true): void {
    if (callCancellationHandler) {
      this.cancellationHandler?.();
    }
    this.currentOrder = undefined;
  }

  remember<T>(key: string, value: T): void {
    this.memory.set(key, value);
  }

  recall<T>(key: string): T | undefined {
    return this.memory.get(key);
  }

  forget(key: string): void {
    this.memory.delete(key);
  }

  addFailedOrder(order: OrderData): void {
    this.failedOrders.push(order);
  }

  getFailedOrders(): OrderData[] {
    return [...this.failedOrders];
  }

  popCurrentOrderFromQueue() {
    this.pullNextPlayerOrder();
  }

  getData(): Record<string, any> {
    return {
      orderQueue: this.orderQueue,
      currentOrder: this.currentOrder,
      memory: Array.from(this.memory.entries()).reduce(
        (obj, [key, value]) => {
          obj[key] = value;
          return obj;
        },
        {} as Record<string, any>
      ),
      status: this.status,
      failedOrders: this.failedOrders
    };
  }
  setData(data: Partial<Record<string, any>>): void {
    if (data.orderQueue) {
      this.orderQueue = data.orderQueue;
    }
    if (data.currentOrder) {
      this.currentOrder = data.currentOrder;
    }
    if (data.memory) {
      this.memory = new Map(Object.entries(data.memory));
    }
    if (data.status) {
      this.status = data.status;
    }
    if (data.failedOrders) {
      this.failedOrders = data.failedOrders;
    }
  }
}
