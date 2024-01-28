import { RepresentableActor, RepresentableActorDefinition } from "../../actor/representable-actor";
import { TilePlacementData } from "../../../world/managers/controllers/input/tilemap/tilemap-input.handler";
import { ResourceSourceComponent } from "../../economy/resource/resource-source-component";
import { ContainerComponent } from "../../building/container-component";
import { Resources } from "@fuzzy-waddle/api-interfaces";
import { Scene } from "phaser";

export const MineralsDefinitions: RepresentableActorDefinition = {
  textureMapDefinition: {
    textureName: "warrior",
    spriteSheet: {
      name: "minerals",
      path: "general/minerals/",
      frameConfig: {
        frameWidth: 64,
        frameHeight: 64
      }
    }
  }
};

export class Minerals extends RepresentableActor {
  representableActorDefinition: RepresentableActorDefinition = MineralsDefinitions;

  constructor(scene: Scene, tilePlacementData: TilePlacementData) {
    super(scene, tilePlacementData);
  }

  override initComponents() {
    super.initComponents();

    this.components.addComponent(new ContainerComponent(2));
    this.components.addComponent(new ResourceSourceComponent(this, Resources.minerals, 40, 2));
  }
}
