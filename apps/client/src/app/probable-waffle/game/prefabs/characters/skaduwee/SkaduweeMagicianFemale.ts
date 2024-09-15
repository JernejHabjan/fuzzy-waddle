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
import { getActorComponent } from "../../../data/actor-component";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../entity/actor/components/object-descriptor-component";
import { ActorTranslateComponent } from "../../../entity/actor/components/actor-translate-component";
/* END-USER-IMPORTS */

export default class SkaduweeMagicianFemale extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 57.57118202562538);

    this.setInteractive(new Phaser.Geom.Circle(0, 0, 32), Phaser.Geom.Circle.Contains);

    // skaduwee_magician_female_idle_down
    const skaduwee_magician_female_idle_down = scene.add.sprite(0, -25.571183923696843, "magician_female_idle", 4);
    skaduwee_magician_female_idle_down.play("skaduwee_magician_female_idle_down");
    this.add(skaduwee_magician_female_idle_down);

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
              originalColor: 0x9fbbcb,
              epsilon: 0.15
            },
            {
              originalColor: 0xc6eefd,
              epsilon: 0.15
            },
            {
              originalColor: 0xffffff,
              epsilon: 0.05
            }
          ]
        } satisfies OwnerDefinition),
        new VisionComponent(this, {
          range: 5
        } satisfies VisionDefinition),
        new IdComponent(),
        new InfoComponent({
          name: "Skaduwee Magician",
          description: "A magician",
          smallImage: {
            key: "factions",
            frame: "character_icons/skaduwee/magician_female.png"
          }
        } satisfies InfoDefinition),
        new SelectableComponent(this),
        new HealthComponent(this, {
          maxHealth: 50
        } satisfies HealthDefinition),
        new AttackComponent(this, {
          attacks: [
            {
              damage: 20,
              damageType: DamageType.Magical,
              cooldown: 3000,
              range: 10
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

    this.skaduwee_magician_female_idle_down = skaduwee_magician_female_idle_down;
    this.on("pointerdown", () => {
      // and play anim skaduwee_worker_male_slash_down
      skaduwee_magician_female_idle_down.play("skaduwee_magician_female_cast_down", true);
      this.playTestAttackAnim();

      // after anim complete, remove tint
      skaduwee_magician_female_idle_down.once("animationcomplete", () => {
        skaduwee_magician_female_idle_down.clearTint();
        skaduwee_magician_female_idle_down.play("skaduwee_magician_female_idle_down", true);
      });
    });

    setTimeout(() => {
      console.warn("Warning - triggering automatic damage for test:");
      getActorComponent(this, HealthComponent)!.takeDamage(10, DamageType.Magical); // todo
    }, 1000);
    /* END-USER-CTR-CODE */
  }

  /* START-USER-CODE */
  private skaduwee_magician_female_idle_down: Phaser.GameObjects.Sprite;

  private playTestAttackAnim() {
    // create a sprite
    const animAttack = this.scene.add.sprite(
      this.x,
      this.y - this.skaduwee_magician_female_idle_down.height / 4,
      "effects_1",
      "impact/1/1/0.png"
    );
    animAttack.depth = this.depth + 1;
    // get 0-23 random number
    const randomFrame = Math.floor(Math.random() * 24);
    animAttack.play("impact_" + randomFrame);

    // remove sprite after anim complete
    animAttack.once("animationcomplete", () => {
      animAttack.destroy();
    });
  }

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
