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
/* END-USER-IMPORTS */

export default class WallTopLeftBottomLeft extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 79.90347312746019,
      texture || "factions",
      frame ?? "buildings/tivara/wall/wall_top_left_bottom_left.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "0.034404166381317935 22.50844255997221 8.151537521589503 18.057111365180624 15.919546861519919 22.421161556152768 23.687556201450338 18.49351638427784 24.123961220547553 12.122003105458504 32.764780598672395 7.496109903028028 40.009103915686154 11.860160094000179 40.53278993860282 24.428624643999953 47.602551247977686 28.007145800597115 48.21351827471379 24.079500628722187 56.330651629921974 19.628169433930594 64 24 64.16598891149339 79.59085566461826 31.8464296683797 96 0.23253715668976938 79.30858876945356"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8323278450777103);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new OwnerComponent(this),
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
