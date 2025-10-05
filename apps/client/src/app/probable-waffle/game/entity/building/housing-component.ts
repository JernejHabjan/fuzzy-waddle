import { HousingComponentData, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { emitResource } from "../../data/scene-data";
import { HealthComponent } from "../combat/components/health-component";
import { ConstructionSiteComponent } from "./construction/construction-site-component";
import { getActorComponent } from "../../data/actor-component";
import { onObjectReady } from "../../data/game-object-helper";
import GameObject = Phaser.GameObjects.GameObject;

export type HousingDefinition = {
  housingCapacity: number;
};

/**
 * Component that provides housing capacity to buildings
 * Housing is tracked as a resource similar to food
 */
export class HousingComponent {
  private housingProvided: boolean = false;

  constructor(
    private readonly gameObject: GameObject,
    public readonly housingDefinition: HousingDefinition
  ) {
    onObjectReady(gameObject, this.init, this);
    gameObject.once(HealthComponent.KilledEvent, this.onDestroy, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
  }

  private init() {
    // Check if building is already constructed
    const constructionSiteComponent = getActorComponent(this.gameObject, ConstructionSiteComponent);
    
    if (constructionSiteComponent) {
      // Building is under construction, wait for it to finish
      const subscription = constructionSiteComponent.constructionStateChanged.subscribe((state) => {
        if (constructionSiteComponent.isFinished && !this.housingProvided) {
          this.addHousing();
          subscription.unsubscribe();
        }
      });

      // Check if already finished
      if (constructionSiteComponent.isFinished && !this.housingProvided) {
        this.addHousing();
        subscription.unsubscribe();
      }
    } else {
      // Building is already constructed (e.g., main buildings like Sandhold/FrostForge)
      this.addHousing();
    }
  }

  private addHousing() {
    if (this.housingProvided) return;
    
    emitResource(this.gameObject.scene, "resource.added", {
      [ResourceType.Housing]: this.housingDefinition.housingCapacity
    });
    
    this.housingProvided = true;
  }

  private removeHousing() {
    if (!this.housingProvided) return;
    
    emitResource(this.gameObject.scene, "resource.removed", {
      [ResourceType.Housing]: this.housingDefinition.housingCapacity
    });
    
    this.housingProvided = false;
  }

  private onDestroy() {
    this.removeHousing();
  }

  setData(data: Partial<HousingComponentData>) {
    // Currently no mutable data to set
  }

  getData(): HousingComponentData {
    return {
      housingCapacity: this.housingDefinition.housingCapacity,
      housingProvided: this.housingProvided
    } satisfies HousingComponentData;
  }
}
