import { Actor } from '../../../../actor';
import { Blackboard } from '../../blackboard';
import { AiPlayerController } from '../../../../controllers/ai-player-controller';

export class DecoratorData {
  constructor(public owner: Actor, public blackboard: Blackboard, public aiPlayerController: AiPlayerController) {
  }
}

export interface IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean;
}
