import { OrderType } from './order-type';
import { Actor } from '../../actor';
import { TilePlacementData } from '../../input/tilemap/tilemap-input.handler';

export class OrderData {
  constructor(public orderType: OrderType, public targetActor?: Actor, public targetLocation?: TilePlacementData, public args?: any[]) {}
}
