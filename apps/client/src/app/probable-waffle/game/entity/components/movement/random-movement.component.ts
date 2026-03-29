import { GameObjects } from "phaser";
import { onObjectReady } from "../../../data/game-object-helper";
import { HealthComponent } from "../combat/components/health-component";
import { moveGameObjectToRandomTileInNavigableRadius, MovementSystem } from "../../systems/movement.system";
import { getActorSystem } from "../../../data/actor-system";
import type { RandomMovementDefinition } from "./random-movement-definition";

export class RandomMovementComponent {
  private currentDelay: Phaser.Time.TimerEvent | null = null;

  constructor(
    private readonly gameObject: GameObjects.GameObject,
    private readonly randomMovementDefinition: RandomMovementDefinition
  ) {
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  private init() {
    this.moveAfterDelay();
  }

  async move() {
    if (!this.gameObject.active) return;

    try {
      await moveGameObjectToRandomTileInNavigableRadius(this.gameObject, this.randomMovementDefinition.radius);
      this.moveAfterDelay();
    } catch (e) {
      // just ignore
      // console.error(e);
    }
  }

  moveAfterDelay() {
    if (!this.gameObject.active) return;
    if (this.randomMovementDefinition.shouldPreventMovementStart()) return;
    this.removeDelay();
    const randomDelay = Phaser.Math.Between(
      this.randomMovementDefinition.delay.min,
      this.randomMovementDefinition.delay.max
    );
    this.currentDelay = this.gameObject.scene.time.delayedCall(randomDelay, this.move, [], this);
  }

  removeDelay() {
    this.currentDelay?.remove(false);
    this.currentDelay = null;
  }

  cancelMovement = () => {
    const movementSystem = getActorSystem<MovementSystem>(this.gameObject, MovementSystem);
    if (movementSystem) movementSystem.cancelMovement();
  };

  private destroy() {
    this.removeDelay();
    this.cancelMovement();
  }
}
