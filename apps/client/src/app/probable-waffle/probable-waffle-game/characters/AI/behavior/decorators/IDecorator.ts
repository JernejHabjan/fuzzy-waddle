import { Actor } from '../../../../actor';
import { PawnAiBlackboard } from '../../pawn-ai-blackboard';

export class DecoratorData {
  constructor(public owner: Actor, public blackboard: PawnAiBlackboard) {}
}

export interface IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean;
}
