import { PlayerCharacter, PlayerCharacterDefinition } from './player-character';
import { AttackComponent } from './combat/attack-component';
import { AttackData } from './combat/attack-data';
import { DamageTypes } from './combat/damage-types';
import { GathererComponent } from './gatherer-component';

export const WorkerDefinition: PlayerCharacterDefinition = {
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
export class Worker extends PlayerCharacter {
  playerCharacterDefinition: PlayerCharacterDefinition = WorkerDefinition;

  override init() {
    super.init();
    this.components.addComponent(new GathererComponent(this, [], 100));
  }
}
