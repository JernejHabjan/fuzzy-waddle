import GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../data/actor-component";
import { removeActorComponent } from "../../data/actor-data";
import { OwnerComponent } from "./owner-component";
import { HealthComponent } from "./combat/components/health-component";
import { onObjectReady } from "../../data/game-object-helper";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { DistanceHelper } from "../../library/distance-helper";
import type { ConvertibleDefinition } from "./convertible-definition";
import type { ConvertibleComponentData } from "@fuzzy-waddle/api-interfaces";

export class ConvertibleComponent {
  private accumulatedTime = 0;
  private ready = false;
  private converted = false;

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
    this.gameObject.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  private update(_time: number, delta: number) {
    if (!this.ready || this.converted) return;

    this.accumulatedTime += delta;

    if (this.accumulatedTime >= this.convertibleDefinition.checkInterval) {
      this.accumulatedTime = 0;
      this.checkProximity();
    }
  }

  private checkProximity() {
    const actorIndexSystem = getSceneService(this.gameObject.scene, ActorIndexSystem);
    if (!actorIndexSystem) return;

    // Check all players (1-8)
    for (let playerNumber = 1; playerNumber <= 8; playerNumber++) {
      const ownedActors = actorIndexSystem.getOwnedActors(playerNumber);

      for (const ownedActor of ownedActors) {
        // Skip dead actors
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

  private convertToOwner(ownerNumber: number) {
    if (this.converted) return;
    this.converted = true;

    const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    if (ownerComponent) {
      ownerComponent.setOwnerWithBlink(ownerNumber);
    }

    // Re-register actor with ActorIndexSystem now that it has an owner
    const actorIndexSystem = getSceneService(this.gameObject.scene, ActorIndexSystem);
    if (actorIndexSystem) {
      actorIndexSystem.registerActor(this.gameObject);
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
    this.gameObject.scene?.events.off(Phaser.Scenes.Events.UPDATE, this.update, this);

    // Remove this component from the actor
    if (!this.converted) {
      removeActorComponent(this.gameObject, this);
    }
  }
}
