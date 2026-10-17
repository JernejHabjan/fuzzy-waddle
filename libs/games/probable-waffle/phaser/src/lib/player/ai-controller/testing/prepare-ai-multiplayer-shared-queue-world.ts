import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { researchDefinitions } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/research/research-definitions";
import { ProbableWafflePlayerType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { ResearchComponent } from "../../../entity/components/research/research-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import type { AiMultiplayerSharedQueueWorldV1 } from "./ai-multiplayer-shared-queue-world-v1";

/** At most one second of actual research progress may precede cancellation in this bounded experiment. */
export const SHARED_QUEUE_CANCEL_WINDOW_TICKS = 20;
/** Observe actual tech/actor presence on every simulation tick for one second after completion. */
export const SHARED_QUEUE_STABILITY_TICKS = 20;

/** Selects an existing single-lane producer; no spawned buildings, queued handles, completed tech or AI state are injected. */
export function prepareAiMultiplayerSharedQueueWorld(
  scene: ProbableWaffleScene, tick: number, branch: AiMultiplayerSharedQueueWorldV1["branch"]
): NonNullable<AiMultiplayerSharedQueueWorldV1["setup"]> {
  const playerNumber = 1;
  const player = getPlayer(scene, playerNumber);
  const index = getSceneService(scene, ActorIndexSystem);
  const tech = getSceneService(scene, TechTreeService);
  if (tick !== 1 || scene.scene.key !== "MapAiMultiplayer" || !index || !tech || !player?.factionType ||
    player.playerController.data.playerDefinition?.playerType !== ProbableWafflePlayerType.Human) {
    throw new Error("shared_queue_setup_authority_missing");
  }
  const roster = new Set(tech.getFactionActorIds(player.factionType));
  const actors = index.getOwnedActors(playerNumber).filter((actor) => actor.active && actor.scene === scene)
    .sort((left, right) => (getActorComponent(left, IdComponent)?.id ?? "")
      .localeCompare(getActorComponent(right, IdComponent)?.id ?? ""));
  for (const actor of actors) {
    const actorId = getActorComponent(actor, IdComponent)?.id;
    const production = getActorComponent(actor, ProductionComponent);
    const research = getActorComponent(actor, ResearchComponent);
    const queue = getActorComponent(actor, QueueComponent);
    if (!actorId || !production?.isFinished || !research || !queue || queue.allItems.length ||
      queue.queues.length !== 1 || !Number.isSafeInteger(queue.queueDefinition.capacityPerQueue) ||
      queue.queueDefinition.capacityPerQueue < 2) continue;
    const technologies = research.availableResearch.flatMap((type) => {
      const data = researchDefinitions[type];
      if (!data?.upgradesUnit || !roster.has(data.upgradesUnit.unitType) || tech.isResearched(playerNumber, type) ||
        !tech.isContentAllowed(playerNumber, "research", type) ||
        data.prerequisiteResearch?.some((prerequisite) => !tech.isResearched(playerNumber, prerequisite)) ||
        !validPrice(data.cost) || !Number.isFinite(data.researchTime) || data.researchTime <= 1000 ||
        !Number.isFinite(data.refundFactor) || data.refundFactor <= 0 || data.refundFactor > 1) return [];
      return [{ type, price: { ...data.cost }, durationMs: data.researchTime, refundFactor: data.refundFactor }];
    });
    for (const product of production.productionDefinition.availableProduceActors) {
      const definition = getPwActorDefinition(product, null);
      const cost = definition?.components?.productionCost;
      if (!roster.has(product) || !definition?.components?.gatherer || !cost ||
        cost.costType !== PaymentType.PayImmediately || !validPrice(cost.resources) ||
        !Number.isFinite(cost.productionTime) || cost.productionTime <= 1000 ||
        !Number.isFinite(cost.refundFactor) || cost.refundFactor < 0 || cost.refundFactor > 1) continue;
      for (const first of technologies) {
        const replacements = branch === "shared_contention" ? [first]
          : technologies.filter((candidate) => candidate.type !== first.type);
        for (const replacement of replacements) {
          const refundBudget = { ...player.getResources() };
          for (const resource of Object.values(ResourceType)) {
            refundBudget[resource] = Math.floor((first.price[resource] ?? 0) * first.refundFactor *
              (1 - SHARED_QUEUE_CANCEL_WINDOW_TICKS * 50 / first.durationMs));
          }
          // A distinct purchase must have a genuine pre-credit shortfall in at least one refunded resource.
          if (branch === "cancel_research" && !Object.values(ResourceType).some((resource) =>
            refundBudget[resource] > 0 && (replacement.price[resource] ?? 0) >= refundBudget[resource])) continue;
          const initialResources = { ...player.getResources() };
          for (const resource of Object.values(ResourceType)) {
            const target = branch === "shared_contention"
              ? (cost.resources[resource] ?? 0) + (first.price[resource] ?? 0)
              : (first.price[resource] ?? 0) + Math.max(0, (replacement.price[resource] ?? 0) - refundBudget[resource]);
            const current = player.getResources()[resource];
            if (!Number.isFinite(target) || target < 0 || !Number.isFinite(current) || current < 0) {
              throw new Error("shared_queue_setup_balance_invalid");
            }
            if (current < target) emitResource(scene, "resource.added", { [resource]: target - current }, playerNumber);
            if (current > target) emitResource(scene, "resource.removed", { [resource]: current - target }, playerNumber);
            initialResources[resource] = target;
          }
          const required = branch === "shared_contention" ? first.type : replacement.type;
          if (!research.canStartResearch(required).canStart ||
            (branch === "cancel_research" && !research.canStartResearch(first.type).canStart)) {
            throw new Error("shared_queue_setup_preflight_failed");
          }
          return { tick, playerNumber, producerActorId: actorId, producerObjectName: actor.name,
            train: { product, spawnObjectNames: definition.meta?.randomOfType ?? [product], price: { ...cost.resources },
              durationMs: cost.productionTime, refundFactor: cost.refundFactor },
            research: first, replacement, refundBudget, initialResources };
        }
      }
    }
  }
  throw new Error("shared_queue_setup_legal_capability_missing");
}

function validPrice(price: Readonly<Partial<Record<ResourceType, number>>>): boolean {
  return Object.values(ResourceType).every((resource) => Number.isFinite(price[resource] ?? 0) && (price[resource] ?? 0) >= 0) &&
    Object.values(price).some((amount) => amount !== undefined && amount > 0);
}
