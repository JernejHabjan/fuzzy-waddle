import GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../../data/actor-component";
import { Plugins } from "../../../world/const/Plugins";
import ColorReplacePipelinePlugin from "phaser3-rex-plugins/plugins/colorreplacepipeline-plugin";
import { GameSetupHelpers, Guid } from "@fuzzy-waddle/api-interfaces";
import GameProbableWaffleScene from "../../../scenes/GameProbableWaffleScene";

export type OwnerDefinition = {
  color: { originalColor: number; epsilon: number }[];
};

export class OwnerComponent {
  private owner?: number;
  ownerColor?: Phaser.Display.Color;
  private readonly colorReplacePipelinePlugin: ColorReplacePipelinePlugin;
  private colorPipelineInstances: Phaser.Renderer.WebGL.Pipelines.PostFXPipeline[] = [];
  constructor(
    private readonly gameObject: GameObject,
    public readonly ownerDefinition: OwnerDefinition
  ) {
    this.colorReplacePipelinePlugin = gameObject.scene.plugins.get(
      Plugins.RexColorReplacePipeline
    ) as ColorReplacePipelinePlugin;
    gameObject.once(Phaser.GameObjects.Events.ADDED_TO_SCENE, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
  }

  private init() {
    // todo this.setOwner(this.owner);
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
    this.removeAllColorPipelines();
    const ownerColor = this.ownerColor;
    if (!ownerColor) return;
    this.ownerDefinition.color.forEach((color) => {
      const instance = this.colorReplacePipelinePlugin.add(this.gameObject, {
        originalColor: color.originalColor,
        epsilon: color.epsilon,
        newColor: ownerColor.color,
        name: new Guid().value
      });
      this.colorPipelineInstances.push(instance);
    });
  }

  private removeAllColorPipelines() {
    this.colorPipelineInstances.forEach((instance) => {
      this.colorReplacePipelinePlugin.remove(this.gameObject, instance.name);
    });
  }

  private destroy() {
    this.removeAllColorPipelines();
  }
}
