import { Subject } from "rxjs";
import { getActorComponent } from "../../../data/actor-component";
import { ResourceSourceComponent } from "../resource/resource-source-component";
import { onObjectReady } from "../../../data/game-object-helper";
import type { TendableDefinition } from "./tendable-definition";
import { getSimulationDelta } from "../../../world/services/simulation-time";
import GameObject = Phaser.GameObjects.GameObject;

/**
 * Growth phases used to drive worker animations and crop visuals.
 * 0 = bare soil / seeding (no crops visible)
 * 1 = sprout       (33%)
 * 2 = mid growth   (55%)
 * 3 = almost ripe  (77%)
 * 4 = harvest-ready (100%)
 */
export type TendablePhase = 0 | 1 | 2 | 3 | 4;

/**
 * Generic "assign tenders → thing grows / develops" component.
 * Used by the Field building to manage crop growth cycles.
 */
export class TendableComponent {
  growthPercent = 0;

  readonly growthProgressChanged = new Subject<number>();
  readonly phaseChanged = new Subject<TendablePhase>();
  readonly harvestReady = new Subject<void>();
  readonly onReset = new Subject<void>();

  private _currentPhase: TendablePhase = 0;
  get phase(): TendablePhase { return this._currentPhase; }
  private tenders = new Set<GameObject>();
  private resourceSourceComponent?: ResourceSourceComponent;
  private lastSimulationTimeMs?: number;

  constructor(
    private readonly gameObject: GameObject,
    readonly definition: TendableDefinition
  ) {
    gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
    onObjectReady(gameObject, this.onObjectReady, this);
  }

  private onObjectReady() {
    this.resourceSourceComponent = getActorComponent(this.gameObject, ResourceSourceComponent);
    // Lock resources at start — TendableComponent unlocks them when fully grown
    this.resourceSourceComponent?.lockResources();
    // Subscribe to depletion to restart the growth cycle
    this.resourceSourceComponent?.onDepleted.subscribe(() => {
      if (this.resourceSourceComponent?.resourceSourceDefinition.respawnOnDepletion) {
        this.reset();
      }
    });
  }

  private update(): void {
    if (this.growthPercent >= 100) return;
    if (!this.definition.autoStart && this.tenders.size === 0) return;

    const simulationDelta = getSimulationDelta(this.gameObject.scene, this.lastSimulationTimeMs);
    this.lastSimulationTimeMs = simulationDelta.now;
    if (simulationDelta.delta <= 0) return;

    const boostMultiplier = this.tenders.size > 0 ? this.definition.tenderBoostMultiplier : 1;
    const growthPerMs = 100 / this.definition.growthDurationMs;
    const deltaScaled = simulationDelta.delta;
    this.growthPercent = Math.min(100, this.growthPercent + growthPerMs * deltaScaled * boostMultiplier);

    this.growthProgressChanged.next(this.growthPercent);

    const newPhase = this.calculatePhase();
    if (newPhase !== this._currentPhase) {
      this._currentPhase = newPhase;
      this.phaseChanged.next(newPhase);
    }

    if (this.growthPercent >= 100) {
      this.resourceSourceComponent?.refillResources();
      this.harvestReady.next();
    }
  }

  private calculatePhase(): TendablePhase {
    if (this.growthPercent >= 100) return 4;
    if (this.growthPercent >= 77) return 3;
    if (this.growthPercent >= 55) return 2;
    if (this.growthPercent >= 33) return 1;
    return 0;
  }

  reset(): void {
    this.growthPercent = 0;
    this._currentPhase = 0;
    this.resourceSourceComponent?.lockResources();
    this.growthProgressChanged.next(0);
    this.phaseChanged.next(0);
    this.onReset.next();
  }

  assignTender(go: GameObject): boolean {
    if (!this.canAssignTender()) return false;
    this.tenders.add(go);
    return true;
  }

  unassignTender(go: GameObject): void {
    this.tenders.delete(go);
  }

  canAssignTender(): boolean {
    return this.tenders.size < this.definition.maxTenders;
  }

  isTenderAssigned(go: GameObject): boolean {
    return this.tenders.has(go);
  }

  isReadyForHarvest(): boolean {
    return this.growthPercent >= 100;
  }

  private destroy(): void {
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);
    this.growthProgressChanged.complete();
    this.phaseChanged.complete();
    this.harvestReady.complete();
    this.onReset.complete();
  }
}
