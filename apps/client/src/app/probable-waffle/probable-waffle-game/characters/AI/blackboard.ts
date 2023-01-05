import { Order } from './orders/order';
import { OrderType } from './order-type';
import { Actor } from '../../actor';
import Vector3 = Phaser.Math.Vector3;
import { ActorsAbleToBeBuiltClass } from '../builder-component';

export class Blackboard {
  orderClass?: typeof Order;
  orderType?: OrderType;
  targetActor?: Actor;
  targetLocation?: Vector3;
  range?: number;
  acceptanceRadius?: number;
  buildingType?: ActorsAbleToBeBuiltClass;
}
