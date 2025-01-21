import { Actor } from "./actor";
import { SpriteRepresentationComponent } from "./components/sprite-representable-component";
import { TransformComponent } from "./components/transformable-component";
import { TilePlacementData_old } from "../../world/managers/controllers/input/tilemap/tilemap-input.handler";
import { Scene } from "phaser";

export type RepresentableActorDefinition = {
  textureMapDefinition: TextureMapDefinition;
};

export type TextureMapDefinition = {
  textureName: string;
  spriteSheet: {
    name: string;
    path: string;
    frameConfig: {
      frameWidth: number;
      frameHeight: number;
    };
  };
};

/*
 * pawn includes just physical representation and move component, so it can move around, but no way how to move around
 */
export abstract class RepresentableActor_old extends Actor {
  private transformComponent!: TransformComponent;
  abstract representableActorDefinition: RepresentableActorDefinition;

  protected constructor(
    private scene: Scene,
    private tilePlacementData: TilePlacementData_old
  ) {
    super();
  }

  override initComponents() {
    this.transformComponent = this.components.addComponent(new TransformComponent(this.tilePlacementData));
    this.components.addComponent(
      new SpriteRepresentationComponent(this, this.scene, {
        textureName: this.representableActorDefinition.textureMapDefinition.textureName,
        tilePlacementData: this.transformComponent.tilePlacementData
      })
    );
  }
}
