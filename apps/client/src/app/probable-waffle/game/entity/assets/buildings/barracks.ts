import { Building, BuildingInfoDefinition } from "./building";
import { ProductionComponent } from "../../building/production/production-component";
import { PaymentType } from "../../building/payment-type";
import { Resources, ResourceTypeDefinition } from "@fuzzy-waddle/api-interfaces";
import Tree1 from "../../../prefabs/outside/foliage/trees/resources/Tree1";
import { ObjectNames } from "../../../data/object-names";

export const BarracksDefinition: BuildingInfoDefinition = {
  textureMapDefinition: {
    textureName: "warrior",
    spriteSheet: {
      name: "barracks",
      path: "general/barracks/",
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

export class Barracks extends Building {
  buildingInfoDefinition: BuildingInfoDefinition = BarracksDefinition;
  private productionComponent!: ProductionComponent;

  override initComponents() {
    super.initComponents();

    // this.productionComponent = this.components.addComponent(new ProductionComponent(this, [Warrior, Worker], 2, 3));
    // this.components.addComponent(new ContainerComponent(10));
  }

  override postStart() {
    super.postStart();

    setTimeout(() => {
      this.productionComponent.startProduction({ actorName: ObjectNames.Tree1, costData: null as any });
      console.log("started production of 1 warrior");
    }, 1000);
  }
}
