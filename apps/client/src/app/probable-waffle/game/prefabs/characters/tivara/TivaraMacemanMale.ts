// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../data/actor-data";
import { OwnerComponent } from "../../../entity/actor/components/owner-component";
import { SelectableComponent } from "../../../entity/actor/components/selectable-component";
import { HealthComponent, HealthDefinition } from "../../../entity/combat/components/health-component";
import { AttackComponent, AttackDefinition } from "../../../entity/combat/components/attack-component";
import { AttackData } from "../../../entity/combat/attack-data";
import { DamageType } from "../../../entity/combat/damage-type";
import {
  ProductionCostComponent,
  ProductionCostDefinition
} from "../../../entity/building/production/production-cost-component";
import { PaymentType } from "../../../entity/building/payment-type";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ContainableComponent } from "../../../entity/actor/components/containable-component";
import { RequirementsComponent, RequirementsDefinition } from "../../../entity/actor/components/requirements-component";
import AnkGuard from "../../buildings/tivara/AnkGuard";
/* END-USER-IMPORTS */

export default class TivaraMacemanMale extends Phaser.GameObjects.Container {
  constructor(scene: Phaser.Scene, x?: number, y?: number) {
    super(scene, x ?? 32, y ?? 57.35487752340556);

    this.setInteractive(new Phaser.Geom.Circle(0, -25.354877574887297, 32), Phaser.Geom.Circle.Contains);

    // tivara_maceman_male_idle_down
    const tivara_maceman_male_idle_down = scene.add.sprite(0, -25.354877523405563, "maceman_male_idle", 4);
    tivara_maceman_male_idle_down.play("tivara_maceman_male_idle_down");
    this.add(tivara_maceman_male_idle_down);

    /* START-USER-CTR-CODE */
    setActorData(
      this,
      [
        new OwnerComponent(this),
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
          actors: [AnkGuard.name]
        } satisfies RequirementsDefinition)
      ],
      []
    );

    this.on("pointerdown", () => {
      // and play anim skaduwee_worker_male_slash_down
      tivara_maceman_male_idle_down.play("tivara_maceman_male_large_slash_down", true);
      // after anim complete, remove tint
      tivara_maceman_male_idle_down.once("animationcomplete", () => {
        tivara_maceman_male_idle_down.clearTint();
        tivara_maceman_male_idle_down.play("tivara_maceman_male_idle_down", true);
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
