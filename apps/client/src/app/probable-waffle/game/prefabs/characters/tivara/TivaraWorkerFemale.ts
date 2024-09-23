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
import { AttackComponent, AttackDefinition } from "../../../entity/combat/components/attack-component";
import { DamageType } from "../../../entity/combat/damage-type";
import { AttackData } from "../../../entity/combat/attack-data";
import { ResourceType } from "@fuzzy-waddle/api-interfaces";
import { PaymentType } from "../../../entity/building/payment-type";
import { ContainableComponent } from "../../../entity/actor/components/containable-component";
import { RequirementsComponent, RequirementsDefinition } from "../../../entity/actor/components/requirements-component";
import { BuilderComponent, BuilderDefinition } from "../../../entity/actor/components/builder-component";
import { GathererComponent, GathererDefinition } from "../../../entity/actor/components/gatherer-component";
import Sandhold from "../../buildings/tivara/Sandhold";
import AnkGuard from "../../buildings/tivara/AnkGuard";
import Olival from "../../buildings/tivara/Olival";
import Temple from "../../buildings/tivara/Temple";
import { VisionComponent, VisionDefinition } from "../../../entity/actor/components/vision-component";
import { InfoComponent, InfoDefinition } from "../../../entity/actor/components/info-component";
import { MovementSystem } from "../../../entity/systems/movement.system";
import {
  ObjectDescriptorComponent,
  ObjectDescriptorDefinition
} from "../../../entity/actor/components/object-descriptor-component";
import { ActorTranslateComponent } from "../../../entity/actor/components/actor-translate-component";
import { PawnAiController } from "../../../world/managers/controllers/player-pawn-ai-controller/pawn-ai-controller";
/* END-USER-IMPORTS */

export default class TivaraWorkerFemale extends Phaser.GameObjects.Sprite {
  constructor(scene: Phaser.Scene, x?: number, y?: number, texture?: string, frame?: number | string) {
    super(scene, x ?? 32, y ?? 57.107040025447624, texture || "worker_female_idle_1", frame ?? 4);

    this.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains);
    this.setOrigin(0.5, 0.8922974795475218);
    this.play("tivara_worker_female_idle_down");

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
          name: "Tivara Female Worker",
          description: "A worker",
          smallImage: {
            key: "factions",
            frame: "character_icons/tivara/worker_female.png"
          }
        } satisfies InfoDefinition),
        new SelectableComponent(this),
        new HealthComponent(this, {
          maxHealth: 100
        } satisfies HealthDefinition),
        new AttackComponent(this, {
          attacks: [
            {
              damage: 1,
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
          actors: [Sandhold.name]
        } satisfies RequirementsDefinition),
        new BuilderComponent(this, {
          constructableBuildingClasses: [Sandhold.name, AnkGuard.name, Olival.name, Temple.name],
          constructionSiteOffset: 2,
          enterConstructionSite: false
        } satisfies BuilderDefinition),
        new GathererComponent(this, {
          resourceSweepRadius: 100,
          resourceSourceGameObjectClasses: [
            ResourceType.Ambrosia,
            ResourceType.Wood,
            ResourceType.Minerals,
            ResourceType.Stone
          ]
        } satisfies GathererDefinition),
        new ActorTranslateComponent(this)
      ],
      [new MovementSystem(this)]
    );

    new PawnAiController(this); // todo

    this.on("pointerdown", () => {
      // and play anim skaduwee_worker_male_slash_down
      this.play("tivara_worker_female_slash_down", true);
      // after anim complete, remove tint
      this.once("animationcomplete", () => {
        this.clearTint();
        this.play("tivara_worker_female_idle_down", true);
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
