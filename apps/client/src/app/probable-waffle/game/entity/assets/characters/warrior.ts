import { PawnInfoDefinition } from '../../actor/character';
import { AttackComponent, Attacker } from '../../combat/components/attack-component';
import { AttackData } from '../../combat/attack-data';
import { DamageTypes } from '../../combat/damage-types';
import { PlayerCharacter } from '../../actor/player-character';
import { CostData } from '../../building/production/production-cost-component';
import { PaymentType } from '../../building/payment-type';
import { Resources, ResourceType } from '../../economy/resource/resource-type';
import { Containable, ContainableComponent } from '../../actor/components/containable-component';

export const WarriorDefinition: PawnInfoDefinition = {
  healthDefinition: {
    maxHealth: 100
  },
  textureMapDefinition: {
    textureName: 'warrior',
    spriteSheet: {
      name: 'warrior',
      frameConfig: {
        frameWidth: 64,
        frameHeight: 64
      }
    }
  },
  soundDefinition: {
    move: 'move',
    death: 'death'
  },
  cost: new CostData(PaymentType.PayOverTime, 20, new Map<ResourceType, number>([[Resources.ambrosia, 50]]), 0.5)
};

export class Warrior extends PlayerCharacter implements Attacker, Containable {
  pawnDefinition: PawnInfoDefinition = WarriorDefinition;
  containableComponent!: ContainableComponent;
  attackComponent!: AttackComponent;

  override init() {
    super.init();
    this.attackComponent = this.components.addComponent(
      new AttackComponent(this, [new AttackData(10, 10, DamageTypes.DamageTypeNormal, 10)])
    );
    this.containableComponent = this.components.addComponent(new ContainableComponent(this));
  }
}
