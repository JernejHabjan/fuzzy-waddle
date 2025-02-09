import { ActorDataChangedEvent } from "../../../data/actor-data";
import { HealthComponent } from "../../combat/components/health-component";
import { getActorComponent } from "../../../data/actor-component";
import { ConstructionSiteComponent } from "./construction-site-component";
import { Subscription } from "rxjs";

export class ConstructionHelper {
  private constructionSiteHandlerSetup = false;
  private constructionSubscription?: Subscription;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private handlePrefabVisibility: (progress: number | null) => void
  ) {
    gameObject.on(ActorDataChangedEvent, this.actorDataChanged, this);
    gameObject.once(HealthComponent.KilledEvent, this.onDestroy, this);
  }

  private actorDataChanged() {
    this.constructionSiteHandler();
  }

  private constructionSiteHandler() {
    if (this.constructionSiteHandlerSetup) return;
    const constructionSiteComponent = getActorComponent(this.gameObject, ConstructionSiteComponent);
    if (!constructionSiteComponent) {
      this.constructionSubscription?.unsubscribe();
      this.handlePrefabVisibility(null);
      return;
    }
    this.constructionSiteHandlerSetup = true;
    if (constructionSiteComponent.isFinished()) {
      this.handlePrefabVisibility(100);
      this.onDestroy();
    } else {
      this.constructionSubscription = constructionSiteComponent.constructionProgressPercentageChanged.subscribe(
        (progress) => {
          this.handlePrefabVisibility(progress);
          if (progress === 100) {
            this.onDestroy();
          }
        }
      );
    }
  }

  private onDestroy() {
    this.constructionSubscription?.unsubscribe();
    this.gameObject.off(ActorDataChangedEvent, this.actorDataChanged, this);
  }
}
