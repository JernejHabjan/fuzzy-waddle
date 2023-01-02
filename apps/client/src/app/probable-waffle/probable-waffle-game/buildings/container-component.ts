import { IComponent } from '../services/component.service';
import { Actor } from '../actor';
import { SpriteRepresentationComponent } from '../characters/sprite-representable-component';

export interface CharacterContainer {
  containerComponent: ContainerComponent;
}

// apply to resource source that needs actors to enter to gather
export class ContainerComponent implements IComponent {
  containedActors = new Set<Actor>();
  constructor(public readonly capacity: number) {}
  init(): void {
    // pass
  }

  getContainedActors(): Actor[] {
    return Array.from(this.containedActors);
  }

  onKilled() {
    this.unloadAll();
  }

  unloadAll() {
    this.containedActors.forEach((actor) => {
      this.unloadActor(actor);
    });
  }

  unloadActor(actor: Actor) {
    this.containedActors.delete(actor);
    this.setActorVisible(actor, true);
  }
  canLoadActor() {
    return this.containedActors.size < this.capacity;
  }

  loadActor(actor: Actor) {
    if (!this.canLoadActor()) {
      return;
    }
    this.containedActors.add(actor);
    this.setActorVisible(actor, false);
  }

  setActorVisible(actor: Actor, visible: boolean) {
    const representableComponent = actor.components.findComponentOrNull(SpriteRepresentationComponent);
    if (representableComponent) {
      representableComponent.sprite.setVisible(visible);
    }
  }
}
