import { DecoratorData, IDecorator } from './IDecorator';
import { ConstructionSiteComponent } from '../../../../buildings/construction-site-component';

export class DIsConstructionFinished implements IDecorator {
  calculateRawConditionValue(decoratorData: DecoratorData): boolean {
    const constructionSiteComponent = decoratorData.owner.components.findComponentOrNull(ConstructionSiteComponent);
    if (!constructionSiteComponent) {
      return false;
    }
    return constructionSiteComponent.isFinished();
  }
}
