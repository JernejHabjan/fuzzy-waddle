import { IComponent } from "../../../core/component.service";
import { ResourceTypeDefinition } from "@fuzzy-waddle/api-interfaces";

export class PlayerResourcesComponent implements IComponent {
  resources: Map<ResourceTypeDefinition, number> = new Map<ResourceTypeDefinition, number>();

  init(): void {
    // pass
  }

  getResources(): Map<ResourceTypeDefinition, number> {
    return this.resources;
  }

  addResources(resources: Map<ResourceTypeDefinition, number>): void {
    resources.forEach((value, resourceType) => {
      this.addResource(resourceType, value);
    });
  }

  addResource(resourceType: ResourceTypeDefinition, amount: number): number {
    const resourceAmount = this.resources.get(resourceType) || 0;
    this.resources.set(resourceType, resourceAmount + amount);
    return resourceAmount;
  }

  payAllResources(resources: Map<ResourceTypeDefinition, number>): void {
    resources.forEach((value, resourceType) => {
      this.payResources(resourceType, value);
    });
  }

  payResources(resourceType: ResourceTypeDefinition, amount: number): void {
    const resourceAmount = this.resources.get(resourceType) || 0;
    if (resourceAmount - amount < 0) {
      throw new Error("Not enough resources");
    }
    this.resources.set(resourceType, resourceAmount - amount);
  }

  canPayAllResources(constructionCosts: Map<ResourceTypeDefinition, number>) {
    // noinspection UnnecessaryLocalVariableJS
    const canAfford = Array.from(constructionCosts.entries()).every(([resourceType, amount]) => {
      const resourceAmount = this.resources.get(resourceType) || 0;
      return resourceAmount >= amount;
    });
    return canAfford;
  }
}
