import { environment } from "@fuzzy-waddle/environments/environment";
import type Phaser from "phaser";
import { DamageType, ObjectNames, type PlayerStateResources } from "@fuzzy-waddle/probable-waffle-protocol";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { getActorComponent } from "../../../data/actor-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { ProductionComponent } from "../../../entity/components/production/production-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { QueueItemType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/queue/queue-item";
import { PaymentType } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/production/payment-type";
import { TechTreeService } from "../../../data/tech-tree/tech-tree.service";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import type GameProbableWaffleScene from "../../../world/scenes/GameProbableWaffleScene";
import type { SceneActorCreator } from "../../../world/services/scene-actor-creator";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { SimulationTickService } from "../../../world/services/simulation-tick.service";
import {
  readAiRuntimeBrowserTestConfigV1,
  recordAiRuntimePresetApplicationV1,
  recordAiRuntimePresetEventV1
} from "./ai-runtime-browser-test-config";

/** Applies a validated preset after normal map indexing and before the first simulation tick or AI observation. */
export function applyAiRuntimePresetWorldV1(scene: GameProbableWaffleScene, creator: SceneActorCreator): void {
  if (environment.production) return;
  const preset = readAiRuntimeBrowserTestConfigV1()?.presetWorld;
  if (!preset) return;
  const validOwners = new Set(scene.players.map((player) => player.playerNumber).filter((owner) => owner !== undefined));
  for (const actor of preset.actors) {
    if (!validOwners.has(actor.owner)) throw new Error(`runtime_preset_unknown_owner:${actor.fixtureActorId}`);
    if (
      Math.abs(actor.position.x) > scene.tilemap.widthInPixels ||
      actor.position.y < 0 ||
      actor.position.y > scene.tilemap.heightInPixels ||
      Math.abs(actor.position.z) > scene.tilemap.heightInPixels
    ) {
      throw new Error(`runtime_preset_position_out_of_bounds:${actor.fixtureActorId}`);
    }
  }
  for (const grant of preset.resourceGrants) {
    if (!validOwners.has(grant.playerNumber)) throw new Error("runtime_preset_resource_owner_unknown");
  }
  for (const event of preset.events ?? []) {
    if (!validOwners.has(event.owner)) throw new Error(`runtime_preset_event_owner_unknown:${event.id}`);
  }
  for (const queue of preset.queues ?? []) {
    const producer = preset.actors.find((actor) => actor.fixtureActorId === queue.producerFixtureActorId);
    const available = producer && getPwActorDefinition(producer.actorName, null)?.components?.production?.availableProduceActors;
    const cost = getPwActorDefinition(queue.actorName, null)?.components?.productionCost;
    if (!available?.includes(queue.actorName) || !cost) {
      throw new Error(`runtime_preset_unsupported_queue:${queue.producerFixtureActorId}`);
    }
  }
  const createdActorNames: string[] = [];
  const createdActors = new Map<string, Phaser.GameObjects.GameObject>();
  for (const actor of preset.actors) {
    const created = creator.createFinishedActor(actor.actorName as ObjectNames, actor.position, actor.owner);
    if (!created) throw new Error(`runtime_preset_actor_creation_failed:${actor.fixtureActorId}`);
    createdActorNames.push(created.name);
    createdActors.set(actor.fixtureActorId, created);
  }
  for (const grant of preset.resourceGrants) {
    emitResource(scene, "resource.added", grant.amounts as Partial<PlayerStateResources>, grant.playerNumber);
  }
  let queuedItemCount = 0;
  for (const authoredQueue of preset.queues ?? []) {
    const producer = createdActors.get(authoredQueue.producerFixtureActorId);
    const production = producer ? getActorComponent(producer, ProductionComponent) : undefined;
    const costData = getPwActorDefinition(authoredQueue.actorName, null)?.components?.productionCost;
    const owner = preset.actors.find((actor) => actor.fixtureActorId === authoredQueue.producerFixtureActorId)?.owner;
    if (!producer || !production || !costData || owner === undefined) {
      throw new Error(`runtime_preset_queue_component_missing:${authoredQueue.producerFixtureActorId}`);
    }
    const player = getPlayer(scene, owner);
    const techTree = getSceneService(scene, TechTreeService);
    if (!player || !techTree?.isContentAllowed(owner, "actor", authoredQueue.actorName)) {
      throw new Error(`runtime_preset_queue_content_unavailable:${authoredQueue.producerFixtureActorId}`);
    }
    const queue = QueueComponent.createSharedQueue(producer);
    queue.registerProductionComponent(production);
    for (let index = 0; index < authoredQueue.count; index += 1) {
      if (costData.costType === PaymentType.PayImmediately) {
        if (!player.canPayAllResources(costData.resources)) {
          throw new Error(`runtime_preset_queue_unaffordable:${authoredQueue.producerFixtureActorId}`);
        }
        emitResource(scene, "resource.removed", costData.resources, owner);
      }
      queue.addItem({
        type: QueueItemType.Production,
        productionData: { actorName: authoredQueue.actorName, costData },
        totalTime: costData.productionTime,
        remainingTime: costData.productionTime
      });
      queuedItemCount += 1;
    }
  }
  recordAiRuntimePresetApplicationV1({
    fixtureId: preset.fixtureId,
    sourceRevision: preset.provenance.sourceRevision,
    fixtureDigest: preset.provenance.fixtureDigest,
    createdActorNames: createdActorNames.sort(),
    resourceGrantCount: preset.resourceGrants.length,
    queuedItemCount,
    eventResults: []
  });
  const pendingEvents = [...(preset.events ?? [])].sort((left, right) => left.tick - right.tick || left.id.localeCompare(right.id));
  if (pendingEvents.length === 0) return;
  const tickService = getSceneService(scene, SimulationTickService);
  const actorIndex = getSceneService(scene, ActorIndexSystem);
  if (!tickService || !actorIndex) throw new Error("runtime_preset_event_services_unavailable");
  const subscription = tickService.tick$.subscribe(() => {
    while (pendingEvents[0] && pendingEvents[0].tick <= tickService.currentTick) {
      const event = pendingEvents.shift();
      if (!event) break;
      const target = actorIndex
        .getOwnedActors(event.owner)
        .filter((actor) => actor.name === event.objectName)
        .sort((left, right) => {
          const leftId = getActorComponent(left, IdComponent)?.id ?? "";
          const rightId = getActorComponent(right, IdComponent)?.id ?? "";
          return leftId.localeCompare(rightId);
        })[0];
      const health = target ? getActorComponent(target, HealthComponent) : undefined;
      if (health) health.takeDamage(Number.MAX_SAFE_INTEGER, DamageType.Physical);
      recordAiRuntimePresetEventV1({
        id: event.id,
        tick: tickService.currentTick,
        affectedActors: health ? 1 : 0,
        subjectName: event.objectName
      });
    }
    if (pendingEvents.length === 0) subscription.unsubscribe();
  });
  scene.onShutdown.subscribe(() => subscription.unsubscribe());
}
