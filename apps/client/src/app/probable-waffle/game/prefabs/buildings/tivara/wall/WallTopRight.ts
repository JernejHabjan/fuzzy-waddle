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

export default class WallTopRight extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 80.09149131094786,
      texture || "factions",
      frame ?? "buildings/tivara/wall/wall_top_right.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "24.522990298557996 26.984425274633125 25.463861396805637 11.742313483021377 32.42630752383816 7.226132211432713 40.517798968767856 11.930487702670902 40.928087805760434 19.370137431428176 41.77339003415473 19.722346693259134 47.91713309038337 15.733638610633264 56.707062735787225 20.144997807456278 57.12971384998437 27.541392305906335 64 30.74790915848871 64.22775064460836 79.86138099615043 31.485435904243303 95.99999999999999 0.06034174411938409 80.2377294354495 -1.4210854715202004e-14 38.83940046943657"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8342863678223735);

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
