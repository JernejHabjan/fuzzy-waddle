import { DecoratorData, IDecorator } from "./decorator.interface";
import { BuilderComponent } from "../../../../actor/components/builder-component";

export class IsAtConstructionSiteDecorator implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const builderComponent = decoratorData.owner.components.findComponentOrNull(BuilderComponent);
    if (!builderComponent) {
      return false;
    }
    return !!builderComponent.getAssignedConstructionSite();
  }
}
