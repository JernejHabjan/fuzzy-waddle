import type Phaser from "phaser";
import type { Subscription } from "rxjs";
import { getActorComponent } from "../../../../data/actor-component";
import { onObjectReady } from "../../../../data/game-object-helper";
import { getSceneService } from "../../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../../world/services/simulation-tick.service";
import { HealthComponent } from "./health-component";

/**
 * Restores an actor's configured health once per simulation second.
 *
 * The cadence is aligned to the global simulation tick so save restoration and
 * multiplayer peers apply regeneration at the same deterministic boundary.
 * Killed and fully healed actors are ignored, and actor destruction owns cleanup.
 */
export class HealthRegenerationComponent {
  private static readonly TICKS_PER_REGENERATION = 1000 / SimulationTickService.TICK_INTERVAL_MS;

  private healthComponent?: HealthComponent;
  private tickSubscription?: Subscription;

  constructor(private readonly gameObject: Phaser.GameObjects.GameObject) {
    gameObject.once("destroy", this.destroy, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    onObjectReady(gameObject, this.init, this);
  }

  /** Resolves sibling health and scene-tick authorities after actor data is registered. */
  private init(): void {
    this.healthComponent = getActorComponent(this.gameObject, HealthComponent);
    const simulationTickService = getSceneService(this.gameObject.scene, SimulationTickService);
    if (!this.healthComponent || !simulationTickService) return;

    this.tickSubscription = simulationTickService.tick$.subscribe((tick) => this.onSimulationTick(tick));
  }

  /** Applies one configured regeneration pulse on globally aligned one-second ticks. */
  private onSimulationTick(tick: number): void {
    if (tick % HealthRegenerationComponent.TICKS_PER_REGENERATION !== 0) return;
    if (!this.healthComponent?.isDamaged) return;
    const regenerateHealthRate = this.healthComponent.healthDefinition.regenerateHealthRate ?? 0;
    if (regenerateHealthRate <= 0) return;
    this.healthComponent.heal(regenerateHealthRate);
  }

  /** Releases the deterministic tick subscription when death or destruction ends this behavior. */
  private destroy(): void {
    this.tickSubscription?.unsubscribe();
    this.tickSubscription = undefined;
  }
}
