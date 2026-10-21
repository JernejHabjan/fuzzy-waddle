import { applyAiRuntimeRecoveryStart } from "./apply-ai-runtime-recovery-start";
import { bindAiRuntimeExistingActors } from "./bind-ai-runtime-existing-actors";
import { applyAiRuntimeConstructionOrders } from "./apply-ai-runtime-construction-orders";
import { captureAiRuntimePlacementClearance } from "./capture-ai-runtime-placement-clearance";
import { applyAiRuntimeSourceStocks } from "./ai-runtime-source-stocks";
import { applyAiRuntimeHealthStarts } from "./ai-runtime-health-starts";
import { applyAiRuntimeTerrainPatches } from "./ai-runtime-terrain-patches";
import { installAiRuntimeRouteOutages } from "./ai-runtime-route-outages";
import { installAiRuntimeReceiptFault } from "./install-ai-runtime-receipt-fault";
import { ActorIndexSystem } from "../../../world/services/ActorIndexSystem";
import { getSceneService } from "../../../world/services/scene-component-helpers";
import { installAiRuntimeProductionRallies } from "./install-ai-runtime-production-rallies";
import { installAiRuntimePresetControls } from "./install-ai-runtime-preset-controls";
import { environment } from "@fuzzy-waddle/environments/environment";
import type Phaser from "phaser";
import { ObjectNames, ResourceType, type PlayerStateResources } from "@fuzzy-waddle/probable-waffle-protocol";
import { emitResource, getPlayer } from "../../../data/scene-data";
import { getActorComponent } from "../../../data/actor-component";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { OrderData } from "../../../ai/OrderData";
import { OrderType } from "../../../ai/order-type";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import { ResourceSourceComponent } from "../../../entity/components/resource/resource-source-component";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import type GameProbableWaffleScene from "../../../world/scenes/GameProbableWaffleScene";
import type { SceneActorCreator } from "../../../world/services/scene-actor-creator";
import { scheduleAiRuntimePresetSetup } from "./schedule-ai-runtime-preset-setup";
import { applyAiRuntimePresetQueues } from "./apply-ai-runtime-preset-queues";
import { installAiRuntimeProductionCapture } from "./install-ai-runtime-production-capture";
import { installAiRuntimePresetEvents } from "./install-ai-runtime-preset-events";
import { assertAiRuntimePresetRoster } from "./assert-ai-runtime-preset-roster";
import { readAiRuntimeBrowserTestConfigV1, recordAiRuntimePresetApplicationV1 } from "./ai-runtime-browser-test-config";

/** Applies a validated preset after normal map indexing and before the first simulation tick or AI observation. */
export function applyAiRuntimePresetWorldV1(scene: GameProbableWaffleScene, creator: SceneActorCreator): void {
  if (environment.production) return;
  installAiRuntimeProductionCapture(scene);
  // A save already owns its actors, balances and queues; replaying fixture setup would corrupt continuation.
  if (scene.baseGameData.gameInstance.gameInstanceMetadata.data.startOptions.loadFromSave) return;
  const preset = readAiRuntimeBrowserTestConfigV1()?.presetWorld;
  if (!preset) return;
  assertAiRuntimePresetRoster(scene, preset);
  const validOwners = new Set(
    scene.players.map((player) => player.playerNumber).filter((owner) => owner !== undefined)
  );
  for (const actor of preset.actors) {
    if (actor.owner === null) {
      if (!getPwActorDefinition(actor.actorName, null)?.components?.resourceSource) {
        throw new Error(`runtime_preset_neutral_not_resource_source:${actor.fixtureActorId}`);
      }
    } else if (!validOwners.has(actor.owner)) {
      throw new Error(`runtime_preset_unknown_owner:${actor.fixtureActorId}`);
    }
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
  for (const start of preset.resourceStarts ?? []) {
    if (!validOwners.has(start.playerNumber)) throw new Error("runtime_preset_resource_start_owner_unknown");
  }
  for (const event of preset.events ?? []) {
    if (!validOwners.has(event.owner)) throw new Error(`runtime_preset_event_owner_unknown:${event.id}`);
  }
  for (const queue of preset.queues ?? []) {
    const producer = [...preset.actors, ...(preset.existingActorBindings ?? [])].find(
      (actor) => actor.fixtureActorId === queue.producerFixtureActorId
    );
    const available =
      producer && getPwActorDefinition(producer.actorName, null)?.components?.production?.availableProduceActors;
    const cost = getPwActorDefinition(queue.actorName, null)?.components?.productionCost;
    if (!available?.includes(queue.actorName) || !cost) {
      throw new Error(`runtime_preset_unsupported_queue:${queue.producerFixtureActorId}`);
    }
  }
  const createdActorNames: string[] = [];
  const createdActors = new Map<string, Phaser.GameObjects.GameObject>();
  const createdActorIds: Record<string, string> = {};
  bindAiRuntimeExistingActors(scene, preset, createdActors, createdActorIds);
  for (const actor of preset.actors) {
    const created = creator.createFinishedActor(
      actor.actorName as ObjectNames,
      actor.position,
      actor.owner ?? undefined
    );
    if (!created) throw new Error(`runtime_preset_actor_creation_failed:${actor.fixtureActorId}`);
    const actorId = getActorComponent(created, IdComponent)?.id;
    if (!actorId) throw new Error(`runtime_preset_actor_id_missing:${actor.fixtureActorId}`);
    createdActorNames.push(created.name);
    createdActors.set(actor.fixtureActorId, created);
    createdActorIds[actor.fixtureActorId] = actorId;
  }
  if (preset.terrainPatches)
    applyAiRuntimeTerrainPatches(scene.tilemap, preset, getSceneService(scene, ActorIndexSystem)?.getAllIdActors());
  for (const grant of preset.resourceGrants) {
    emitResource(scene, "resource.added", grant.amounts as Partial<PlayerStateResources>, grant.playerNumber);
  }
  applyAiRuntimeSourceStocks(preset, createdActors);
  applyAiRuntimeHealthStarts(preset, createdActors);
  const completeSetup = () => {
    assertAiRuntimePresetRoster(scene, preset);
    const placementBaseline = preset.protectedRoutes ? captureAiRuntimePlacementClearance(scene, preset.protectedRoutes) : undefined;
    const { queuedItemCount, initialQueueItems, queueApplications } = applyAiRuntimePresetQueues(
      scene,
      preset,
      createdActors
    );
    const constructionApplications = applyAiRuntimeConstructionOrders(
      scene, preset.fixtureId, preset.constructionOrders ?? [], createdActors, createdActorIds
    );
    for (const start of preset.resourceStarts ?? []) {
      const player = getPlayer(scene, start.playerNumber);
      if (!player) throw new Error("runtime_preset_resource_start_player_missing");
      for (const resourceType of Object.values(ResourceType)) {
        const target = start.amounts[resourceType];
        if (target === undefined) continue;
        const current = player.getResources()[resourceType] ?? 0;
        if (target > current)
          emitResource(scene, "resource.added", { [resourceType]: target - current }, start.playerNumber);
        if (target < current)
          emitResource(scene, "resource.removed", { [resourceType]: current - target }, start.playerNumber);
      }
    }
    if (preset.recoveryStart) applyAiRuntimeRecoveryStart(scene, preset.recoveryStart);
    for (const initialOrder of preset.initialOrders ?? []) {
      const worker = createdActors.get(initialOrder.workerFixtureActorId);
      const source = createdActors.get(initialOrder.sourceFixtureActorId);
      const pawn = worker ? getActorComponent(worker, PawnAiController) : undefined;
      if (
        !worker ||
        !source ||
        !pawn ||
        !getActorComponent(worker, GathererComponent) ||
        !getActorComponent(source, ResourceSourceComponent)
      ) {
        throw new Error(`runtime_preset_invalid_initial_gather:${initialOrder.workerFixtureActorId}`);
      }
      pawn.blackboard.overrideOrderQueueAndActiveOrder(new OrderData(OrderType.Gather, { targetGameObject: source }));
    }
    recordAiRuntimePresetApplicationV1({
      fixtureId: preset.fixtureId,
      sourceRevision: preset.provenance.sourceRevision,
      fixtureDigest: preset.provenance.fixtureDigest,
      createdActorNames: createdActorNames.sort(),
      createdActorIds,
      resourceGrantCount: preset.resourceGrants.length,
      resourceStartCount: preset.resourceStarts?.length ?? 0,
      queuedItemCount,
      initialQueueItems,
      queueApplications,
      initialOrderCount: preset.initialOrders?.length ?? 0,
      constructionApplications,
      placementBaseline,
      eventResults: []
    });
    installAiRuntimePresetEvents(scene, preset, createdActors);
    installAiRuntimePresetControls(scene, preset, createdActors);
    installAiRuntimeRouteOutages(scene, preset, createdActors);
    installAiRuntimeReceiptFault(scene, preset);
    installAiRuntimeProductionRallies(scene, preset, createdActors);
  };
  if (
    (preset.queues?.length ?? 0) +
      (preset.constructionOrders?.length ?? 0) +
      (preset.researchQueues?.length ?? 0) +
      (preset.routeOutages?.length ?? 0) +
      (preset.receiptFault ? 1 : 0) +
      (preset.recoveryStart ? 1 : 0) +
      (preset.controls?.length ?? 0) +
      (preset.productionRallies?.length ?? 0) >
    0
  ) {
    scheduleAiRuntimePresetSetup(scene, completeSetup);
  } else {
    completeSetup();
  }
}
