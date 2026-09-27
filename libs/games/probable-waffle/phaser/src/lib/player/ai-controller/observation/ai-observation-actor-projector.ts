import Phaser from "phaser";
import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import { ResourceType, type ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiObservedActorV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import { getActorComponent } from "../../../data/actor-component";
import { getResearchedLevelForActor } from "../../../data/actor-level-utils";
import { getGameObjectCurrentTile, getGameObjectLogicalTransform } from "../../../data/game-object-helper";
import { getPwActorDefinition } from "../../../prefabs/definitions/actor-definitions";
import { OwnerComponent } from "../../../entity/components/owner-component";
import { HealthComponent } from "../../../entity/components/combat/components/health-component";
import { QueueComponent } from "../../../entity/components/queue/queue-component";
import { ResourceSourceComponent } from "../../../entity/components/resource/resource-source-component";
import { ResourceDrainComponent } from "../../../entity/components/resource/resource-drain-component";
import { GathererComponent } from "../../../entity/components/resource/gatherer-component";
import { ContainableComponent } from "../../../entity/components/building/containable-component";
import { ContainerComponent } from "../../../entity/components/building/container-component";
import { ConstructionSiteComponent } from "../../../entity/components/construction/construction-site-component";
import { StatusEffectComponent } from "../../../entity/components/status-effect/status-effect-component";
import { IdComponent } from "@fuzzy-waddle/probable-waffle-gameplay/entity/components/id-component";
import { PawnAiController } from "../../../prefabs/ai-agents/pawn-ai-controller";
import type { AiAccessGraphAdapter } from "./ai-access-graph.adapter";
import { projectActorCapabilities } from "./ai-observation-catalog";
import { projectAiCombatProfile } from "./ai-observation-combat-profile";
import { knownValue, unknownValue, uniqueDomain } from "./ai-observation-values";

type GameObject = Phaser.GameObjects.GameObject;

export function projectAiObservedActor(
  actor: GameObject,
  actorId: ActorId,
  relation: AiObservedActorV1["relation"],
  visibility: AiObservedActorV1["visibility"],
  tick: number,
  owned: boolean,
  accessGraphAdapter: AiAccessGraphAdapter
): AiObservedActorV1 {
  const level = getResearchedLevelForActor(actor) ?? 1;
  const definition = getPwActorDefinition(actor.name, level);
  const worldPosition = getGameObjectLogicalTransform(actor);
  const tilePosition = getGameObjectCurrentTile(actor);
  const queue = getActorComponent(actor, QueueComponent);
  const source = getActorComponent(actor, ResourceSourceComponent);
  const drain = getActorComponent(actor, ResourceDrainComponent);
  const gatherer = getActorComponent(actor, GathererComponent);
  const health = getActorComponent(actor, HealthComponent);
  const statusEffects = getActorComponent(actor, StatusEffectComponent);
  const constructionSite = getActorComponent(actor, ConstructionSiteComponent);
  const capabilities = projectActorCapabilities(actor.name as ObjectNames, definition, level);
  const logicalPosition = tilePosition
    ? knownValue({ x: tilePosition.x, y: tilePosition.y, z: worldPosition?.z ?? 0 }, tick)
    : unknownValue("not_observed");
  const accessNode = accessGraphAdapter.resolveNodeId(
    getGameObjectCurrentTile(actor),
    capabilities.flatMap((capability) => capability.domains).filter(uniqueDomain)
  );
  const accessNodeId = accessNode ? knownValue(accessNode, tick) : unknownValue("query_pending");
  const containable = getActorComponent(actor, ContainableComponent);
  const container = getActorComponent(actor, ContainerComponent);
  const pawnAi = getActorComponent(actor, PawnAiController);
  const currentOrder = pawnAi?.blackboard.getCurrentOrder();
  const orderTarget = currentOrder?.data.targetGameObject;
  const orderTargetId = orderTarget
    ? (getActorComponent(orderTarget, IdComponent)?.id ?? null)
    : (currentOrder?.data.targetGameObjectId ?? null);
  const containerOwner = containable?.getContainerOwner();
  const containerOwnerId =
    owned && containerOwner ? (getActorComponent(containerOwner, IdComponent)?.id ?? null) : null;
  const containerState =
    container && owned
      ? knownValue(
          {
            capacity: container.containerDefinition.capacity,
            passengerIds: container
              .getContainedGameObjects()
              .map((passenger) => getActorComponent(passenger, IdComponent)?.id)
              .filter((id): id is ActorId => id !== undefined)
              .sort(),
            pendingPassengerIds: container
              .getPendingBoarders()
              .map((passenger) => getActorComponent(passenger, IdComponent)?.id)
              .filter((id): id is ActorId => id !== undefined)
              .sort(),
            mobileDomains: capabilities.flatMap((capability) => capability.domains).filter(uniqueDomain)
          },
          tick
        )
      : container
        ? unknownValue(owned ? "not_supported" : "not_observed")
        : undefined;
  return {
    actorId,
    objectName: actor.name as ObjectNames,
    owner: getActorComponent(actor, OwnerComponent)?.getOwner() ?? null,
    relation,
    visibility,
    evidenceId: `evidence:contact:${actorId}` as const,
    observedTick: tick,
    logicalPosition,
    accessNodeId,
    effectiveLevel: knownValue(level, tick),
    capabilities,
    queue:
      owned && queue
        ? knownValue(
            {
              capacity: queue.queueDefinition.queueCount * queue.queueDefinition.capacityPerQueue,
              occupied: queue.allItems.length,
              itemIds: queue.allItems.map((item, index) => `${actorId}:${index}:${item.type}`).sort(),
              items: queue.allItems
                .map((item, index) => ({
                  itemId: `${actorId}:${index}:${item.type}`,
                  kind: item.productionData ? ("production" as const) : ("research" as const),
                  objectName: item.productionData?.actorName ?? null,
                  researchType: item.researchData ?? null
                }))
                .sort((left, right) => left.itemId.localeCompare(right.itemId))
            },
            tick
          )
        : unknownValue(owned ? "not_supported" : "not_observed"),
    cost: definition?.components?.productionCost
      ? knownValue({ ...definition.components.productionCost.resources }, tick)
      : unknownValue("not_supported"),
    housingCost:
      definition?.components?.housingCost?.housingNeeded === undefined
        ? unknownValue("not_supported")
        : knownValue(definition.components.housingCost.housingNeeded, tick),
    housingCapacity:
      definition?.components?.housing?.housingCapacity === undefined
        ? unknownValue("not_supported")
        : knownValue(definition.components.housing.housingCapacity, tick),
    healthPermille:
      health && (owned || visibility === "visible")
        ? knownValue(
            Math.max(
              0,
              Math.min(
                1000,
                Math.floor((health.healthComponentData.health / Math.max(1, health.healthDefinition.maxHealth)) * 1000)
              )
            ),
            tick
          )
        : unknownValue(owned ? "not_supported" : "not_observed"),
    resourceState: source
      ? knownValue(
          {
            resourceType: source.getResourceType(),
            available: knownValue(source.getCurrentResources(), tick),
            carried: unknownValue("not_supported"),
            growthReadyTick: unknownValue("not_supported"),
            serviceCapacity: knownValue(source.getMaxGatherers() ?? Number.MAX_SAFE_INTEGER, tick)
          },
          tick
        )
      : drain && owned
        ? knownValue(
            {
              resourceType: drain.getResourceTypes()[0] ?? ResourceType.Food,
              available: unknownValue("not_supported"),
              carried: unknownValue("not_supported"),
              growthReadyTick: unknownValue("not_supported"),
              serviceCapacity: knownValue(drain.canDropOffResources() ? 1 : 0, tick)
            },
            tick
          )
        : gatherer && owned && gatherer.carriedResourceType !== null
          ? knownValue(
              {
                resourceType: gatherer.carriedResourceType,
                available: unknownValue("not_supported"),
                carried: knownValue(gatherer.carriedResourceAmount, tick),
                growthReadyTick: unknownValue("not_supported"),
                serviceCapacity: unknownValue("not_supported")
              },
              tick
            )
          : unknownValue(owned ? "not_supported" : "not_observed"),
    ...(owned && constructionSite
      ? { constructionProgress: knownValue(constructionSite.progressPercentage, tick) }
      : {}),
    activeEffectIds:
      statusEffects
        ?.getActiveEffects()
        .map((effect) => `status:${effect.type}`)
        .sort() ?? [],
    activeOrder:
      owned && pawnAi
        ? knownValue(
            currentOrder
              ? {
                  orderType: currentOrder.orderType,
                  targetActorId: orderTargetId
                }
              : null,
            tick
          )
        : unknownValue(owned ? "not_supported" : "not_observed"),
    combatProfile: projectAiCombatProfile(actor, definition, owned, visibility, tick),
    ...(owned ? { mainBuilding: knownValue(definition?.meta?.isMainBuilding === true, tick) } : {}),
    containedInActorId: containerOwnerId,
    ...(containerState ? { containerState } : {})
  };
}
