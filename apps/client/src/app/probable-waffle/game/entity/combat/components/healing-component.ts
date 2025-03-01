import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "./health-component";

export type HealingDefinition = {
  healPerSecond: number;
  range: number;
};

export class HealingComponent {
  // onCooldownReady: EventEmitter<GameObject> = new EventEmitter<GameObject>();
  remainingCooldown = 0;
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public readonly healingDefinition: HealingDefinition
  ) {
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  private update(_: number, delta: number): void {
    if (this.remainingCooldown <= 0) {
      return;
    }
    this.remainingCooldown -= delta;
    this.remainingCooldown = Math.max(this.remainingCooldown, 0);
    // if (this.remainingCooldown <= 0) {
    //   this.onCooldownReady.emit(this.gameObject);
    // }
  }

  heal(target: Phaser.GameObjects.GameObject) {
    const targetHealthComponent = getActorComponent(target, HealthComponent);
    if (!targetHealthComponent) return;
    targetHealthComponent.heal(this.healingDefinition.healPerSecond);
  }

  getHealRange() {
    return this.healingDefinition.range;
  }

  private destroy() {
    this.gameObject.scene.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
  }
}
