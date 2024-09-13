// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import {
  ANIM_SKADUWEE_BUILDINGS_OWLERY_OWL,
  ANIM_SKADUWEE_BUILDINGS_OWLERY_OWL_FLAP
} from "../../../../../../assets/probable-waffle/atlas/anims/skaduwee/buildings";
import { setActorData } from "../../../data/actor-data";
import { OwnerComponent, OwnerDefinition } from "../../../entity/actor/components/owner-component";
import { SelectableComponent } from "../../../entity/actor/components/selectable-component";
import { IdComponent } from "../../../entity/actor/components/id-component";
import { HealthComponent, HealthDefinition } from "../../../entity/combat/components/health-component";
import {
  ProductionCostComponent,
  ProductionCostDefinition
} from "../../../entity/building/production/production-cost-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../entity/building/payment-type";
import { ProductionComponent, ProductionDefinition } from "../../../entity/building/production/production-component";
import SkaduweeOwl from "../../units/skaduwee/SkaduweeOwl";
import { VisionComponent, VisionDefinition } from "../../../entity/actor/components/vision-component";
import { ColliderComponent } from "../../../entity/actor/components/collider-component";
import { InfoComponent, InfoDefinition } from "../../../entity/actor/components/info-component";
import {
  ANIM_BUILDING_ICON_ANIMS_SKADUWEE_OWLERY_ACTION,
  ANIM_BUILDING_ICON_ANIMS_SKADUWEE_OWLERY_IDLE
} from "../../gui/icon-animations";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../entity/actor/components/object-descriptor-component";
/* END-USER-IMPORTS */

export default class Owlery extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 176);

    this.setInteractive(
      new Phaser.Geom.Polygon(
        "-29.198913756532136 -132.13554367686658 -29.393053965807688 -151.14078501381945 -19.073855503242058 -165.58766286141133 1.0485814987609317 -172.81110178520728 21.686978423892192 -164.8137229767189 30.20031715550884 -150.36684512912703 30.45829711707298 -133.34016766589374 26.008798018194 -123.10624502212163 25.82529643447679 4.115500961156727 20.519498822728373 11.61680103293898 10.456779214239987 14.910054722989713 -8.387950234383709 15.093013261325865 -21.926882071258987 9.60425711124131 -25.22013576130973 3.749583884484423 -24.81325440994174 -123.10624502212163"
      ),
      Phaser.Geom.Polygon.Contains
    );

    // owlery_building
    const owlery_building = scene.add.image(0, -80, "factions", "buildings/skaduwee/owlery/owlery.png");
    this.add(owlery_building);

    // skaduwee_buildings_owlery_owl
    const skaduwee_buildings_owlery_owl = scene.add.sprite(
      3,
      -134,
      "factions",
      "buildings/skaduwee/owlery/owlery-owl/owlery-owl-0.png"
    );
    skaduwee_buildings_owlery_owl.play("skaduwee-buildings-owlery-owl");
    this.add(skaduwee_buildings_owlery_owl);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0xf2f7fa
        } satisfies ObjectDescriptorDefinition),
        new OwnerComponent(this, {
          color: [
            {
              originalColor: 0xf4f5f7,
              epsilon: 0
            }
          ]
        } satisfies OwnerDefinition),
        new VisionComponent(this, {
          range: 5
        } satisfies VisionDefinition),
        new IdComponent(),
        new InfoComponent({
          name: "Owlery",
          description: "Produces Owls",
          portraitAnimation: {
            idle: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_OWLERY_IDLE,
            action: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_OWLERY_ACTION
          },
          smallImage: {
            key: "factions",
            frame: "building_icons/skaduwee/owlery.png"
          }
        } satisfies InfoDefinition),
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
        new ProductionComponent(this, {
          queueCount: 1,
          capacityPerQueue: 5,
          availableProductGameObjectClasses: [SkaduweeOwl.name]
        } satisfies ProductionDefinition),
        new ColliderComponent()
      ],
      []
    );

    this.flapRandomly(skaduwee_buildings_owlery_owl);

    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  private flapRandomly = (owlSprite: Phaser.GameObjects.Sprite) => {
    if (!this.active) return;
    owlSprite.play(ANIM_SKADUWEE_BUILDINGS_OWLERY_OWL_FLAP, true);
    // on animation end, play default
    owlSprite.once("animationcomplete", () => {
      owlSprite.play(ANIM_SKADUWEE_BUILDINGS_OWLERY_OWL, true);
    });
    const randomDelay = Phaser.Math.Between(20000, 40000);
    setTimeout(() => {
      this.flapRandomly(owlSprite);
    }, randomDelay);
  };
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
