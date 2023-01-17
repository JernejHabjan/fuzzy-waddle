import { Blackboard } from './blackboard';
import { OrderType } from './order-type';
import { Actor } from '../../actor/actor';
import { TilePlacementData } from '../../../world/managers/controllers/input/tilemap/tilemap-input.handler';
import { ActorAbleToBeBuiltClass } from '../../actor/components/builder-component';

export class PawnAiBlackboard extends Blackboard{
  orderType?: OrderType;
  targetActor?: Actor;
  targetLocation?: TilePlacementData;
  range?: number;
  acceptanceRadius?: number;
  buildingType?: ActorAbleToBeBuiltClass;
}
