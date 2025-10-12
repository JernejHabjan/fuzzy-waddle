import GameObject = Phaser.GameObjects.GameObject;
import { emitHousing } from "../../../data/scene-data";
import { onObjectReady } from "../../../data/game-object-helper";
import { HealthComponent } from "../combat/components/health-component";

export type HousingCostDefinition = {
  housingNeeded: number;
};

/**
 * Component that provides housing capacity to buildings
 */
export class HousingCostComponent {
  private housingCostProvided: boolean = false;

  constructor(
    private readonly gameObject: GameObject,
    public readonly housingCostDefinition: HousingCostDefinition
  ) {
    onObjectReady(gameObject, this.init, this);
    gameObject.once(HealthComponent.KilledEvent, this.onDestroy, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
  }

  private init() {
    this.addHousing();
  }

  private addHousing() {
    if (this.housingCostProvided) return;

    emitHousing(this.gameObject.scene, "housing.current.increased", {
      currentHousing: this.housingCostDefinition.housingNeeded
    });

    this.housingCostProvided = true;
  }

  private removeHousing() {
    if (!this.housingCostProvided) return;

    emitHousing(this.gameObject.scene, "housing.current.decreased", {
      currentHousing: this.housingCostDefinition.housingNeeded
    });

    this.housingCostProvided = false;
  }

  private onDestroy() {
    this.removeHousing();
  }
}
