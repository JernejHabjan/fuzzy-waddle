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

export default class WallEmpty extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(
      scene,
      x ?? 32,
      y ?? 80.17556591525863,
      texture || "factions",
      frame ?? "buildings/tivara/wall/wall_empty.png"
    );

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-0.015310781444973998 39.49612852219269 32.42741038545539 23.404538823410114 63.96173535968254 39.106815868189884 64.05333914484575 79.87017070349822 31.35107620861019 96.0915312869484 -0.05347788094935879 80.38925424216862"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8351621449506107);

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
  name = ObjectNames.WallEmpty;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
