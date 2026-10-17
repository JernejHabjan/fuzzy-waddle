import type Phaser from "phaser";
import type { ResearchType } from "@fuzzy-waddle/probable-waffle-protocol";
import { getActorComponent } from "../../../data/actor-component";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { QueueComponent } from "../queue/queue-component";
import { HealthComponent } from "../combat/components/health-component";

/** Completed tech is global per player; pending paid tech must also exclude a second purchase at another producer. */
export function hasPendingPlayerResearch(
  producer: Phaser.GameObjects.GameObject,
  owner: number,
  type: ResearchType
): boolean {
  const actors = getSceneService(producer.scene, ActorIndexSystem)?.getOwnedActors(owner) ?? [producer];
  return actors.some(
    (actor) =>
      actor.scene === producer.scene &&
      actor.active &&
      !getActorComponent(actor, HealthComponent)?.killed &&
      getActorComponent(actor, QueueComponent)?.allItems.some((item) => item.researchData === type)
  );
}
