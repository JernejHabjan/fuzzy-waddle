import type Phaser from "phaser";
import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../combat/components/health-component";

/** Live work membership plus unresolved save intent. Only live members contribute work or repair. */
export class ConstructionWorkerMembership {
  actors: Phaser.GameObjects.GameObject[] = [];
  private pendingIds?: ActorId[];

  constructor(private readonly scene: Phaser.Scene) {}

  get savedIds(): ActorId[] {
    if (this.pendingIds) return [...this.pendingIds];
    return this.actors.map((actor) => {
      const id = getActorComponent(actor, IdComponent)?.id;
      if (!id) throw new Error("Construction worker identity missing");
      return id;
    });
  }

  restore(ids: readonly ActorId[] | undefined): void {
    if (ids === undefined) return;
    this.pendingIds = [...new Set(ids)];
    this.actors = [];
    this.resolve();
  }

  add(actor: Phaser.GameObjects.GameObject): void {
    if (this.actors.includes(actor)) return;
    // A new native assignment supersedes unresolved saved membership; it cannot reappear and steal the new slot.
    this.pendingIds = undefined;
    this.actors.push(actor);
  }

  remove(actor: Phaser.GameObjects.GameObject): void {
    const id = this.pendingIds ? getActorComponent(actor, IdComponent)?.id : undefined;
    if (id) this.pendingIds = this.pendingIds?.filter((candidate) => candidate !== id);
    const index = this.actors.indexOf(actor);
    if (index >= 0) this.actors.splice(index, 1);
  }

  resolve(): void {
    if (this.pendingIds === undefined) return;
    const index = getSceneService(this.scene, ActorIndexSystem);
    if (!index) return;
    const pending: ActorId[] = [],
      actors: Phaser.GameObjects.GameObject[] = [];
    let unresolved = false;
    for (const id of this.pendingIds) {
      const actor = index.getActorById(id);
      if (!actor) {
        pending.push(id);
        unresolved = true;
        continue;
      }
      if (actor.active === false || getActorComponent(actor, HealthComponent)?.killed) continue;
      pending.push(id);
      actors.push(actor);
    }
    this.actors = actors;
    this.pendingIds = unresolved ? pending : undefined;
  }
}
