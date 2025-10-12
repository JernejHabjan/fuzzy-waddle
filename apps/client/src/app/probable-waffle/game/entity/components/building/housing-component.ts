import { type HousingComponentData } from "@fuzzy-waddle/api-interfaces";
import { HealthComponent } from "../combat/components/health-component";
import { onObjectReady } from "../../../data/game-object-helper";
import { getActorComponent } from "../../../data/actor-component";
import { ConstructionSiteComponent } from "../construction/construction-site-component";
import { emitHousing } from "../../../data/scene-data";
import GameObject = Phaser.GameObjects.GameObject;
import { ConstructionGameObjectInterfaceComponent } from "../construction/construction-game-object-interface-component";
import { ActorDataChangedEvent } from "../../../data/actor-data";
import type { Subscription } from "rxjs";

export type HousingDefinition = {
  housingCapacity: number;
};

/**
 * Component that provides housing capacity to buildings
 */
export class HousingComponent {
  private housingProvided: boolean = false;
  private constructionChangedSubscription?: Subscription;
  constructor(
    private readonly gameObject: GameObject,
    public readonly housingDefinition: HousingDefinition
  ) {
    onObjectReady(gameObject, this.init, this);
    gameObject.once(HealthComponent.KilledEvent, this.onDestroy, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.onDestroy, this);
    gameObject.on(ActorDataChangedEvent, this.init, this);
  }

  private init() {
    const constructionGameObjectInterfaceComponent = getActorComponent(
      this.gameObject,
      ConstructionGameObjectInterfaceComponent
    );

    // Check if building is already constructed
    const constructionSiteComponent = getActorComponent(this.gameObject, ConstructionSiteComponent);
    if (constructionGameObjectInterfaceComponent && !constructionSiteComponent) {
      // then await the handler setup
      return;
    }
    if (!constructionSiteComponent) {
      throw new Error("HousingComponent requires ConstructionSiteComponent to function");
    }

    // Check if already finished
    if (constructionSiteComponent.isFinished && !this.housingProvided) {
      this.addHousing();
      return;
    }

    // Building is under construction, wait for it to finish
    this.constructionChangedSubscription = constructionSiteComponent.constructionStateChanged.subscribe(() => {
      if (constructionSiteComponent.isFinished && !this.housingProvided) {
        this.addHousing();
        this.constructionChangedSubscription?.unsubscribe();
      }
    });
  }

  private addHousing() {
    if (this.housingProvided) return;

    emitHousing(this.gameObject.scene, "housing.added", {
      maxHousing: this.housingDefinition.housingCapacity
    });

    this.housingProvided = true;
  }

  private removeHousing() {
    if (!this.housingProvided) return;

    emitHousing(this.gameObject.scene, "housing.removed", {
      maxHousing: this.housingDefinition.housingCapacity
    });

    this.housingProvided = false;
  }

  private onDestroy() {
    this.removeHousing();
    this.gameObject.off(ActorDataChangedEvent, this.init, this);
    this.constructionChangedSubscription?.unsubscribe();
  }

  setData(data: Partial<HousingComponentData>) {
    if (data.housingProvided !== undefined) {
      if (data.housingProvided && !this.housingProvided) {
        this.addHousing();
      } else if (!data.housingProvided && this.housingProvided) {
        this.removeHousing();
      }
    }
  }

  getData(): HousingComponentData {
    return {
      housingProvided: this.housingProvided
    } satisfies HousingComponentData;
  }
}
