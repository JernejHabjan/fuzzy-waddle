import Phaser from "phaser";
type GameObject = Phaser.GameObjects.GameObject;
import { getActorComponent } from "../../data/actor-component";
import { OwnerComponent } from "./owner-component";
import { HealthComponent } from "./combat/components/health-component";
import { onObjectReady } from "../../data/game-object-helper";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { DistanceHelper } from "../../library/distance-helper";
import type { ConvertibleDefinition } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/convertible-definition";
import type { ConvertibleComponentData } from "@fuzzy-waddle/probable-waffle-protocol";
import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import { SimulationTickService } from "../../world/services/simulation-tick.service";
import type { Subscription } from "rxjs";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";

export interface ConversionCandidate {
  playerNumber: PlayerNumber;
  actor: GameObject;
  distance: number;
  actorId: string;
  active: boolean;
  killed: boolean;
}

export function chooseConversionCandidate(candidates: readonly ConversionCandidate[]): ConversionCandidate | undefined {
  return [...candidates]
    .filter((candidate) => candidate.active && !candidate.killed && candidate.actorId.length > 0)
    .sort(
      (left, right) =>
        left.distance - right.distance || left.playerNumber - right.playerNumber || left.actorId.localeCompare(right.actorId)
    )[0];
}

export class ConvertibleComponent {
  static readonly ConvertedEvent = "convertible-converted";
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

    const candidates: ConversionCandidate[] = [];
    for (const [playerNumber, ownedActors] of ownedActorsByPlayers) {
      for (const ownedActor of ownedActors) {
        // Skip dead actors
        const health = getActorComponent(ownedActor, HealthComponent);

        const distance = DistanceHelper.getTileDistanceBetweenGameObjects(this.gameObject, ownedActor);
        if (distance !== null && distance <= this.convertibleDefinition.detectionRange) {
          candidates.push({
            playerNumber,
            actor: ownedActor,
            distance,
            actorId: getActorComponent(ownedActor, IdComponent)?.id ?? "",
            active: ownedActor.active,
            killed: health?.killed ?? false
          });
        }
      }
    }
    const winner = chooseConversionCandidate(candidates);
    if (winner) this.convertToOwner(winner.playerNumber, winner.actor);
  }

  private convertToOwner(ownerNumber: PlayerNumber, triggeringActor: GameObject) {
    if (this.converted) return;
    this.converted = true;

    const ownerComponent = getActorComponent(this.gameObject, OwnerComponent);
    if (ownerComponent) {
      ownerComponent.setOwnerWithBlink(ownerNumber);
    }
    this.gameObject.emit(ConvertibleComponent.ConvertedEvent, {
      ownerNumber,
      triggeringActorId: getActorComponent(triggeringActor, IdComponent)?.id
    });

    this.destroy();
  }

  setData(data: ConvertibleComponentData) {
    this.accumulatedTime =
      typeof data.accumulatedTime === "number" && Number.isFinite(data.accumulatedTime)
        ? Math.max(0, data.accumulatedTime)
        : 0;
    this.converted = data.converted ?? false;
    if (this.converted) this.destroy();
  }

  getData(): ConvertibleComponentData {
    return {
      detectionRange: this.convertibleDefinition.detectionRange,
      checkInterval: this.convertibleDefinition.checkInterval,
      accumulatedTime: this.accumulatedTime,
      converted: this.converted
    } satisfies ConvertibleComponentData;
  }

  private destroy() {
    this.ready = false;
    this.simulationTickSub?.unsubscribe();
  }
}
