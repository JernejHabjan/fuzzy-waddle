import GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../../data/actor-component";
import { Plugins } from "../../../world/const/Plugins";
import { GameSetupHelpers, Guid } from "@fuzzy-waddle/api-interfaces";
import GameProbableWaffleScene from "../../../scenes/GameProbableWaffleScene";
import { HealthComponent } from "../../combat/components/health-component";
import { getGameObjectDepth, onObjectReady } from "../../../data/game-object-helper";
import { Subscription } from "rxjs";
import { ActorTranslateComponent } from "./actor-translate-component";
import { ContainerComponent } from "../../building/container-component";
import { ConstructionSiteComponent } from "../../building/construction/construction-site-component";
import { VisionComponent } from "./vision-component";

export type OwnerDefinition = {
  color: { originalColor: number; epsilon: number }[];
};

export class OwnerComponent {
  static readonly ZIndex = 1;
  static readonly OwnerColorAppliedEvent = "owner-color-applied";
  private readonly borderSize = 2;
  /**
   * Not using color replace as it adds huge load on GPU
   */
  static useColorReplace = false;
  private owner?: number;
  ownerColor?: Phaser.Display.Color;
  private readonly colorReplacePipelinePlugin?: any;
  private colorPipelineInstances: any[] = [];
  private ownerUiElement?: Phaser.GameObjects.Graphics;
  private actorMovedSubscription?: Subscription;
  private ready: boolean = false;
  private healthUiVisibilitySubscription?: Subscription;
  private constructionProgressSubscription?: Subscription;
  private gameObjectVisible: boolean = true;
  constructor(
    private readonly gameObject: GameObject,
    public readonly ownerDefinition: OwnerDefinition
  ) {
    if (OwnerComponent.useColorReplace) {
      this.colorReplacePipelinePlugin = gameObject.scene.plugins.get(Plugins.RexColorReplacePipeline) as any;
    }
    onObjectReady(gameObject, this.init, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.on(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);
    // Todo - now calling refreshOwnerUiVisibility on tick to update visibility due to FOW changes
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.refreshOwnerUiVisibility, this);
  }

  private init() {
    this.ready = true;
    this.subscribeActorMove();
    this.tryToSetComponents();
  }

  private tryToSetComponents() {
    if (!this.ready || !this.owner) return;
    this.updateOwnerUiElementPosition();
    this.assignOwnerColor();
    this.setOwnerColorToActor();
  }

  private gameObjectVisibilityChanged(visible: boolean) {
    this.gameObjectVisible = visible;
    this.refreshOwnerUiVisibility();
  }

  private refreshOwnerUiVisibility() {
    let visible = this.gameObjectVisible;
    const visionComponent = getActorComponent(this.gameObject, VisionComponent);
    if (!visionComponent || !visionComponent.visibilityByCurrentPlayer) visible = false;
    this.ownerUiElement?.setVisible(visible);
  }

  setOwner(playerNumber?: number) {
    this.owner = playerNumber;
    this.tryToSetComponents();
  }

  clearOwner() {
    this.owner = undefined;
    this.assignOwnerColor();
    this.setOwnerColorToActor();
  }

  getOwner(): number | undefined {
    return this.owner;
  }

  isSameTeamAsGameObject(gameObject: Phaser.GameObjects.GameObject) {
    const ownerComponent = getActorComponent(gameObject, OwnerComponent);
    if (!ownerComponent) {
      return false;
    }
    return ownerComponent.getOwner() === this.getOwner();
  }

  private assignOwnerColor(): void {
    if (!(this.gameObject.scene instanceof GameProbableWaffleScene)) return;
    if (!this.owner) {
      this.ownerColor = undefined;
      return;
    }
    const gameScene = this.gameObject.scene as GameProbableWaffleScene;
    const maxPlayers = gameScene.mapInfo.mapInfo.startPositionsOnTile.length;
    const { hue, saturation, lightness } = GameSetupHelpers.getHslColorForPlayer(this.owner, maxPlayers);
    const { hueNormalized, saturationNormalized, lightnessNormalized } = {
      hueNormalized: hue / 360,
      saturationNormalized: saturation / 100,
      lightnessNormalized: lightness / 100
    };
    this.ownerColor = Phaser.Display.Color.HSLToColor(hueNormalized, saturationNormalized, lightnessNormalized);
  }

  private setOwnerColorToActor() {
    this.replaceColorUsingPipeline();
    this.createOwnerUiElement();
  }

  private replaceColorUsingPipeline() {
    this.removeAllColorPipelines();
    this.ownerDefinition.color.forEach((color) => {
      if (!this.colorReplacePipelinePlugin) return;
      if (!this.ownerColor) return;
      const instance = this.colorReplacePipelinePlugin.add(this.gameObject, {
        originalColor: color.originalColor,
        epsilon: color.epsilon,
        newColor: this.ownerColor.color,
        name: new Guid().value
      });
      this.colorPipelineInstances.push(instance);
    });
  }

  private createOwnerUiElement() {
    this.removeOwnerUiElement();
    if (!this.ownerColor) return;
    if (this.colorReplacePipelinePlugin) return;
    const { healthWidth, healthHeight } = this.getHealthComponentBounds();
    const { constructionWidth, constructionHeight } = this.getConstructionProgressBounds();
    const width = Math.max(healthWidth, constructionWidth, 25);
    const height = Math.max(healthHeight, constructionHeight, 0);
    this.ownerUiElement = this.gameObject.scene.add.graphics();
    this.ownerUiElement.fillStyle(this.ownerColor.color);
    this.ownerUiElement.fillRect(0, 0, width + this.borderSize * 2, height + this.borderSize * 2);
    this.updateOwnerUiElementPosition();
    setTimeout(() => {
      this.gameObject.emit(OwnerComponent.OwnerColorAppliedEvent, this.ownerColor);
    });
  }

  private getHealthComponentBounds() {
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) {
      return { healthWidth: 0, healthHeight: 0 };
    }
    this.healthUiVisibilitySubscription?.unsubscribe();
    this.healthUiVisibilitySubscription = healthComponent.uiComponentsVisibilityChanged.subscribe((visible) => {
      if (visible) {
        this.createOwnerUiElement();
      }
    });
    const { width, height } = healthComponent.getHealthUiComponentBounds();
    return { healthWidth: width, healthHeight: height };
  }

  private getConstructionProgressBounds() {
    const constructionSiteComponent = getActorComponent(this.gameObject, ConstructionSiteComponent);
    if (!constructionSiteComponent) {
      return { constructionWidth: 0, constructionHeight: 0 };
    }
    if (constructionSiteComponent.isFinished) {
      this.constructionProgressSubscription?.unsubscribe();
      return { constructionWidth: 0, constructionHeight: 0 };
    }
    this.constructionProgressSubscription?.unsubscribe();
    this.constructionProgressSubscription = constructionSiteComponent.constructionStateChanged.subscribe(() =>
      this.createOwnerUiElement()
    );
    const { width, height } = constructionSiteComponent.constructionProgressUiComponent?.getBounds() ?? {
      width: 0,
      height: 0
    };
    return { constructionWidth: width, constructionHeight: height };
  }

  private get barDepth() {
    return (getGameObjectDepth(this.gameObject) ?? 0) + OwnerComponent.ZIndex;
  }

  private removeAllColorPipelines() {
    this.colorPipelineInstances.forEach((instance) => {
      this.colorReplacePipelinePlugin?.remove(this.gameObject, (instance as any).name);
    });
  }

  private removeOwnerUiElement() {
    if (this.ownerUiElement) {
      this.ownerUiElement.destroy();
      this.ownerUiElement = undefined;
    }
  }

  private subscribeActorMove() {
    const actorTranslateComponent = getActorComponent(this.gameObject, ActorTranslateComponent);
    if (!actorTranslateComponent) return;
    this.actorMovedSubscription = actorTranslateComponent.actorMoved.subscribe(() => {
      this.updateOwnerUiElementPosition();
    });
  }

  private updateOwnerUiElementPosition() {
    if (!this.ownerUiElement) return;
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) return;
    const { x, y } = healthComponent.getHealthUiComponentBounds();
    this.ownerUiElement.x = x - this.borderSize;
    this.ownerUiElement.y = y - this.borderSize;
    this.ownerUiElement.setDepth(this.barDepth);
  }

  private destroy() {
    this.removeAllColorPipelines();
    this.removeOwnerUiElement();
    this.actorMovedSubscription?.unsubscribe();
    this.healthUiVisibilitySubscription?.unsubscribe();
    this.constructionProgressSubscription?.unsubscribe();
    this.gameObject.off(ContainerComponent.GameObjectVisibilityChanged, this.gameObjectVisibilityChanged, this);
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.refreshOwnerUiVisibility, this);
  }
}
