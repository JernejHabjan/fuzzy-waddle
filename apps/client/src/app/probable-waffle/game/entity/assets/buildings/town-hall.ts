import { Building, BuildingInfoDefinition } from "./building";
import { PaymentType } from "../../building/payment-type";

export const TownHallDefinition: BuildingInfoDefinition = {
  textureMapDefinition: {
    textureName: "warrior",
    spriteSheet: {
      name: "warrior",
      path: "general/town-hall/",
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

export class TownHall extends Building {
  buildingInfoDefinition: BuildingInfoDefinition = TownHallDefinition;

  override initComponents() {
    super.initComponents();

    // this.components.addComponent(new ProductionComponent(this, [Warrior, Worker], 2, 3));
    // this.components.addComponent(new ContainerComponent(10));
    // this.components.addComponent(new ResourceDrainComponent(this, [Resources.minerals]));
  }
}
