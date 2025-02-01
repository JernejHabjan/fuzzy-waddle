import { DecoratorData_old, IDecorator } from "./decorator.interface";
import { PawnAiControllerComponentOld } from "../../../../../world/managers/controllers/pawn-ai-controller-component-old";

export class IsOrderQueueEmptyDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData_old): boolean {
    const pawnAiController = decoratorData.owner.components.findComponentOrNull(PawnAiControllerComponentOld);
    if (!pawnAiController) {
      return false;
    }
    return pawnAiController.hasOrderQueue();
  }
}
