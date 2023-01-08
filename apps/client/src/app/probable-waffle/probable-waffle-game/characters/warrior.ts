import { PawnInfoDefinition } from './character';
import { AttackComponent, Attacker } from './combat/attack-component';
import { AttackData } from './combat/attack-data';
import { DamageTypes } from './combat/damage-types';
import { PlayerCharacter } from './player-character';
import { CostData } from '../buildings/production-cost-component';
import { PaymentType } from '../buildings/payment-type';
import { Resources, ResourceType } from '../buildings/resource-type';
import { Containable, ContainableComponent } from './containable-component';

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
