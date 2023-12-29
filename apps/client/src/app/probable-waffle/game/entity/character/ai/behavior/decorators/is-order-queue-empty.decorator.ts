import { DecoratorData, IDecorator } from "./decorator.interface";
import { PawnAiControllerComponent } from "../../../../../world/managers/controllers/pawn-ai-controller-component";

export class IsOrderQueueEmptyDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const pawnAiController = decoratorData.owner.components.findComponentOrNull(PawnAiControllerComponent);
    if (!pawnAiController) {
      return false;
    }
    return pawnAiController.hasOrderQueue();
  }
}
