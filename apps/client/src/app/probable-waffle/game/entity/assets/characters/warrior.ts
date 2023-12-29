import { PawnInfoDefinition } from "../../actor/character";
import { AttackComponent } from "../../combat/components/attack-component";
import { AttackData } from "../../combat/attack-data";
import { DamageTypes } from "../../combat/damage-types";
import { PlayerCharacter } from "../../actor/player-character";
import { CostData } from "../../building/production/production-cost-component";
import { PaymentType } from "../../building/payment-type";
import { Resources, ResourceType } from "@fuzzy-waddle/api-interfaces";
import { ContainableComponent } from "../../actor/components/containable-component";

export const WarriorDefinition: PawnInfoDefinition = {
  healthDefinition: {
    maxHealth: 100
  },
  textureMapDefinition: {
    textureName: "warrior",
    spriteSheet: {
      name: "warrior",
      path: "characters/general/warrior/",
      frameConfig: {
        frameWidth: 64,
        frameHeight: 64
      }
    }
  },
  soundDefinition: {
    move: "move",
    death: "death"
  },
  cost: new CostData(PaymentType.PayOverTime, 20, new Map<ResourceType, number>([[Resources.ambrosia, 50]]), 0.5)
};

export class Warrior extends PlayerCharacter {
  pawnDefinition: PawnInfoDefinition = WarriorDefinition;

  override initComponents() {
    super.initComponents();

    this.components.addComponent(new AttackComponent(this, [new AttackData(10, 10, DamageTypes.DamageTypeNormal, 10)]));
    this.components.addComponent(new ContainableComponent(this));
  }
}
