import { GameObjects } from "phaser";
import { onObjectReady } from "../../../data/game-object-helper";
import { HealthComponent } from "../combat/components/health-component";
import { moveGameObjectToRandomTileInNavigableRadius, MovementSystem } from "../../systems/movement.system";
import { getActorSystem } from "../../../data/actor-system";
import type { RandomMovementDefinition } from "./random-movement-definition";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import { RandomService } from "../../../world/services/random.service";
import { Subscription } from "rxjs";
import { hasMultiplayerCommandRelay } from "../../../data/scene-data";

export class RandomMovementComponent {
  private currentDelay: Phaser.Time.TimerEvent | null = null;
  private tickSubscription?: Subscription;
  private nextMoveAtMs?: number;
  private randomService?: RandomService;
  /** Random wandering is disabled in multiplayer so lockstep simulation stays deterministic. */
  private readonly disabledInMultiplayer: boolean;

  constructor(
    private readonly gameObject: GameObjects.GameObject,
    private readonly randomMovementDefinition: RandomMovementDefinition
  ) {
    this.disabledInMultiplayer = hasMultiplayerCommandRelay(gameObject.scene);
    onObjectReady(gameObject, this.init, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
  }

  private init() {
    if (this.disabledInMultiplayer) {
      return;
    }
    this.randomService = getSceneService(this.gameObject.scene, RandomService);
    const simulationTickService = getSceneService(this.gameObject.scene, SimulationTickService);
    if (simulationTickService) {
      this.tickSubscription = simulationTickService.tick$.subscribe((tick) => {
        this.onSimulationTick(tick);
      });
    }
    this.moveAfterDelay();
  }

  async move() {
    if (this.disabledInMultiplayer) return;
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
    if (this.disabledInMultiplayer) return;
    if (!this.gameObject.active) return;
    if (this.randomMovementDefinition.shouldPreventMovementStart()) return;
    this.removeDelay();
    const randomDelay =
      this.randomService?.between(this.randomMovementDefinition.delay.min, this.randomMovementDefinition.delay.max) ??
      Phaser.Math.Between(this.randomMovementDefinition.delay.min, this.randomMovementDefinition.delay.max);
    const simulationTickService = getSceneService(this.gameObject.scene, SimulationTickService);
    if (simulationTickService) {
      this.nextMoveAtMs = simulationTickService.currentTick * SimulationTickService.TICK_INTERVAL_MS + randomDelay;
      return;
    }

    // Intentional wall-clock fallback for contexts without SimulationTickService.
    this.currentDelay = this.gameObject.scene.time.delayedCall(randomDelay, this.move, [], this);
  }

  removeDelay() {
    this.nextMoveAtMs = undefined;
    this.currentDelay?.remove(false);
    this.currentDelay = null;
  }

  cancelMovement = () => {
    const movementSystem = getActorSystem<MovementSystem>(this.gameObject, MovementSystem);
    if (movementSystem) movementSystem.cancelMovement();
  };

  private destroy() {
    this.tickSubscription?.unsubscribe();
    this.removeDelay();
    this.cancelMovement();
  }

  private onSimulationTick(tick: number) {
    if (!this.gameObject.active || this.nextMoveAtMs === undefined) return;
    const now = tick * SimulationTickService.TICK_INTERVAL_MS;
    if (now < this.nextMoveAtMs) return;
    this.nextMoveAtMs = undefined;
    void this.move();
  }
}
