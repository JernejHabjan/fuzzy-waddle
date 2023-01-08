import { Actor } from '../../../../actor';
import { Blackboard } from '../../blackboard';
import { PlayerAiController } from '../../../../controllers/player-ai-controller';

export class DecoratorData {
  constructor(public owner: Actor, public blackboard: Blackboard, public playerAiController: PlayerAiController) {}
}

export interface IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean;
}
