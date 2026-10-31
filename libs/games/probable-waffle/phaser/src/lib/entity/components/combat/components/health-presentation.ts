import Phaser from "phaser";
import type { Subscription } from "rxjs";
import type { HealthComponentData } from "@fuzzy-waddle/probable-waffle-protocol";
import type { HealthDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/health-definition";
import { ActorPhysicalType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/combat/components/actor-physical-type";
import { HealthUiComponent } from "./health-ui-component";
import { ContainerComponent } from "../../building/container-component";
import { ConstructionSiteComponent } from "../../construction/construction-site-component";
import { ActorTranslateComponent } from "../../movement/actor-translate-component";
import { VisionComponent } from "../../vision-component";
import { getActorComponent } from "../../../../data/actor-component";
import { getGameObjectBounds, getGameObjectDepth, isGameObjectActiveInActiveScene } from "../../../../data/game-object-helper";
import { EffectsAnims } from "../../../../animations/effects";

/** Render-only health feedback; mutable health and definitions remain owned by the public facade. */
export class HealthPresentation {
  private healthUiComponent: HealthUiComponent;
  private armorUiComponent?: HealthUiComponent;
  private uiComponentsVisible = true;
  private shouldUiElementsBeVisible = false;
  private constructionProgressSubscription?: Subscription;
  private healthUiHideOnTimeout?: Phaser.Time.TimerEvent;
  private actorTranslateComponent?: ActorTranslateComponent;

  constructor(
    private readonly gameObject: Phaser.GameObjects.GameObject,
    private readonly readDefinition: () => HealthDefinition,
    private readonly readData: () => HealthComponentData,
    private readonly notifyVisibility: (visible: boolean) => void
  ) {
    // Initialize UI components for health and armor
    this.healthUiComponent = new HealthUiComponent(this.gameObject, "health");
    if (this.readData().armour > 0) {
      this.armorUiComponent = new HealthUiComponent(this.gameObject, "armor");
    }
  }

  /** Attach only after the facade stores this helper; ready initialization may run synchronously. */
  attach() {
    this.gameObject.on(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);
  }

  /** Preserve the initial armor creation before native dependency lookups. */
  initializeArmorFromData() {
    if (this.readData().armour > 0 && !this.armorUiComponent) {
      this.armorUiComponent = new HealthUiComponent(this.gameObject, "armor");
    }
  }

  init() {
    this.actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    const constructionSiteComponent = getActorComponent(this.gameObject, ConstructionSiteComponent);
    if (constructionSiteComponent && !constructionSiteComponent.isFinished) {
      const shouldBeVisible = this.shouldUiElementsBeVisible;
      this.setVisibilityUiComponent(false);
      this.shouldUiElementsBeVisible = shouldBeVisible;
      this.constructionProgressSubscription = constructionSiteComponent.constructionStateChanged.subscribe(() =>
        this.refreshVisibilityFrameNonDeterministic()
      );
    }
    // Todo - now calling refreshVisibility on tick to update visibility due to FOW changes
    // Intentional frame update: health/armor bars are UI visibility, not simulation-authoritative state.
    this.gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.refreshVisibilityFrameNonDeterministic, this);

    if (!this.readDefinition().healthDisplayBehavior || this.readDefinition().healthDisplayBehavior === "always") {
      this.setVisibilityUiComponent(true);
    } else {
      this.setVisibilityUiComponent(false);
    }
  }

  showOnDamage() {
    if (this.readDefinition().healthDisplayBehavior === "onDamage") {
      this.setVisibilityUiComponent(true);
      // Hide the UI component after a delay if it's set to "onDamage"
      this.healthUiHideOnTimeout?.remove();
      // Intentional wall-clock timer: health bar visibility timeout is UI-only.
      this.healthUiHideOnTimeout = this.gameObject.scene.time.delayedCall(3000, () => {
        if (this.gameObject.active) this.setVisibilityUiComponent(false);
      });
    }
  }

  reactToDamageVisually() {
    let asTint: Phaser.GameObjects.Components.Tint & { clearTint?: () => void };
    switch (this.readDefinition().physicalState) {
      case ActorPhysicalType.Biological:
        if (this.actorTranslateComponent) {
          const renderedTransform = this.actorTranslateComponent.renderedTransform;
          const effect = EffectsAnims.createAndPlayBloodAnimation(
            this.gameObject.scene,
            renderedTransform.x,
            renderedTransform.y
          );
          const gameObjectDepth = getGameObjectDepth(this.gameObject);
          if (gameObjectDepth) {
            effect.setDepth(gameObjectDepth + 1);
          }
        }
        break;
      case ActorPhysicalType.Structural:
        asTint = this.gameObject as unknown as Phaser.GameObjects.Components.Tint & { clearTint?: () => void };
        if (asTint.setTint) {
          asTint.setTint(0xff0000);
          // Clear the hit-flash tint after a short delay so it doesn't stick
          // Intentional wall-clock timer: tint cleanup is visual-only.
          this.gameObject.scene.time.delayedCall(500, () => {
            if (this.gameObject.active) asTint.clearTint?.();
          });
        }
        break;
      case ActorPhysicalType.Organic:
        asTint = this.gameObject as unknown as Phaser.GameObjects.Components.Tint & { clearTint?: () => void };
        if (asTint.setTint) {
          asTint.setTint(0xff0000);
          // console.warn("this tint is not working "); // todo
          // Intentional wall-clock timer: tint cleanup is visual-only.
          this.gameObject.scene.time.delayedCall(500, () => {
            if (this.gameObject.active) asTint.clearTint?.();
          });
        }
        break;
    }
  }

  private refreshVisibilityFrameNonDeterministic() {
    this.setVisibilityUiComponent(this.shouldUiElementsBeVisible);
  }

  private gameObjectVisibilityChanged(visible: boolean) {
    if (visible) {
      if (!this.readDefinition().healthDisplayBehavior || this.readDefinition().healthDisplayBehavior === "always") {
        this.setVisibilityUiComponent(true);
      } else {
        this.setVisibilityUiComponent(visible);
      }
    } else {
      this.setVisibilityUiComponent(false);
    }
  }

  getHealthUiComponentBounds(): Phaser.Geom.Rectangle {
    const healthComponentBounds = this.healthUiComponent.getBounds();
    const armorComponentBounds = this.armorUiComponent?.getBounds();

    return new Phaser.Geom.Rectangle(
      healthComponentBounds.x,
      healthComponentBounds.y,
      this.uiComponentsVisible ? healthComponentBounds.width : 0,
      this.uiComponentsVisible
        ? armorComponentBounds
          ? healthComponentBounds.height + armorComponentBounds.height - HealthUiComponent.barBorder
          : healthComponentBounds.height
        : 0
    );
  }

  setVisibilityUiComponent(visible: boolean) {
    if (!isGameObjectActiveInActiveScene(this.gameObject)) return;
    this.shouldUiElementsBeVisible = visible;
    const constructionSiteComponent = getActorComponent(this.gameObject, ConstructionSiteComponent);
    if (constructionSiteComponent && !constructionSiteComponent.isFinished) visible = false;
    const previousVisibility = this.uiComponentsVisible;
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent || !visionComponent.visibilityByCurrentPlayer) visible = false;
    if (visible === previousVisibility) return;
    this.healthUiComponent.setVisibility(visible);
    this.armorUiComponent?.setVisibility(visible);
    this.uiComponentsVisible = visible;
    this.notifyVisibility(visible);
  }

  reactToHeal() {
    if (!this.actorTranslateComponent) return;
    const renderedTransform = this.actorTranslateComponent.renderedTransform;
    const bounds = getGameObjectBounds(this.gameObject)!;
    const effect = EffectsAnims.createAndPlayEffectAnimation(
      this.gameObject.scene,
      EffectsAnims.ANIM_IMPACT_16,
      renderedTransform.x,
      bounds.top
    );
    effect.setScale(0.5);
    effect.setTint(0x00ff00);
    const gameObjectDepth = getGameObjectDepth(this.gameObject);
    if (gameObjectDepth) {
      effect.setDepth(gameObjectDepth + 1);
    }
  }

  syncArmorUiComponent() {
    const hasArmor = (this.readDefinition().maxArmour ?? 0) > 0;
    if (hasArmor) {
      this.armorUiComponent ??= new HealthUiComponent(this.gameObject, "armor");
      this.armorUiComponent.setVisibility(this.uiComponentsVisible);
      return;
    }

    this.armorUiComponent?.destroy();
    this.armorUiComponent = undefined;
  }

  refreshUiComponents() {
    this.healthUiComponent.refresh();
    this.armorUiComponent?.refresh();
  }

  /** Timer/subscription disposal precedes the facade's simulation destruction-delay disposal. */
  disposeTimers() {
    this.constructionProgressSubscription?.unsubscribe();
    this.healthUiHideOnTimeout?.remove();
  }

  detach() {
    this.gameObject.off(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.refreshVisibilityFrameNonDeterministic, this);
  }
}
