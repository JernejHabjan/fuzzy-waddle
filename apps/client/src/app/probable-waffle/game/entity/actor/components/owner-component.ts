import GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../../data/actor-component";
import { Plugins } from "../../../world/const/Plugins";
import ColorReplacePipelinePlugin from "phaser3-rex-plugins/plugins/colorreplacepipeline-plugin";
import { GameSetupHelpers, Guid } from "@fuzzy-waddle/api-interfaces";
import GameProbableWaffleScene from "../../../scenes/GameProbableWaffleScene";
import { HealthComponent } from "../../combat/components/health-component";
import { getGameObjectDepth } from "../../../data/game-object-helper";
import { Subscription } from "rxjs";
import { ActorTranslateComponent } from "./actor-translate-component";

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
  private readonly colorReplacePipelinePlugin?: ColorReplacePipelinePlugin;
  private colorPipelineInstances: Phaser.Renderer.WebGL.Pipelines.PostFXPipeline[] = [];
  private ownerUiElement?: Phaser.GameObjects.Graphics;
  private actorMovedSubscription?: Subscription;
  constructor(
    private readonly gameObject: GameObject,
    public readonly ownerDefinition: OwnerDefinition
  ) {
    if (OwnerComponent.useColorReplace) {
      this.colorReplacePipelinePlugin = gameObject.scene.plugins.get(
        Plugins.RexColorReplacePipeline
      ) as ColorReplacePipelinePlugin;
    }
    gameObject.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
  }

  private init() {
    this.subscribeActorMove();
  }

  setOwner(playerNumber?: number) {
    this.owner = playerNumber;
    this.assignOwnerColor();
    this.setOwnerColorToActor();
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
    const healthComponent = getActorComponent(this.gameObject, HealthComponent);
    if (!healthComponent) {
      console.error("HealthComponent not found");
      return;
    }
    const { x, y, width, height } = healthComponent.getHealthUiComponentBounds();
    this.ownerUiElement = this.gameObject.scene.add.graphics();
    this.ownerUiElement.fillStyle(this.ownerColor.color);
    this.ownerUiElement.fillRect(0, 0, width + this.borderSize * 2, height + this.borderSize * 2);
    this.updateOwnerUiElementPosition();
    setTimeout(() => {
      this.gameObject.emit(OwnerComponent.OwnerColorAppliedEvent, this.ownerColor);
    });
  }

  private get barDepth() {
    return (getGameObjectDepth(this.gameObject) ?? 0) + OwnerComponent.ZIndex;
  }

  private removeAllColorPipelines() {
    this.colorPipelineInstances.forEach((instance) => {
      this.colorReplacePipelinePlugin?.remove(this.gameObject, instance.name);
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
  }
}
