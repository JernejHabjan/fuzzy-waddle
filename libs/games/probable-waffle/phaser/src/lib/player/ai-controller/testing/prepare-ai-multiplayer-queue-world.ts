import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { ProbableWafflePlayerType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { ProbableWaffleScene } from "../../../core/probable-waffle.scene";
import { getActorComponent } from "../../../data/actor-component";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import type { AiMultiplayerQueueWorldV1 } from "./ai-multiplayer-queue-world-v1";

/** Mirrors only starting cash on both peers; real purchase/refund/payment always travels through the socket bus. */
export function prepareAiMultiplayerQueueWorld(scene: ProbableWaffleScene, tick: number): AiMultiplayerQueueWorldV1["setup"] {
  const playerNumber = 1;
  const player = getPlayer(scene, playerNumber);
  const index = getSceneService(scene, ActorIndexSystem);
  if (tick !== 1 || scene.scene.key !== "MapAiMultiplayer" || !index ||
    player?.playerController.data.playerDefinition?.playerType !== ProbableWafflePlayerType.Human) {
    throw new Error("multiplayer_queue_setup_authority_missing");
  }
  const producers = index.getOwnedActors(playerNumber).filter((actor) => actor.scene === scene && actor.active)
    .sort((left, right) => (getActorComponent(left, IdComponent)?.id ?? "")
      .localeCompare(getActorComponent(right, IdComponent)?.id ?? ""));
  for (const actor of producers) {
    const actorId = getActorComponent(actor, IdComponent)?.id;
    const production = getActorComponent(actor, ProductionComponent);
    const queue = getActorComponent(actor, QueueComponent);
    if (!actorId || !production?.isFinished || !queue || queue.allItems.length || !queue.findQueueForNewItem()) continue;
    for (const product of production.productionDefinition.availableProduceActors) {
      const definition = getPwActorDefinition(product, null);
      const cost = definition?.components?.productionCost;
      // A land worker has an actual useful spawn on this land map; boats cannot prove resumed completion here.
      if (!definition?.components?.gatherer || !cost || cost.costType !== PaymentType.PayImmediately ||
        !Number.isFinite(cost.productionTime) || cost.productionTime < 1000 || !Number.isFinite(cost.refundFactor) ||
        cost.refundFactor <= 0 || cost.refundFactor > 1 ||
        !Object.values(cost.resources).some((amount) => Math.floor((amount ?? 0) * cost.refundFactor) > 0)) continue;
      const initialResources = { ...player.getResources() };
      for (const resource of Object.values(ResourceType)) {
        const price = cost.resources[resource] ?? 0;
        if (!Number.isFinite(price) || price < 0) throw new Error("multiplayer_queue_setup_price_invalid");
        const target = 2 * price - Math.floor(price * cost.refundFactor);
        const current = player.getResources()[resource];
        if (!Number.isFinite(current) || current < 0) throw new Error("multiplayer_queue_setup_balance_invalid");
        if (target > current) emitResource(scene, "resource.added", { [resource]: target - current }, playerNumber);
        if (target < current) emitResource(scene, "resource.removed", { [resource]: current - target }, playerNumber);
        initialResources[resource] = target;
      }
      return { tick, playerNumber, producerActorId: actorId, product, price: { ...cost.resources },
        refundFactor: cost.refundFactor, durationMs: cost.productionTime, initialResources };
    }
  }
  throw new Error("multiplayer_queue_setup_legal_worker_producer_missing");
}
