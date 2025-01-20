import { Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import { getActorSystem } from "../data/actor-system";
import { MovementSystem } from "../entity/systems/movement.system";
import GameObject = Phaser.GameObjects.GameObject;

export class RallyPoint {
  constructor(
    // Location to send new actors to
    public vec3?: Vector3Simple | null,
    // Actor to send new actors to
    public actor?: GameObject | null
  ) {}

  navigateGameObjectToRallyPoint(newGameObject: Phaser.GameObjects.GameObject) {
    const movementSystem = getActorSystem<MovementSystem>(newGameObject, MovementSystem);
    if (!movementSystem) return;
    if (this.vec3) {
      // noinspection JSIgnoredPromiseFromCall
      movementSystem.moveToLocation(this.vec3);
      return;
    }
    if (this.actor) {
      // noinspection JSIgnoredPromiseFromCall
      movementSystem.moveToActor(this.actor);
    }
  }
}
