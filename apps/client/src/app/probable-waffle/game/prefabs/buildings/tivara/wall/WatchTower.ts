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
import { InfoComponent, InfoDefinition } from "../../../../entity/actor/components/info-component";
import { ContainerComponent, ContainerDefinition } from "../../../../entity/building/container-component";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../../entity/actor/components/object-descriptor-component";
/* END-USER-IMPORTS */

export default class WatchTower extends Phaser.GameObjects.Image {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 64, y ?? 147.21244874992414, texture || "factions", frame ?? "buildings/tivara/watchtower.png");

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "0.13401186115921604 39.2416526175671 15.242462334190208 32.36315409427169 23.850238309993998 35.76842810667759 24.134011144361153 28.768698192287687 31.51210483790726 24.41751473199126 39.55233514497674 27.728197799608097 40.40365364807821 21.012240719585364 47.592565452046216 16.18810253534369 55.8219776486938 19.498785602960524 56.48411426221717 12.309873798992527 64.14598079013044 8.242463173063243 72.0521992360407 12.540365740748797 71.95760829125165 20.486005103029214 79.99783859832112 16.13482164273279 87.8488870158125 21.053550771763526 88.41643268454682 28.43164446530963 96.07829921246008 24.364233839380375 104.11852951952956 28.43164446530963 104.40230235389672 36.37728382759006 112.4425326609662 32.30987320166079 127.95544760637084 41.20142201183175 128.09080885025003 65.25632144690857 123.92880727953172 65.91845806043193 124.49635294826604 82.56646434330521 122.22617027332878 83.32319190161763 122.15753086298719 146.90324363506113 63.718092542300454 176 8.061482621909171 148.4492605488969 8.028380866554102 85.24191407279183 4.008736890581162 82.61368531927107 3.854135199197586 66.07130434122858 -0.010907085391778537 64.37068573600926"
      ),
      Phaser.Geom.Polygon.Contains
    );
    this.setOrigin(0.5, 0.8364343678972962);

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
          range: 8
        } satisfies VisionDefinition),
        new IdComponent(),
        new InfoComponent({
          name: "Watch Tower",
          description: "Main defense building",
          smallImage: {
            key: "factions",
            frame: "buildings/tivara/watchtower.png"
          }
        } satisfies InfoDefinition),
        new SelectableComponent(this),
        new HealthComponent(this, {
          maxHealth: 100
        } satisfies HealthDefinition),
        new ProductionCostComponent(this, {
          resources: {
            [ResourceType.Wood]: 10,
            [ResourceType.Stone]: 30
          },
          refundFactor: 0.5,
          productionTime: 1000,
          costType: PaymentType.PayImmediately
        } satisfies ProductionCostDefinition),
        new ContainerComponent(this, {
          capacity: 2
        } satisfies ContainerDefinition),
        new ColliderComponent()
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
