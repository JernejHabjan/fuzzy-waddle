import { ActorDataChangedEvent } from "../../../data/actor-data";
import { HealthComponent } from "../../combat/components/health-component";
import { getActorComponent } from "../../../data/actor-component";
import { ConstructionSiteComponent } from "./construction-site-component";
import { Subscription } from "rxjs";

export class ConstructionGameObjectInterfaceComponent {
  private constructionSiteHandlerSetup = false;
  private constructionSubscription?: Subscription;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private handlePrefabVisibility: (progress: number | null) => void,
    private readonly cursorPrefab: Phaser.GameObjects.GameObject
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
    if (constructionSiteComponent.isFinished) {
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

  tintAndAlphaCursor(tint?: number, alpha?: number) {
    this.adjustGameObject(this.cursorPrefab, { tint, alpha });
  }

  private adjustGameObject(gameObject: Phaser.GameObjects.GameObject, config: { tint?: number; alpha?: number }) {
    // check if cursor is container, if container, then tint all its children, otherwise tint game object
    if (gameObject instanceof Phaser.GameObjects.Container) {
      gameObject.list.forEach((child) => {
        this.adjustGameObject(child, config);
      });
    } else {
      const asAlpha = gameObject as any as Phaser.GameObjects.Components.Alpha;
      const asTint = gameObject as any as Phaser.GameObjects.Components.Tint;
      if (asAlpha.setAlpha && config.alpha !== undefined) asAlpha.setAlpha(config.alpha);
      if (asTint.setTint && config.tint !== undefined) asTint.setTint(config.tint);
    }
  }

  private onDestroy() {
    this.constructionSubscription?.unsubscribe();
    this.gameObject.off(ActorDataChangedEvent, this.actorDataChanged, this);
  }
}
