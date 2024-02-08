// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../data/actor-data";
import { OwnerComponent } from "../../../entity/actor/components/owner-component";
import { SelectableComponent } from "../../../entity/actor/components/selectable-component";
import { IdComponent } from "../../../entity/actor/components/id-component";

import { HealthComponent, HealthDefinition } from "../../../entity/combat/components/health-component";
import {
  ProductionCostComponent,
  ProductionCostDefinition
} from "../../../entity/building/production/production-cost-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../entity/building/payment-type";
import {
  ResourceDrainComponent,
  ResourceDrainDefinition
} from "../../../entity/economy/resource/resource-drain-component";
import { VisionComponent, VisionDefinition } from "../../../entity/actor/components/vision-component";
/* END-USER-IMPORTS */

export default class WorkMill extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 96.29342343955079);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-63.89974877636719 -65.64818497632388 -36.35219201632184 -96.09548455321611 16.32646915639647 -69.99779920159419 16.568114391133705 -48.974663779454325 41.215928334332176 -61.781861220528036 51.60667342803349 -53.80756847419912 52.33160913224522 -20.460526080460014 62.72235422594652 -9.103200047809736 60.30590187857412 0.07931887220537703 7.385595471118592 31.25155415330933 -49.64267992687003 27.62687563225073 -59.79177978583411 7.570321149059822 -58.82519884688515 -61.781861220528036"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // buildings_tivara_workmill_png_1
    const buildings_tivara_workmill_png_1 = scene.add.image(
      0,
      -32.29342343955079,
      "factions",
      "buildings/tivara/workmill.png"
    );
    this.add(buildings_tivara_workmill_png_1);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new OwnerComponent(this),
        new VisionComponent(this, {
          range: 5
        } satisfies VisionDefinition),
        new IdComponent(),
        new SelectableComponent(this),
        new HealthComponent(this, {
          maxHealth: 100
        } satisfies HealthDefinition),
        new ProductionCostComponent(this, {
          resources: {
            [ResourceType.Wood]: 10,
            [ResourceType.Minerals]: 10
          },
          refundFactor: 0.5,
          productionTime: 1000,
          costType: PaymentType.PayImmediately
        } satisfies ProductionCostDefinition),
        new ResourceDrainComponent(this, {
          resourceTypes: [ResourceType.Wood]
        } satisfies ResourceDrainDefinition)
      ],
      []
    );
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
