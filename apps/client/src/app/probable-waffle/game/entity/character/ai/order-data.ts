import { OrderType } from './order-type';
import { Actor } from '../../actor/actor';
import { TilePlacementData } from '../../../world/managers/controllers/input/tilemap/tilemap-input.handler';

export class OrderData {
  constructor(public orderType: OrderType, public targetActor?: Actor, public targetLocation?: TilePlacementData, public args?: any[]) {}
}
