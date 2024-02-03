// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../../data/actor-data";
import { OwnerComponent } from "../../../../entity/actor/components/owner-component";
import { SelectableComponent } from "../../../../entity/actor/components/selectable-component";
import { HealthComponent, HealthDefinition } from "../../../../entity/combat/components/health-component";
import {
  ProductionCostComponent,
  ProductionCostDefinition
} from "../../../../entity/building/production/production-cost-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/building/payment-type";
import { IdComponent } from "../../../../entity/actor/components/id-component";
/* END-USER-IMPORTS */

export default class WallTopLeftBottomRight extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 79.05849266728504,
      texture || "factions",
      frame ?? "buildings/tivara/wall/wall_top_left_bottom_right.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "8.046535883941122 27.15649245608084 8.11050339064451 20.154591125340758 16.27835906296714 16.281989983774707 22.593083293009386 19.592287803365338 24.105924223552485 19.475915424092797 24.10057615079924 12.573265437310965 32.36836315190326 8.653284151746007 40.32218391886053 12.512238015076662 40.63080208025403 27.621981973171025 47.72951721587935 31.695015247710145 48.42775149151462 24.712672491357367 56.766083152115385 20.4903217981569 64 24 64.01346090963587 80.05930535830076 31.54628241463866 96.17776276716462 0.00015862871939020806 80.40470087420499 0.0000226227630264475 32.044130886628906"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8235259652842192);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new OwnerComponent(this),
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
        } satisfies ProductionCostDefinition)
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
