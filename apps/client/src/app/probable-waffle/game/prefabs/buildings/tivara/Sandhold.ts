// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { ANIM_TIVARA_BUILDINGS_OLIVAL_SMALL } from "../../../../../../assets/probable-waffle/atlas/anims/tivara/buildings";
import { OwnerComponent, OwnerDefinition } from "../../../entity/actor/components/owner-component";
import { setActorData } from "../../../data/actor-data";
import { SelectableComponent } from "../../../entity/actor/components/selectable-component";
import { IdComponent } from "../../../entity/actor/components/id-component";
import { HealthComponent, HealthDefinition } from "../../../entity/combat/components/health-component";
import { ContainerComponent, ContainerDefinition } from "../../../entity/building/container-component";
import {
  ResourceDrainComponent,
  ResourceDrainDefinition
} from "../../../entity/economy/resource/resource-drain-component";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ProductionComponent, ProductionDefinition } from "../../../entity/building/production/production-component";
import TivaraWorkerMale from "../../characters/tivara/TivaraWorkerMale";
import TivaraWorkerFemale from "../../characters/tivara/TivaraWorkerFemale";
import {
  ProductionCostComponent,
  ProductionCostDefinition
} from "../../../entity/building/production/production-cost-component";
import { PaymentType } from "../../../entity/building/payment-type";
import { VisionComponent, VisionDefinition } from "../../../entity/actor/components/vision-component";
import { ColliderComponent } from "../../../entity/actor/components/collider-component";
import { InfoComponent, InfoDefinition } from "../../../entity/actor/components/info-component";
import {
  ANIM_BUILDING_ICON_ANIMS_TIVARA_SANDHOLD_ACTION,
  ANIM_BUILDING_ICON_ANIMS_TIVARA_SANDHOLD_IDLE
} from "../../gui/icon-animations";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../entity/actor/components/object-descriptor-component";
/* END-USER-IMPORTS */

export default class Sandhold extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 160, y ?? 240);

    this.setInteractive(
      new Phaser.Geom.Polygon("-154 2 -1 -219 153 0 123 24 119 47 82 64 60 53 5 79 -56 53 -81 58 -119 42 -120 22"),
      Phaser.Geom.Polygon.Contains
    );

    // sandhold_building
    const sandhold_building = scene.add.image(0, -80, "factions", "buildings/tivara/sandhold/sandhold.png");
    this.add(sandhold_building);

    // hover_crystal
    const hover_crystal = scene.add.image(0, -192, "factions", "buildings/tivara/sandhold/sandhold-crystal.png");
    this.add(hover_crystal);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new ObjectDescriptorComponent({
          color: 0xc2a080
        } satisfies ObjectDescriptorDefinition),
        new OwnerComponent(this, {
          color: [
            {
              originalColor: 0x4dbd33,
              epsilon: 0.1
            }
          ]
        } satisfies OwnerDefinition),
        new VisionComponent(this, {
          range: 5
        } satisfies VisionDefinition),
        new IdComponent(),
        new InfoComponent({
          name: "Sandhold",
          description: "Main building of the Tivara faction. It is used to produce workers and store resources.",
          portraitAnimation: {
            idle: ANIM_BUILDING_ICON_ANIMS_TIVARA_SANDHOLD_IDLE,
            action: ANIM_BUILDING_ICON_ANIMS_TIVARA_SANDHOLD_ACTION
          },
          smallImage: {
            key: "factions",
            frame: "building_icons/tivara/sandhold.png"
          }
        } satisfies InfoDefinition),
        new SelectableComponent(this),
        new HealthComponent(this, {
          maxHealth: 100,
          maxArmor: 50
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
        new ContainerComponent(this, {
          capacity: 2
        } satisfies ContainerDefinition),
        new ResourceDrainComponent(this, {
          resourceTypes: [ResourceType.Wood, ResourceType.Minerals, ResourceType.Stone, ResourceType.Ambrosia]
        } satisfies ResourceDrainDefinition),
        new ProductionComponent(this, {
          queueCount: 1,
          capacityPerQueue: 5,
          availableProductGameObjectClasses: [TivaraWorkerMale.name, TivaraWorkerFemale.name]
        } satisfies ProductionDefinition),
        new ColliderComponent()
      ],
      []
    );

    // Create a continuous hover effect for hover_crystal
    scene.tweens.add({
      targets: hover_crystal,
      y: "-=4", // move up by 4
      duration: 1000, // takes 1000ms
      ease: "Sine.InOut",
      yoyo: true, // reverse the animation after it completes
      loop: -1 // loop indefinitely
    });

    // spawn crystal every 4-6 seconds
    scene.time.addEvent({
      delay: Phaser.Math.Between(4000, 6000),
      callback: () => this.spawnCrystal(scene),
      callbackScope: this,
      loop: true
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  spawnCrystal(scene: Phaser.Scene) {
    const span = scene.add.sprite(-48, -48, "factions", "buildings/tivara/olival_small/olival_small-0.png");
    span.scaleX = 0.5;
    span.scaleY = 0.5;
    span.angle = -70;
    span.play(ANIM_TIVARA_BUILDINGS_OLIVAL_SMALL);
    this.add(span);

    scene.tweens.add({
      targets: span,
      duration: 1000,
      x: -112,
      y: 64,
      onComplete: function () {
        span.destroy(); // destroy the sprite after the tween completes
      }
    });
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
