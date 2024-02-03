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
import { AttackComponent, AttackDefinition } from "../../../entity/combat/components/attack-component";
import { DamageType } from "../../../entity/combat/damage-type";
import { AttackData } from "../../../entity/combat/attack-data";
import { PaymentType } from "../../../entity/building/payment-type";
import { ContainableComponent } from "../../../entity/actor/components/containable-component";
/* END-USER-IMPORTS */

export default class GeneralWarrior extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 57.554331622949405, texture || "warrior_idle", frame ?? 4);

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.899286430676403);
    this.play("general_warrior_idle_down");

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new OwnerComponent(this),
        new IdComponent(),
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
        new ContainableComponent(this)
      ],
      []
    );

    this.on("pointerdown", () => {
      // and play anim skaduwee_worker_male_slash_down
      this.play("general_warrior_thrust_down", true);
      // after anim complete, remove tint
      this.once("animationcomplete", () => {
        this.clearTint();
        this.play("general_warrior_idle_down", true);
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
