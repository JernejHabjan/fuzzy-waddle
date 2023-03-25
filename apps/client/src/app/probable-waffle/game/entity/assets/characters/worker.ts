import { PawnInfoDefinition } from '../../actor/character';
import { Gatherer, GathererComponent } from '../../actor/components/gatherer-component';
import { PlayerCharacter } from '../../actor/player-character';
import { Builder, BuilderComponent } from '../../actor/components/builder-component';
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

export class Worker extends PlayerCharacter implements Builder, Gatherer {
  pawnDefinition: PawnInfoDefinition = WorkerDefinition;
  builderComponent!: BuilderComponent;
  gathererComponent!: GathererComponent;

  override init() {
    super.init();
    this.builderComponent = this.components.addComponent(new BuilderComponent(this, [Barracks], true, 10));
    this.gathererComponent = this.components.addComponent(new GathererComponent(this, [Mine], 100));
  }
}
