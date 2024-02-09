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
import { ProductionComponent, ProductionDefinition } from "../../../entity/building/production/production-component";
import SkaduweeMagicianFemale from "../../characters/skaduwee/SkaduweeMagicianFemale";
import SkaduweeRangedFemale from "../../characters/skaduwee/SkaduweeRangedFemale";
import SkaduweeWarriorMale from "../../characters/skaduwee/SkaduweeWarriorMale";
import { VisionComponent, VisionDefinition } from "../../../entity/actor/components/vision-component";
import { ColliderComponent } from "../../../entity/actor/components/collider-component";
import { InfoComponent, InfoDefinition } from "../../../entity/actor/components/info-component";
import { ANIM_BUILDING_ICON_ANIMS_SKADUWEE_INFANTRY_INN } from "../../gui/icon-animations";
/* END-USER-IMPORTS */

export default class InfantryInn extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 64, y ?? 128);

    this.setInteractive(new Phaser.Geom.Circle(0, -35, 59.91620797027979), Phaser.Geom.Circle.Contains);

    // infantry_inn_building
    const infantry_inn_building = scene.add.image(
      -0.16910280030724323,
      -31.74029716298027,
      "factions",
      "buildings/skaduwee/infantry_inn/infantry_inn.png"
    );
    this.add(infantry_inn_building);

    // cloud_1
    const cloud_1 = scene.add.image(24, -82, "factions", "buildings/skaduwee/infantry_inn/cloud-vertical.png");
    this.add(cloud_1);

    // cloud_2
    const cloud_2 = scene.add.image(13, -110, "factions", "buildings/skaduwee/infantry_inn/cloud-vertical.png");
    this.add(cloud_2);

    // skaduwee_buildings_infantry_inn_entrance
    const skaduwee_buildings_infantry_inn_entrance = scene.add.sprite(
      24,
      -8,
      "factions",
      "buildings/skaduwee/infantry_inn/infantry_inn-entrance/infantry_inn-0.png"
    );
    skaduwee_buildings_infantry_inn_entrance.play("skaduwee-buildings-infantry-inn-entrance");
    this.add(skaduwee_buildings_infantry_inn_entrance);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new OwnerComponent(this),
        new VisionComponent(this, {
          range: 5
        } satisfies VisionDefinition),
        new IdComponent(),
        new InfoComponent({
          name: "Infantry Inn",
          description: "Trains infantry units",
          portraitAnimation: {
            idle: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_INFANTRY_INN,
            action: ANIM_BUILDING_ICON_ANIMS_SKADUWEE_INFANTRY_INN
          },
          smallImage: {
            key: "factions",
            frame: "building_icons/skaduwee/infantry_inn.png"
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
          availableProductGameObjectClasses: [
            SkaduweeMagicianFemale.name,
            SkaduweeRangedFemale.name,
            SkaduweeWarriorMale.name
          ]
        } satisfies ProductionDefinition),
        new ColliderComponent()
      ],
      []
    );

    this.cloud1 = cloud_1;
    this.cloud2 = cloud_2;
    this.setupCloudsTween(this.cloud1);
    this.setupCloudsTween(this.cloud2);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private readonly cloud1: Phaser.GameObjects.Image;
  private readonly cloud2: Phaser.GameObjects.Image;
  private readonly tweens: Phaser.Tweens.Tween[] = [];
  private setupCloudsTween(cloud: Phaser.GameObjects.Image) {
    if (!this.active) return;
    // Moving up and disappearing
    this.tweens.push(
      this.scene.tweens.add({
        targets: cloud,
        y: -128,
        alpha: 0,
        duration: 3000,
        onComplete: () => {
          if (!this.active) return;
          // Waiting for 2-4 seconds
          this.scene.time.delayedCall(Phaser.Math.Between(1000, 8000), () => {
            if (!this.active) return;
            // Re-appearing and setting down
            cloud.y = -80;
            this.scene.tweens.add({
              targets: cloud,
              y: -100,
              alpha: 1,
              duration: 1000,
              onComplete: () => {
                // Setting up the next upward movement
                this.setupCloudsTween(cloud);
              }
            });
          });
        }
      })
    );
  }

  override destroy(fromScene?: boolean) {
    super.destroy(fromScene);
    this.tweens.forEach((tween) => tween.destroy());
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
