import { OrderTargetData } from './order-target-data';
import { Actor } from '../../../actor';

export abstract class Order {
  protected constructor(private name: string) {}

  abstract addOrder(orderedActor: Actor, targetData: OrderTargetData): void;
  abstract setOrder(orderedActor: Actor, targetData: OrderTargetData): void;
  abstract canObeyOrder(orderedActor: Actor): boolean;
}
