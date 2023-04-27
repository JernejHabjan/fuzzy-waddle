import { PawnInfoDefinition } from '../../actor/character';
import { GathererComponent } from '../../actor/components/gatherer-component';
import { PlayerCharacter } from '../../actor/player-character';
import { BuilderComponent } from '../../actor/components/builder-component';
import { Barracks } from '../buildings/barracks';
import { Mine } from '../buildings/mine';

export const WorkerDefinition: PawnInfoDefinition = {
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
  pawnDefinition: PawnInfoDefinition = WorkerDefinition;

  override initComponents() {
    super.initComponents();

    this.components.addComponent(new BuilderComponent(this, [Barracks], true, 10));
    this.components.addComponent(new GathererComponent(this, [Mine], 100));
  }
}
