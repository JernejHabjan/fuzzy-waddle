import { DecoratorData, IDecorator } from './IDecorator';
import { PawnAiControllerComponent } from '../../../../controllers/pawn-ai-controller-component';

export class DIsOrderQueueEmpty implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const pawnAiController = decoratorData.owner.components.findComponentOrNull(PawnAiControllerComponent);
    if (!pawnAiController) {
      return false;
    }
    return pawnAiController.hasOrderQueue();
  }
}
