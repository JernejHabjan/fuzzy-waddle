import { HealthComponent } from "../combat/components/health-component";
import { removeActorComponent } from "../../../data/actor-data";
import { onObjectReady } from "../../../data/game-object-helper";
import { NavigationService } from "../../../world/services/navigation.service";

export interface ColliderDefinition {
  enabled: boolean;
  colliderFactorReduction?: number;
}
export class ColliderComponent {
  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    public colliderDefinition: ColliderDefinition | null = null
  ) {
    gameObject.once(HealthComponent.KilledEvent, this.onDestroy, this);
    onObjectReady(gameObject, this.init, this);
  }

  private init() {
    this.gameObject.scene.events.emit(NavigationService.UpdateNavigationEvent);
  }

  private onDestroy() {
    removeActorComponent(this.gameObject, ColliderComponent);
    this.gameObject.scene.events.emit(NavigationService.UpdateNavigationEvent);
  }
}
