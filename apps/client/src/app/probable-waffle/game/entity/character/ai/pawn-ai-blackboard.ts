import { Blackboard } from "./blackboard";
import { OrderData } from "./OrderData";

export class PawnAiBlackboard extends Blackboard {
  private orderQueue: OrderData[] = [];
  private currentOrder?: OrderData;
  private memory: Map<string, any> = new Map();
  private status: "idle" | "executing" | "paused" = "idle";
  private failedOrders: OrderData[] = [];

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

  resetCurrentOrder(): void {
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
}
