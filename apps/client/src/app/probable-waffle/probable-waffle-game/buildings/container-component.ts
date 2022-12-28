import { IComponent } from '../services/component.service';
import { Actor } from '../actor';

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
    actor.setVisible(true);
  }
  canLoadActor() {
    return this.containedActors.size < this.capacity;
  }

  loadActor(actor: Actor) {
    if (!this.canLoadActor()) {
      return;
    }
    this.containedActors.add(actor);
    actor.setVisible(false);
  }
}
