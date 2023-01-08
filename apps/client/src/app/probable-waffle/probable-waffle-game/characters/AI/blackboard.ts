import { OrderType } from './order-type';
import { Actor } from '../../actor';
import { ActorsAbleToBeBuiltClass } from '../builder-component';
import { TilePlacementData } from '../../input/tilemap/tilemap-input.handler';

export class Blackboard {
  orderType?: OrderType;
  targetActor?: Actor;
  targetLocation?: TilePlacementData;
  range?: number;
  acceptanceRadius?: number;
  buildingType?: ActorsAbleToBeBuiltClass;
}
