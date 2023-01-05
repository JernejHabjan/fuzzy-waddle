import { IComponent } from '../services/component.service';
import { ResourceType } from '../buildings/resource-type';

export class PlayerResourcesComponent implements IComponent {
  resources: Map<ResourceType, number> = new Map<ResourceType, number>();
  init(): void {
    // pass
  }

  getResources(): Map<ResourceType, number> {
    return this.resources;
  }

  addResources(resources: Map<ResourceType, number>): void {
    resources.forEach((value, resourceType) => {
      this.addResource(resourceType, value);
    });
  }

  addResource(resourceType: ResourceType, amount: number): number {
    const resourceAmount = this.resources.get(resourceType) || 0;
    this.resources.set(resourceType, resourceAmount + amount);
    return resourceAmount;
  }

  payAllResources(resources: Map<ResourceType, number>): void {
    resources.forEach((value, resourceType) => {
      this.payResources(resourceType, value);
    });
  }

  payResources(resourceType: ResourceType, amount: number): void {
    const resourceAmount = this.resources.get(resourceType) || 0;
    if (resourceAmount - amount < 0) {
      throw new Error('Not enough resources');
    }
    this.resources.set(resourceType, resourceAmount - amount);
  }

  canPayAllResources(constructionCosts: Map<ResourceType, number>) {
    // noinspection UnnecessaryLocalVariableJS
    const canAfford = Array.from(constructionCosts.entries()).every(([resourceType, amount]) => {
      const resourceAmount = this.resources.get(resourceType) || 0;
      return resourceAmount >= amount;
    });
    return canAfford;
  }
}
