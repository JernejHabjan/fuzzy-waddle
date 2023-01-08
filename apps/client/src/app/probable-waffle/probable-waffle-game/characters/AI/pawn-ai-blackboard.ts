import { Blackboard } from './blackboard';
import { OrderType } from './order-type';
import { Actor } from '../../actor';
import { TilePlacementData } from '../../input/tilemap/tilemap-input.handler';
import { ActorsAbleToBeBuiltClass } from '../builder-component';

export class PawnAiBlackboard extends Blackboard{
  orderType?: OrderType;
  targetActor?: Actor;
  targetLocation?: TilePlacementData;
  range?: number;
  acceptanceRadius?: number;
  buildingType?: ActorsAbleToBeBuiltClass;
}
