import { DecoratorData_old, IDecorator } from "./decorator.interface";
import { ConstructionSiteComponent } from "../../../../building/construction/construction-site-component";

export class IsConstructionFinishedDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData_old): boolean {
    const constructionSiteComponent = decoratorData.owner.components.findComponentOrNull(ConstructionSiteComponent);
    if (!constructionSiteComponent) {
      return false;
    }
    return constructionSiteComponent.isFinished();
  }
}
