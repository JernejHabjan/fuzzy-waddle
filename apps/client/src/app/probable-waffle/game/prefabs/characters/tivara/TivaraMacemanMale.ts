// You can write more code here

/* START OF COMPILED CODE */

import Phaser from "phaser";
/* START-USER-IMPORTS */
import { setActorData } from "../../../data/actor-data";
import { OwnerComponent, OwnerDefinition } from "../../../entity/actor/components/owner-component";
import { SelectableComponent } from "../../../entity/actor/components/selectable-component";
import { IdComponent } from "../../../entity/actor/components/id-component";
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
import { VisionComponent, VisionDefinition } from "../../../entity/actor/components/vision-component";
import { InfoComponent, InfoDefinition } from "../../../entity/actor/components/info-component";
import { MovementSystem } from "../../../entity/systems/movement.system";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../entity/actor/components/object-descriptor-component";
import { ActorTranslateComponent } from "../../../entity/actor/components/actor-translate-component";
import { PawnAiController } from "../../../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
import { ObjectNames } from "../../../data/object-names";
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
        new ObjectDescriptorComponent({
          color: 0xc2a080
        } satisfies ObjectDescriptorDefinition),
        new OwnerComponent(this, {
          color: [
            {
              originalColor: 0x31770f,
              epsilon: 0.25
            }
          ]
        } satisfies OwnerDefinition),
        new VisionComponent(this, {
          range: 5
        } satisfies VisionDefinition),
        new IdComponent(),
        new InfoComponent({
          name: "Tivara Maceman",
          description: "A maceman",
          smallImage: {
            key: "factions",
            frame: "character_icons/tivara/maceman_male.png"
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
              range: 1
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
        } satisfies RequirementsDefinition),
        new ActorTranslateComponent(this)
      ],
      [new MovementSystem(this)]
    );

    new PawnAiController(this); // todo

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
  name = ObjectNames.TivaraMacemanMale;
  // Write your code here.

  /* END-USER-CODE */
}

/* END OF COMPILED CODE */

// You can write more code here
