// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../../data/actor-data";
import { OwnerComponent, OwnerDefinition } from "../../../../entity/actor/components/owner-component";
import { SelectableComponent } from "../../../../entity/actor/components/selectable-component";
import { HealthComponent, HealthDefinition } from "../../../../entity/combat/components/health-component";
import {
  ProductionCostComponent,
  ProductionCostDefinition
} from "../../../../entity/building/production/production-cost-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../../entity/building/payment-type";
import { IdComponent } from "../../../../entity/actor/components/id-component";
import { VisionComponent, VisionDefinition } from "../../../../entity/actor/components/vision-component";
import { ColliderComponent } from "../../../../entity/actor/components/collider-component";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../../entity/actor/components/object-descriptor-component";
import { ObjectNames } from "../../../../data/object-names";
/* END-USER-IMPORTS */

export default class WallBottomLeftBottomRight extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 79.3842613069379,
      texture || "factions",
      frame ?? "buildings/tivara/wall/wall_bottom_left_bottom_right.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "0 24 7.934866938551643 18.74010259348985 15.025756971788837 21.200207298898675 16.472877386735203 29.44879366409296 32.970050117123776 22.35790363085576 48.020102432565984 31.040626120533958 48.309526515555255 24.0944481287914 55.68984063178173 20.187223008436213 64 24 64.05717051830713 80.06848130994683 31.641673223508523 96.1315179158515 0.09444817767773728 80.50261743443075"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8269193886139364);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0x95a083
        } satisfies ObjectDescriptorDefinition),
        new OwnerComponent(this, {
          color: [
            {
              originalColor: 0x000000,
              epsilon: 0
            }
          ]
        } satisfies OwnerDefinition),
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
        new ColliderComponent()
      ],
      []
    );
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  name = ObjectNames.WallBottomLeftBottomRight;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
