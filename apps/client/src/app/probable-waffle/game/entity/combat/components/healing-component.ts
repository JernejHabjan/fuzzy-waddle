import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "./health-component";

export type HealingDefinition = {
  healPerSecond: number;
};

export class HealingComponent {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly healingDefinition: HealingDefinition
  ) {}
  heal(target: Phaser.GameObjects.GameObject) {
    const targetHealthComponent = getActorComponent(target, HealthComponent);
    if (!targetHealthComponent) return;
    targetHealthComponent.heal(this.healingDefinition.healPerSecond);
  }
}
