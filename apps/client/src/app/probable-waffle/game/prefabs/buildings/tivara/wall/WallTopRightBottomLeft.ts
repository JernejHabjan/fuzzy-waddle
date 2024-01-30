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

export default class WallTopRightBottomLeft extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 80.18706841494858,
      texture || "factions",
      frame ?? "buildings/tivara/wall/wall_top_right_bottom_left.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "0.18421761380541923 22.749854324197926 8.18884177233597 18.6309700484492 14.483740382442516 20.962413978118292 16.34889552617779 23.52700230075429 16.426610323833426 30.365904494450298 23.654086505807612 26.169305421045934 24.342182231547596 11.087581163350393 31.75237962823371 7.156808994359935 39.474440318803715 11.190103286123858 39.91810839543426 19.27327310903469 41.083830360268806 19.27327310903469 47.98260168520733 15.633984271730199 55.87876664636329 19.758214621738745 55.84964191483972 27.04475287459833 64 31.206322560196917 64.15952499851116 79.64647626998052 30.899560431703023 96 -0.14307397303934977 80.6698598079893"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8352819626557144);

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
