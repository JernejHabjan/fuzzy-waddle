import Phaser from "phaser";
import type { SummonExpiryData } from "@fuzzy-waddle/probable-waffle-protocol";
import type { Subscription } from "rxjs";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { getActorComponent } from "../../data/actor-component";
import { onSceneInitialized } from "../../data/game-object-helper";
import { HealthComponent } from "../components/combat/components/health-component";
import { ActorIndexSystem } from "../../world/services/ActorIndexSystem";
import { getSceneService } from "../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../world/services/simulation-tick.service";

/**
 * Owns spell-created actor lifetimes on the fixed simulation clock. The list is
 * mirrored into game state continuously so save/reconnect cannot restart or lose
 * an expiry timer.
 */
export class SummonExpiryService {
  private readonly expiries = new Map<string, SummonExpiryData>();
  private tickSubscription?: Subscription;

  constructor(private readonly scene: ProbableWaffleScene) {
    for (const expiry of scene.baseGameData.gameInstance.gameState?.data.summonExpiries ?? []) {
      this.expiries.set(expiry.actorId, structuredClone(expiry));
    }
    onSceneInitialized(scene, this.init, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, this.destroy, this);
  }

  private init(): void {
    this.tickSubscription = getSceneService(this.scene, SimulationTickService)?.tick$.subscribe((tick) =>
      this.applyDueExpiries(tick)
    );
    this.persist();
  }

  register(expiry: SummonExpiryData): void {
    const current = this.expiries.get(expiry.actorId);
    if (!current || expiry.dueTick < current.dueTick) {
      this.expiries.set(expiry.actorId, structuredClone(expiry));
      this.persist();
    }
  }

  getData(): SummonExpiryData[] {
    return [...this.expiries.values()]
      .sort((left, right) => left.dueTick - right.dueTick || left.actorId.localeCompare(right.actorId))
      .map((expiry) => structuredClone(expiry));
  }

  setData(expiries: readonly SummonExpiryData[]): void {
    this.expiries.clear();
    for (const expiry of expiries) this.expiries.set(expiry.actorId, structuredClone(expiry));
    this.persist();
  }

  private applyDueExpiries(tick: number): void {
    const actorIndex = getSceneService(this.scene, ActorIndexSystem);
    for (const expiry of this.getData()) {
      if (expiry.dueTick > tick) break;
      const actor = actorIndex?.getActorById(expiry.actorId);
      if (actor?.active) {
        const health = getActorComponent(actor, HealthComponent);
        if (health) health.killActor();
        else actor.destroy();
      }
      this.expiries.delete(expiry.actorId);
    }
    this.persist();
  }

  private persist(): void {
    const gameState = this.scene.baseGameData.gameInstance.gameState;
    if (gameState) gameState.data.summonExpiries = this.getData();
  }

  private destroy(): void {
    this.tickSubscription?.unsubscribe();
  }
}
