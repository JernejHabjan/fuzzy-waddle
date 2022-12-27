import { Order } from './orders/order';
import { OrderType } from './order-type';
import { Actor } from '../../actor';
import Vector3 = Phaser.Math.Vector3;

export class Blackboard {
  orderClass?: typeof Order;
  orderType?: OrderType;
  targetActor?: Actor;
  targetLocation?: Vector3;
}
