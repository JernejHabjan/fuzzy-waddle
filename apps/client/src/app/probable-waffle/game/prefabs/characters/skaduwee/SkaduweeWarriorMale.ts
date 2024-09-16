// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
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
import { AttackComponent, AttackDefinition } from "../../../entity/combat/components/attack-component";
import { DamageType } from "../../../entity/combat/damage-type";
import { AttackData } from "../../../entity/combat/attack-data";
import { PaymentType } from "../../../entity/building/payment-type";
import { ContainableComponent } from "../../../entity/actor/components/containable-component";
import { RequirementsComponent, RequirementsDefinition } from "../../../entity/actor/components/requirements-component";
import InfantryInn from "../../buildings/skaduwee/InfantryInn";
import { VisionComponent, VisionDefinition } from "../../../entity/actor/components/vision-component";
import { InfoComponent, InfoDefinition } from "../../../entity/actor/components/info-component";
import { MovementSystem } from "../../../entity/systems/movement.system";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../entity/actor/components/object-descriptor-component";
import { ActorTranslateComponent } from "../../../entity/actor/components/actor-translate-component";
/* END-USER-IMPORTS */

export default class SkaduweeWarriorMale extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 57.77331682786765);

    this.setInteractive(new Phaser.Geom.Circle(0, 0, 32), Phaser.Geom.Circle.Contains);

    // skaduwee_warrior_male_idle_down
    const skaduwee_warrior_male_idle_down = scene.add.sprite(0, -25.773318048605454, "warrior_male_idle", 4);
    skaduwee_warrior_male_idle_down.play("skaduwee_warrior_male_idle_down");
    this.add(skaduwee_warrior_male_idle_down);

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
              originalColor: 0x867e7f,
              epsilon: 0.2
            }
          ]
        } satisfies OwnerDefinition),
        new VisionComponent(this, {
          range: 5
        } satisfies VisionDefinition),
        new IdComponent(),
        new InfoComponent({
          name: "Skaduwee Warrior",
          description: "A warrior",
          smallImage: {
            key: "factions",
            frame: "character_icons/skaduwee/warrior_male.png"
          }
        } satisfies InfoDefinition),
        new SelectableComponent(this),
        new HealthComponent(this, {
          maxHealth: 100
        } satisfies HealthDefinition),
        new AttackComponent(this, {
          attacks: [
            {
              damage: 10,
              damageType: DamageType.Physical,
              cooldown: 1000,
              range: 3
            } satisfies AttackData
          ]
        } satisfies AttackDefinition),
        new ProductionCostComponent(this, {
          resources: {
            [ResourceType.Wood]: 10,
            [ResourceType.Minerals]: 10
          },
          refundFactor: 0.5,
          productionTime: 1000,
          costType: PaymentType.PayImmediately
        } satisfies ProductionCostDefinition),
        new ContainableComponent(this),
        new RequirementsComponent(this, {
          actors: [InfantryInn.name]
        } satisfies RequirementsDefinition),
        new ActorTranslateComponent(this)
      ],
      [new MovementSystem(this)]
    );

    this.on("pointerdown", () => {
      // and play anim skaduwee_worker_male_slash_down
      skaduwee_warrior_male_idle_down.play("skaduwee_warrior_male_smash_down", true);
      // after anim complete, remove tint
      skaduwee_warrior_male_idle_down.once("animationcomplete", () => {
        skaduwee_warrior_male_idle_down.clearTint();
        skaduwee_warrior_male_idle_down.play("skaduwee_warrior_male_idle_down", true);
      });
    });
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */

  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
