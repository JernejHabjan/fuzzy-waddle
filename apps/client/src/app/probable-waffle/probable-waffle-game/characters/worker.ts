import { CharacterDefinition } from './character';
import { GathererComponent } from './gatherer-component';
import { PlayerCharacter } from './player-character';

export const WorkerDefinition: CharacterDefinition = {
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
  playerCharacterDefinition: CharacterDefinition = WorkerDefinition;

  override init() {
    super.init();
    this.components.addComponent(new GathererComponent(this, [], 100));
  }
}
