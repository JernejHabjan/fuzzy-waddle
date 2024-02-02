import { PlacementRestrictionComponent } from "../../building/placement-restriction-component";
import { Building, BuildingInfoDefinition } from "./building";
import { PaymentType } from "../../building/payment-type";
import Tree1 from "../../../prefabs/outside/foliage/trees/resources/Tree1";

export const MineDefinitions: BuildingInfoDefinition = {
  textureMapDefinition: {
    textureName: "warrior",
    spriteSheet: {
      name: "mine",
      path: "general/mine/",
      frameConfig: {
        frameWidth: 64,
        frameHeight: 64
      }
    }
  },
  cost: null,
  healthDefinition: {
    maxHealth: 400
  },
  soundDefinition: {},
  constructionSiteDefinition: {
    constructionCosts: {},
    checkCollision: true,
    constructionCostType: PaymentType.PayOverTime,
    constructionTime: 100,
    consumesBuilders: false,
    maxAssignedBuilders: 3,
    progressMadeAutomatically: 0,
    progressMadePerBuilder: 1,
    initialHealthPercentage: 10,
    refundFactor: 0.5,
    startImmediately: false,
    gridWidthAndHeight: { width: 2, height: 2 },
    finishedSound: "building-finished" // todo
  }
};

export class Mine extends Building {
  buildingInfoDefinition: BuildingInfoDefinition = MineDefinitions;

  override initComponents() {
    super.initComponents();

    // this.components.addComponent(new ContainerComponent(2));
    // this.components.addComponent(new ResourceDrainComponent(this, [Resources.minerals]));
    // this.components.addComponent(new PlacementRestrictionComponent(this as any, [Tree1.name]));
    new PlacementRestrictionComponent(this as any, [Tree1.name]);
  }
}
