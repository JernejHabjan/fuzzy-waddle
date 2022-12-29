import { CharacterDefinition } from './character';
import { AttackComponent, Attacker } from './combat/attack-component';
import { AttackData } from './combat/attack-data';
import { DamageTypes } from './combat/damage-types';
import { PlayerCharacter } from './player-character';

export const WarriorDefinition: CharacterDefinition = {
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
    move: 'move'
  }
};

export class Warrior extends PlayerCharacter implements Attacker {
  playerCharacterDefinition: CharacterDefinition = WarriorDefinition;
  attackComponent!: AttackComponent;

  override init() {
    super.init();
    this.attackComponent = this.components.addComponent(
      new AttackComponent(this, [new AttackData(10, 10, DamageTypes.DamageTypeNormal, 10)])
    );
  }
}
