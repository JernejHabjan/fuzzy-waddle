import GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../data/actor-component";
import { OwnerComponent } from "./owner-component";
import { HealthComponent } from "./combat/components/health-component";
import { onObjectReady } from "../../data/game-object-helper";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { DistanceHelper } from "../../library/distance-helper";
import type { ConvertibleDefinition } from "./convertible-definition";
import type { ConvertibleComponentData, PlayerNumber } from "@fuzzy-waddle/api-interfaces";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import type { Subscription } from "rxjs";

export class ConvertibleComponent {
  private accumulatedTime = 0;
  private ready = false;
  private converted = false;
  private simulationTickSub?: Subscription;

  constructor(
    private readonly gameObject: GameObject,
    public readonly convertibleDefinition: ConvertibleDefinition
  ) {
    onObjectReady(gameObject, this.init, this);
    gameObject.once(HealthComponent.KilledEvent, this.destroy, this);
    gameObject.once(Phaser.GameObjects.Events.DESTROY, this.destroy, this);
  }

  private init() {
    // Check if already owned - if so, don't enable conversion
    const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    if (ownerComponent?.getOwner() !== undefined) {
      this.destroy();
      return;
    }

    this.ready = true;
    this.simulationTickSub = getSceneService(this.gameObject.scene, SimulationTickService)?.tick$.subscribe(() =>
      this.update()
    );
  }

  private update() {
    if (!this.ready || this.converted) return;
    this.accumulatedTime += SimulationTickService.TICK_INTERVAL_MS;

    if (this.accumulatedTime >= this.convertibleDefinition.checkInterval) {
      this.accumulatedTime = 0;
      this.checkProximity();
    }
  }

  private checkProximity() {
    const actorIndexSystem = getSceneService(this.gameObject.scene, ActorIndexSystem);
    if (!actorIndexSystem) return;

    const ownedActorsByPlayers = actorIndexSystem.getOwnedActorsByPlayers();

    for (const [playerNumber, ownedActors] of ownedActorsByPlayers) {
      for (const ownedActor of ownedActors) {
        // Skip dead actors
        if (!ownedActor.active) return;
        const health = getActorComponent(ownedActor, HealthComponent);
        if (health?.killed) continue;

        const distance = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, ownedActor);
        if (distance !== null && distance <= this.convertibleDefinition.detectionRange) {
          this.convertToOwner(playerNumber);
          return;
        }
      }
    }
  }

  private convertToOwner(ownerNumber: PlayerNumber) {
    if (this.converted) return;
    this.converted = true;

    const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    if (ownerComponent) {
      ownerComponent.setOwnerWithBlink(ownerNumber);
    }

    this.destroy();
  }

  setData(data: ConvertibleComponentData) {
    // Data is set via definition, no runtime state to restore
  }

  getData(): ConvertibleComponentData {
    return {
      detectionRange: this.convertibleDefinition.detectionRange,
      checkInterval: this.convertibleDefinition.checkInterval
    } satisfies ConvertibleComponentData;
  }

  private destroy() {
    this.ready = false;
    this.simulationTickSub?.unsubscribe();
  }
}
