import { ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";
import {
  canAffordAiEconomyCost,
  decideAiEconomyPolicy,
  hasCredibleAiEconomyThreat
} from "./ai-economy-policy";
import { projectAiResourceForecasts, selectAiForecastResource } from "./ai-resource-forecast";
import { createAiResourceCostClaims } from "./ai-resource-cost-claims";
import { calculateAiHousingDemand } from "./ai-housing-demand";
import { proposeAiWorkerRecovery } from "./ai-worker-recovery";
import { selectAiSurplusLaborTransfer } from "./ai-surplus-labor-transfer";
import { plannedAiForceSize, plannedAiProducerCount } from "./ai-force-capacity";
import { openingBudget } from "./ai-opening-catalog";
import { proposeAiOpening } from "./ai-opening-proposal";
import { isMilitaryCatalogEntry, producerMilitaryProducts, productionRoleDeficit, roleFor } from "./ai-military-catalog";
import {
  claimedActorIds,
  isAvailableBuilder,
  isFinishedActor,
  owned,
  queuedProduction,
  queueFree
} from "./ai-macro-observation";
import { selectConstructionPosition } from "./ai-construction-site-selector";
import { nextIds, unresolvedReservedEffectIds } from "./ai-macro-effect-identity";

const WORKER_RECOVERY_FLOOR = 6;

/**
 * Macro proposal owner. It derives opening, supply and composition demand
 * from one committed observation and the paired runtime capability catalog.
 * It never assumes that an object is buildable merely because its name appears
 * in a faction recipe: the catalog must expose the matching producer/builder.
 */
export class AiMacroManager implements AiProposalManagerV1 {
  readonly managerId = "stage-7-macro";

  constructor(private readonly getCatalog: () => AiCapabilityCatalogV1 | undefined) {}

  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1 {
    const catalog = this.getCatalog();
    if (!catalog || catalog.generation !== observation.generation) {
      return {
        managerId: this.managerId,
        lane: "essential_economy",
        evaluated: false,
        intents: [],
        reasons: ["catalog_not_ready"]
      };
    }

    const opening = proposeAiOpening(observation, state, catalog);
    const {
      checkpoints,
      demands,
      intents,
      steps,
      selectedConstructionTileKeys,
      reservedActorIds,
      checkpointStatus,
      activeCheckpointId
    } = opening;
    let ordinal = opening.ordinal;

    const self = owned(observation);
    const budget = openingBudget(state.opening.archetypeId);
    const openingBuilderIds = new Set(
      intents.flatMap((intent) => {
        if (intent.kind === "construct") return [...intent.builderIds];
        if (intent.kind === "resume_construct") return [...intent.actorIds];
        return [];
      })
    );
    const idleWorkers = self
      .filter((actor) =>
        catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.gathers.length > 0)
      )
      .filter((actor) => !openingBuilderIds.has(actor.actorId))
      .filter((actor) => !reservedActorIds.has(actor.actorId))
      .filter((actor) => actor.activeOrder?.status === "known" && actor.activeOrder.value === null)
      .sort((left, right) => left.actorId.localeCompare(right.actorId));
    const gatherSources = observation.actors
      .filter(
        (actor) =>
          actor.objectName !== ObjectNames.Field &&
          actor.relation !== "enemy" &&
          actor.visibility !== "last_seen" &&
          actor.resourceState.status === "known" &&
          actor.resourceState.value.available.status === "known" &&
          actor.resourceState.value.available.value > 0
      )
      .sort((left, right) => left.actorId.localeCompare(right.actorId));
    const sourceResourceTypes = new Set(
      gatherSources.map((actor) =>
        actor.resourceState.status === "known" ? actor.resourceState.value.resourceType : ResourceType.Wood
      )
    );
    const constrainedResource =
      selectAiForecastResource(observation, state.economyProduction.forecasts, sourceResourceTypes) ??
      observation.resources
        .filter((resource) => sourceResourceTypes.has(resource.resourceType))
        .sort(
          (left, right) => left.stockpile - right.stockpile || left.resourceType.localeCompare(right.resourceType)
        )[0]?.resourceType;
    const activeGatherersBySource = new Map<string, number>();
    for (const actor of self) {
      const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
      if (order?.orderType !== OrderType.Gather || !order.targetActorId) continue;
      activeGatherersBySource.set(order.targetActorId, (activeGatherersBySource.get(order.targetActorId) ?? 0) + 1);
    }
    const gatherCandidate = gatherSources
      .filter(
        (actor) =>
          actor.resourceState.status === "known" && actor.resourceState.value.resourceType === constrainedResource
      )
      .map((actor) => {
        const capacity =
          actor.resourceState.status === "known" && actor.resourceState.value.serviceCapacity.status === "known"
            ? actor.resourceState.value.serviceCapacity.value
            : 1;
        return { actor, availableCapacity: capacity - (activeGatherersBySource.get(actor.actorId) ?? 0) };
      })
      .find((candidate) => candidate.availableCapacity > 0);
    const gatherSource = gatherCandidate?.actor;
    if (gatherSource?.resourceState.status === "known" && constrainedResource) {
      const compatibleIdleWorkers = idleWorkers.filter((actor) => catalog.entries.some(
        (entry) => entry.sourceObjectName === actor.objectName && entry.gathers.includes(constrainedResource)
      ));
      const transferable = compatibleIdleWorkers.length === 0
        ? selectAiSurplusLaborTransfer(
            observation,
            catalog,
            state.economyProduction.forecasts,
            self.filter((actor) => !openingBuilderIds.has(actor.actorId) && !reservedActorIds.has(actor.actorId)),
            gatherSources,
            constrainedResource
          )
        : undefined;
      const selectedWorkers = compatibleIdleWorkers.length > 0
        ? compatibleIdleWorkers.slice(0, Math.min(4, gatherCandidate?.availableCapacity ?? 0))
        : transferable ? [transferable] : [];
      if (selectedWorkers.length > 0) {
        const ids = nextIds(state, "gather", ordinal++);
        intents.push({
          ...ids,
          kind: "assign_gatherers",
          planId: state.opening.plan.planId,
          demandId: null,
          lane: "essential_economy",
          proposedTick: observation.tick,
          urgencyClass: 0,
          utility: 980,
          preconditions: [
            ...selectedWorkers.map((worker) => ({ kind: "actor_exists" as const, actorId: worker.actorId })),
            { kind: "actor_exists", actorId: gatherSource.actorId }
          ],
          claims: [
            ...selectedWorkers.map((worker, index) => ({
              claimId: `${ids.claimId}:worker:${index}` as AiIntentV1["claims"][number]["claimId"],
              kind: "actor" as const,
              actorId: worker.actorId
            })),
            {
              claimId: `${ids.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
              kind: "effect",
              effectId: ids.effectId
            }
          ],
          reasonCode: `economy:${transferable ? "surplus_transfer" : "idle_workers"}:` +
            `${selectedWorkers.length}:${constrainedResource}`,
          actorIds: selectedWorkers.map((worker) => worker.actorId),
          resourceType: constrainedResource,
          sourceActorId: gatherSource.actorId
        });
      }
    }
    const openingComplete = activeCheckpointId === undefined;
    const workerCheckpoint = checkpointStatus.find((entry) => entry.checkpoint.id === "bootstrap-worker");
    const housing = calculateAiHousingDemand(
      observation,
      catalog,
      checkpoints.find((checkpoint) => checkpoint.id === "supply-safety")!.requiredObject,
      budget.supplyBuffer,
      unresolvedReservedEffectIds(state, "effect:supply:effect:")
    );
    const freeSupply = housing.freeSupply;
    if (openingComplete && housing.neededBuildings > 0 && housing.housingEntry) {
      const housingObject = housing.housingEntry.sourceObjectName;
      demands.push({
        demandId: "demand:supply:buffer" as AiDemandV1["demandId"],
        purpose: "supply_buffer",
        capabilityOrRole: "housing",
        unit: "actor_count",
        desired: housing.desiredBuildingCount,
        satisfiedActorIds: housing.ready.map((actor) => actor.actorId),
        queuedIds: [],
        constructingIds: housing.constructing.map((actor) => actor.actorId),
        acceptedNotObservedEffectIds: housing.acceptedEffectIds,
        preferredObjectNames: [housingObject],
        resourceObligations: housing.housingEntry.constructionProfile?.resourceCost ?? {}
      });
      const builders = self
        .filter(isAvailableBuilder)
        .filter((actor) => !reservedActorIds.has(actor.actorId))
        .filter((actor) =>
          catalog.entries.some(
            (entry) => entry.sourceObjectName === actor.objectName && entry.constructs.includes(housingObject)
          )
        );
      if (builders.length > 0 && canAffordAiEconomyCost(observation, housing.housingEntry.constructionProfile?.resourceCost ?? {})) {
        for (let index = 0; index < Math.min(housing.neededBuildings, builders.length); index += 1) {
          const builder = builders[index];
          if (!builder || builder.logicalPosition.status !== "known") continue;
          const position = selectConstructionPosition(
            observation,
            builder,
            state.scheduler.decisionSequence,
            ordinal + index,
            selectedConstructionTileKeys,
            housing.housingEntry.constructionProfile?.footprintRadiusTiles ?? 0
          );
          if (!position) continue;
          const ids = nextIds(state, "supply", ordinal++);
          intents.push({
            ...ids,
            kind: "construct",
            spendingCategory: housing.queuedPopulation > 0 ? "survival" : "economy",
            planId: state.opening.plan.planId,
            demandId: "demand:supply:buffer" as AiDemandV1["demandId"],
            lane: "supply_production",
            proposedTick: observation.tick,
            urgencyClass: 1,
            utility: housing.queuedPopulation > 0 ? 920 : 850,
            preconditions: [{ kind: "actor_exists", actorId: builder.actorId }],
            claims: [
              {
                claimId: `${ids.claimId}:builder` as AiIntentV1["claims"][number]["claimId"],
                kind: "actor",
                actorId: builder.actorId
              },
              { claimId: ids.claimId, kind: "site", siteKey: `supply:${housingObject}:${position.x}:${position.y}` },
              ...createAiResourceCostClaims(ids.claimId, housing.housingEntry.constructionProfile?.resourceCost ?? {}),
              {
                claimId: `${ids.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
                kind: "effect",
                effectId: ids.effectId
              }
            ],
            reasonCode: `supply_buffer:${state.opening.archetypeId}:deficit=${housing.queuedPopulation + budget.supplyBuffer - freeSupply}`,
            builderIds: [builder.actorId],
            objectName: housingObject,
            logicalPosition: position,
            siteKey: `supply:${housingObject}:${position.x}:${position.y}`
          });
        }
      }
    }

    const pressureDomain = openingComplete && state.strategy.assessment?.routeDomain === "air" ? "air" : "ground";
    const military = self.filter(
      (actor) =>
        actor.housingCost.status === "known" &&
        actor.housingCost.value > 0 &&
        catalog.entries.some(
          (entry) =>
            entry.sourceObjectName === actor.objectName &&
            isMilitaryCatalogEntry(entry) &&
            entry.movementDomains.includes(pressureDomain)
        )
    );
    const militaryProducts = new Set(
      catalog.entries
        .filter((entry) => isMilitaryCatalogEntry(entry) && entry.movementDomains.includes(pressureDomain))
        .map((entry) => entry.sourceObjectName)
    );
    const queuedMilitary = queuedProduction(observation, militaryProducts);
    const currentWorkerCount = self.filter((actor) =>
      catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.gathers.length > 0)
    ).length;
    const workforceRecoveryOwnsFood = currentWorkerCount < WORKER_RECOVERY_FLOOR && military.length > 0;
    const targetMilitary = plannedAiForceSize(
      openingComplete,
      pressureDomain,
      state.strategy.assessment,
      military.length,
      hasCredibleAiEconomyThreat(observation) ? budget.firstForce : null
    );
    const compositionPrefix = pressureDomain === "air" ? "composition-air" : "composition";
    const pressureForecast = projectAiResourceForecasts(
      observation,
      [
        {
          demandId: "demand:composition:first-squad" as AiDemandV1["demandId"],
          purpose: "military_resource_forecast",
          capabilityOrRole: `${pressureDomain}_combat_composition`,
          unit: "actor_count",
          desired: targetMilitary,
          satisfiedActorIds: military.map((actor) => actor.actorId),
          queuedIds: queuedMilitary.map((item) => item.itemId),
          constructingIds: [],
          acceptedNotObservedEffectIds: [],
          preferredObjectNames: [...militaryProducts].sort(),
          resourceObligations: {}
        }
      ],
      catalog
    );

    // A granary is only a drop-off point. Sustained reinforcement needs actual
    // renewable food sources plus workers assigned to them; otherwise a faction
    // can spend its starting food and permanently stop replacing combat losses.
    const foodSourceEntry = catalog.entries.find((entry) => entry.sourceObjectName === ObjectNames.Field);
    const readyFoodSources = self
      .filter((actor) => actor.objectName === ObjectNames.Field && isFinishedActor(actor))
      .sort((left, right) => left.actorId.localeCompare(right.actorId));
    const constructingFoodSources = self
      .filter((actor) => actor.objectName === ObjectNames.Field && !isFinishedActor(actor))
      .sort((left, right) => left.actorId.localeCompare(right.actorId));
    const acceptedFoodSourceEffectIds = unresolvedReservedEffectIds(state, "effect:food-capacity:Field:effect:");
    const economyPolicy = decideAiEconomyPolicy(
      observation,
      catalog,
      pressureForecast,
      state.strategy.stance === "defend",
      state.economyProduction.posture,
      state.strategy.assessment?.choice === "finish" &&
        state.strategy.assessment.readyForce >= state.strategy.assessment.requiredForce &&
        state.strategy.assessment.expectedEffectTick !== null &&
        state.strategy.assessment.expectedEffectTick <= observation.tick + 600
    );
    const desiredFoodSources =
      openingComplete && foodSourceEntry ? economyPolicy.desiredFoodSources : 0;
    if (workerCheckpoint?.fulfilled) {
      const recovery = proposeAiWorkerRecovery(
        observation,
        state,
        catalog,
        workerCheckpoint.checkpoint.requiredObject,
        Math.max(WORKER_RECOVERY_FLOOR, economyPolicy.desiredWorkers),
        economyPolicy.posture !== "safe" ? { urgencyClass: 2, utility: 700 } : undefined
      );
      demands.push(recovery.demand);
      if (recovery.intent) intents.push(recovery.intent);
    }
    const foodPrerequisiteObject = foodSourceEntry?.constructionProfile?.requiredObjectNames?.[0];
    const foodPrerequisiteEntry = catalog.entries.find((entry) => entry.sourceObjectName === foodPrerequisiteObject);
    const desiredFoodPrerequisites =
      foodPrerequisiteObject && desiredFoodSources > 0 ? Math.max(1, Math.ceil(desiredFoodSources / 4)) : 0;
    const readyFoodPrerequisites = foodPrerequisiteObject
      ? self.filter((actor) => actor.objectName === foodPrerequisiteObject && isFinishedActor(actor))
      : [];
    const constructingFoodPrerequisites = foodPrerequisiteObject
      ? self.filter((actor) => actor.objectName === foodPrerequisiteObject && !isFinishedActor(actor))
      : [];
    const acceptedFoodPrerequisiteEffectIds = foodPrerequisiteObject
      ? unresolvedReservedEffectIds(state, `effect:food-prerequisite:${foodPrerequisiteObject}:effect:`)
      : [];
    const committedFoodPrerequisites =
      readyFoodPrerequisites.length + constructingFoodPrerequisites.length + acceptedFoodPrerequisiteEffectIds.length;
    if (desiredFoodPrerequisites > 0 && foodPrerequisiteObject && foodPrerequisiteEntry) {
      const prerequisiteDemandId = "demand:economy:food-prerequisite" as AiDemandV1["demandId"];
      demands.push({
        demandId: prerequisiteDemandId,
        purpose: "food_drop_off_capacity",
        capabilityOrRole: foodPrerequisiteObject,
        unit: "actor_count",
        desired: desiredFoodPrerequisites,
        satisfiedActorIds: readyFoodPrerequisites.map((actor) => actor.actorId),
        queuedIds: [],
        constructingIds: constructingFoodPrerequisites.map((actor) => actor.actorId),
        acceptedNotObservedEffectIds: acceptedFoodPrerequisiteEffectIds,
        preferredObjectNames: [foodPrerequisiteObject],
        resourceObligations: foodPrerequisiteEntry.constructionProfile?.resourceCost ?? {}
      });
      if (
        committedFoodPrerequisites < desiredFoodPrerequisites &&
        canAffordAiEconomyCost(observation, foodPrerequisiteEntry.constructionProfile?.resourceCost ?? {})
      ) {
        const alreadyClaimed = claimedActorIds(intents);
        const builder = self
          .filter(isAvailableBuilder)
          .filter((actor) => !reservedActorIds.has(actor.actorId) && !alreadyClaimed.has(actor.actorId))
          .filter((actor) =>
            catalog.entries.some(
              (entry) =>
                entry.sourceObjectName === actor.objectName && entry.constructs.includes(foodPrerequisiteObject)
            )
          )
          .sort((left, right) => left.actorId.localeCompare(right.actorId))[0];
        if (builder) {
          const position = selectConstructionPosition(
            observation,
            builder,
            state.scheduler.decisionSequence,
            ordinal,
            selectedConstructionTileKeys,
            foodPrerequisiteEntry.constructionProfile?.footprintRadiusTiles ?? 0
          );
          if (position) {
            const next = nextIds(state, `food-prerequisite:${foodPrerequisiteObject}`, ordinal++);
            intents.push({
              ...next,
              kind: "construct",
              spendingCategory: readyFoodPrerequisites.length === 0 ? "survival" : "economy",
              planId: state.opening.plan.planId,
              demandId: prerequisiteDemandId,
              lane: "essential_economy",
              proposedTick: observation.tick,
              urgencyClass: readyFoodPrerequisites.length === 0 ? 0 : 2,
              utility: readyFoodPrerequisites.length === 0 ? 930 : 760,
              preconditions: [{ kind: "actor_exists", actorId: builder.actorId }],
              claims: [
                {
                  claimId: `${next.claimId}:builder` as AiIntentV1["claims"][number]["claimId"],
                  kind: "actor",
                  actorId: builder.actorId
                },
                {
                  claimId: next.claimId,
                  kind: "site",
                  siteKey: `food-prerequisite:${foodPrerequisiteObject}:${position.x}:${position.y}`
                },
                ...createAiResourceCostClaims(
                  next.claimId,
                  foodPrerequisiteEntry.constructionProfile?.resourceCost ?? {}
                ),
                {
                  claimId: `${next.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
                  kind: "effect",
                  effectId: next.effectId
                }
              ],
              reasonCode:
                `food_prerequisite:${foodPrerequisiteObject}:` +
                `ready=${readyFoodPrerequisites.length}:committed=${committedFoodPrerequisites}/${desiredFoodPrerequisites}`,
              builderIds: [builder.actorId],
              objectName: foodPrerequisiteObject,
              logicalPosition: position,
              siteKey: `food-prerequisite:${foodPrerequisiteObject}:${position.x}:${position.y}`
            });
          }
        }
      }
    }
    if (desiredFoodSources > 0 && foodSourceEntry) {
      demands.push({
        demandId: "demand:economy:sustainable-food" as AiDemandV1["demandId"],
        purpose: "renewable_food_capacity",
        capabilityOrRole: ObjectNames.Field,
        unit: "actor_count",
        desired: desiredFoodSources,
        satisfiedActorIds: readyFoodSources.map((actor) => actor.actorId),
        queuedIds: [],
        constructingIds: constructingFoodSources.map((actor) => actor.actorId),
        acceptedNotObservedEffectIds: acceptedFoodSourceEffectIds,
        preferredObjectNames: [ObjectNames.Field],
        resourceObligations: foodSourceEntry.constructionProfile?.resourceCost ?? {}
      });
      const committedFoodSources =
        readyFoodSources.length + constructingFoodSources.length + acceptedFoodSourceEffectIds.length;
      if (
        committedFoodSources < desiredFoodSources &&
        (!foodPrerequisiteObject || readyFoodPrerequisites.length > 0) &&
        canAffordAiEconomyCost(observation, foodSourceEntry.constructionProfile?.resourceCost ?? {})
      ) {
        const alreadyClaimed = claimedActorIds(intents);
        const builder = self
          .filter(isAvailableBuilder)
          .filter((actor) => !reservedActorIds.has(actor.actorId) && !alreadyClaimed.has(actor.actorId))
          .filter((actor) =>
            catalog.entries.some(
              (entry) => entry.sourceObjectName === actor.objectName && entry.constructs.includes(ObjectNames.Field)
            )
          )
          .sort((left, right) => {
            const leftIdle = left.activeOrder?.status === "known" && left.activeOrder.value === null ? 0 : 1;
            const rightIdle = right.activeOrder?.status === "known" && right.activeOrder.value === null ? 0 : 1;
            return leftIdle - rightIdle || left.actorId.localeCompare(right.actorId);
          })[0];
        if (builder) {
          const position = selectConstructionPosition(
            observation,
            builder,
            state.scheduler.decisionSequence,
            ordinal,
            selectedConstructionTileKeys,
            foodSourceEntry.constructionProfile?.footprintRadiusTiles ?? 0
          );
          if (position) {
            const next = nextIds(state, `food-capacity:${ObjectNames.Field}`, ordinal++);
            intents.push({
              ...next,
              kind: "construct",
              spendingCategory: readyFoodSources.length === 0 ? "survival" : "economy",
              planId: state.opening.plan.planId,
              demandId: "demand:economy:sustainable-food" as AiDemandV1["demandId"],
              lane: "essential_economy",
              proposedTick: observation.tick,
              urgencyClass: 1,
              utility: 880,
              preconditions: [{ kind: "actor_exists", actorId: builder.actorId }],
              claims: [
                {
                  claimId: `${next.claimId}:builder` as AiIntentV1["claims"][number]["claimId"],
                  kind: "actor",
                  actorId: builder.actorId
                },
                {
                  claimId: next.claimId,
                  kind: "site",
                  siteKey: `food-capacity:${ObjectNames.Field}:${position.x}:${position.y}`
                },
                ...createAiResourceCostClaims(next.claimId, foodSourceEntry.constructionProfile?.resourceCost ?? {}),
                {
                  claimId: `${next.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
                  kind: "effect",
                  effectId: next.effectId
                }
              ],
              reasonCode: `food_capacity:ready=${readyFoodSources.length}:committed=${committedFoodSources}/${desiredFoodSources}`,
              builderIds: [builder.actorId],
              objectName: ObjectNames.Field,
              logicalPosition: position,
              siteKey: `food-capacity:${ObjectNames.Field}:${position.x}:${position.y}`
            });
          }
        }
      }

      const staffedFoodSourceIds = new Set(
        self.flatMap((actor) => {
          const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
          return order?.orderType === OrderType.Gather && order.targetActorId ? [order.targetActorId] : [];
        })
      );
      // A returning food worker will automatically resume its Field after delivery. Its transient order does not
      // expose the source identity, so defer new Field assignments until all such workers resume gathering.
      const returningWorkerCount = self.filter((actor) => {
        const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
        if (order?.orderType !== OrderType.ReturnResources || !order.targetActorId) return false;
        return self.some(
          (target) =>
            target.actorId === order.targetActorId &&
            (target.objectName === foodPrerequisiteObject || target.objectName === ObjectNames.Granary)
        );
      }).length;
      const unstaffedFoodSource =
        returningWorkerCount === 0
          ? readyFoodSources.find((source) => !staffedFoodSourceIds.has(source.actorId))
          : undefined;
      if (unstaffedFoodSource) {
        const alreadyClaimed = claimedActorIds(intents);
        const worker = self
          .filter((actor) =>
            catalog.entries.some(
              (entry) => entry.sourceObjectName === actor.objectName && entry.gathers.includes(ResourceType.Food)
            )
          )
          .filter((actor) => !reservedActorIds.has(actor.actorId) && !alreadyClaimed.has(actor.actorId))
          .filter((actor) => {
            const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
            // Returning food is part of the Field's durable labor assignment. Replacing
            // that order strands the carried food and causes every decision to bounce a
            // worker between otherwise healthy Fields.
            return (
              order === null ||
              (order.orderType === OrderType.Gather &&
                (order.targetActorId === null ||
                  !readyFoodSources.some((source) => source.actorId === order.targetActorId)))
            );
          })
          .sort((left, right) => {
            const leftIdle = left.activeOrder?.status === "known" && left.activeOrder.value === null ? 0 : 1;
            const rightIdle = right.activeOrder?.status === "known" && right.activeOrder.value === null ? 0 : 1;
            return leftIdle - rightIdle || left.actorId.localeCompare(right.actorId);
          })[0];
        if (worker) {
          const next = nextIds(state, "food-labor", ordinal++);
          intents.push({
            ...next,
            kind: "assign_gatherers",
            planId: state.opening.plan.planId,
            demandId: "demand:economy:sustainable-food" as AiDemandV1["demandId"],
            lane: "essential_economy",
            proposedTick: observation.tick,
            urgencyClass: 1,
            utility: 900,
            preconditions: [
              { kind: "actor_exists", actorId: worker.actorId },
              { kind: "actor_exists", actorId: unstaffedFoodSource.actorId }
            ],
            claims: [
              { claimId: next.claimId, kind: "actor", actorId: worker.actorId },
              {
                claimId: `${next.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
                kind: "effect",
                effectId: next.effectId
              }
            ],
            reasonCode: `food_labor:source=${unstaffedFoodSource.actorId}`,
            actorIds: [worker.actorId],
            resourceType: ResourceType.Food,
            sourceActorId: unstaffedFoodSource.actorId
          });
        }
      }
    }

    const rawAcceptedMilitaryEffectIds = unresolvedReservedEffectIds(state, `effect:${compositionPrefix}:effect:`);
    // The opening force is enough to survive and scout. A completed opening commits
    // to a dated force target that grows with evidenced opposition; the strategic selector may launch a
    // smaller credible force when a reachable objective has little visible defense.
    // Queue observation and accepted leases can briefly describe the same command.
    // Clamp accepted-not-observed identities to the genuinely unobserved remainder
    // so the demand ledger stays disjoint and does not report false overproduction.
    const acceptedMilitaryEffectIds = rawAcceptedMilitaryEffectIds.slice(
      0,
      Math.max(0, targetMilitary - military.length - queuedMilitary.length)
    );
    demands.push({
      demandId: "demand:composition:first-squad" as AiDemandV1["demandId"],
      purpose: openingComplete ? `dated_${pressureDomain}_pressure` : "opening_force",
      capabilityOrRole: `${pressureDomain}_combat_composition`,
      unit: "actor_count",
      desired: targetMilitary,
      satisfiedActorIds: military.map((actor) => actor.actorId).sort(),
      queuedIds: queuedMilitary.map((item) => item.itemId),
      constructingIds: [],
      acceptedNotObservedEffectIds: acceptedMilitaryEffectIds,
      preferredObjectNames: [...militaryProducts].sort(),
      resourceObligations: {}
    });

    const militaryProducers = self
      .filter(isFinishedActor)
      .filter((actor) => producerMilitaryProducts(actor.objectName, catalog, pressureDomain).length > 0)
      .sort((left, right) => left.actorId.localeCompare(right.actorId));
    const primaryProducerObjectName = militaryProducers[0]?.objectName;
    const desiredProducerCount = openingComplete
      ? plannedAiProducerCount(targetMilitary, military.length, queuedMilitary.length)
      : 1;
    if (primaryProducerObjectName) {
      const constructingProducers = self
        .filter((actor) => actor.objectName === primaryProducerObjectName && !isFinishedActor(actor))
        .sort((left, right) => left.actorId.localeCompare(right.actorId));
      const acceptedCapacityEffectIds = unresolvedReservedEffectIds(
        state,
        `effect:capacity:${primaryProducerObjectName}:effect:`
      );
      const producerEntry = catalog.entries.find((entry) => entry.sourceObjectName === primaryProducerObjectName);
      demands.push({
        demandId: "demand:capacity:first-army" as AiDemandV1["demandId"],
        purpose: "dated_military_throughput",
        capabilityOrRole: primaryProducerObjectName,
        unit: "work_per_horizon",
        desired: desiredProducerCount,
        satisfiedActorIds: militaryProducers.map((actor) => actor.actorId),
        queuedIds: [],
        constructingIds: constructingProducers.map((actor) => actor.actorId),
        acceptedNotObservedEffectIds: acceptedCapacityEffectIds,
        preferredObjectNames: [primaryProducerObjectName],
        resourceObligations: producerEntry?.constructionProfile?.resourceCost ?? {}
      });
      const committedCapacity =
        militaryProducers.length + constructingProducers.length + acceptedCapacityEffectIds.length;
      if (openingComplete && !workforceRecoveryOwnsFood && committedCapacity < desiredProducerCount) {
        const alreadyClaimed = claimedActorIds(intents);
        const builder = self
          .filter(isAvailableBuilder)
          .filter((actor) => !reservedActorIds.has(actor.actorId) && !alreadyClaimed.has(actor.actorId))
          .filter((actor) =>
            catalog.entries.some(
              (entry) =>
                entry.sourceObjectName === actor.objectName && entry.constructs.includes(primaryProducerObjectName)
            )
          )
          .sort((left, right) => {
            const leftIdle = left.activeOrder?.status === "known" && left.activeOrder.value === null ? 1 : 0;
            const rightIdle = right.activeOrder?.status === "known" && right.activeOrder.value === null ? 1 : 0;
            return leftIdle - rightIdle || left.actorId.localeCompare(right.actorId);
          })[0];
        if (builder) {
          const position = selectConstructionPosition(
            observation,
            builder,
            state.scheduler.decisionSequence,
            ordinal,
            selectedConstructionTileKeys,
            producerEntry?.constructionProfile?.footprintRadiusTiles ?? 0
          );
          if (position) {
            const next = nextIds(state, `capacity:${primaryProducerObjectName}`, ordinal++);
            intents.push({
              ...next,
              kind: "construct",
              spendingCategory: "defense",
              planId: state.opening.plan.planId,
              demandId: "demand:capacity:first-army" as AiDemandV1["demandId"],
              lane: "supply_production",
              proposedTick: observation.tick,
              urgencyClass: 3,
              utility: 640,
              preconditions: [{ kind: "actor_exists", actorId: builder.actorId }],
              claims: [
                {
                  claimId: `${next.claimId}:builder` as AiIntentV1["claims"][number]["claimId"],
                  kind: "actor",
                  actorId: builder.actorId
                },
                {
                  claimId: next.claimId,
                  kind: "site",
                  siteKey: `capacity:${primaryProducerObjectName}:${position.x}:${position.y}`
                },
                ...createAiResourceCostClaims(next.claimId, producerEntry?.constructionProfile?.resourceCost ?? {}),
                {
                  claimId: `${next.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
                  kind: "effect",
                  effectId: next.effectId
                }
              ],
              reasonCode:
                `capacity:dated_target=${targetMilitary}:ready=${militaryProducers.length}:` +
                `committed=${committedCapacity}/${desiredProducerCount}`,
              builderIds: [builder.actorId],
              objectName: primaryProducerObjectName,
              logicalPosition: position,
              siteKey: `capacity:${primaryProducerObjectName}:${position.x}:${position.y}`
            });
          }
        }
      }
    }

    const projectedCount = military.length + queuedMilitary.length + acceptedMilitaryEffectIds.length;
    if (!workforceRecoveryOwnsFood && projectedCount < targetMilitary) {
      const roleCounts = { frontline: 0, ranged: 0, support: 0 };
      for (const actor of military) roleCounts[roleFor(actor.objectName, catalog)] += 1;
      for (const item of queuedMilitary) roleCounts[roleFor(item.objectName, catalog)] += 1;
      const desiredRanged = Math.ceil((targetMilitary * budget.rangedPermille) / 1000);
      const remainingProductionResources = new Map(
        observation.resources.map(
          (resource) =>
            [resource.resourceType, resource.stockpile - resource.reservedUnspent - resource.obligationsDue] as const
        )
      );
      let remaining = targetMilitary - projectedCount;
      for (const producer of militaryProducers.filter(queueFree)) {
        if (remaining <= 0) break;
        const candidate = [...producerMilitaryProducts(producer.objectName, catalog, pressureDomain)]
          .filter((objectName) => {
            const cost = catalog.entries.find((entry) => entry.sourceObjectName === objectName)?.constructionProfile
              ?.resourceCost;
            return Object.entries(cost ?? {}).every(
              ([resourceType, amount]) =>
                (remainingProductionResources.get(resourceType as ResourceType) ?? 0) >= (amount ?? 0)
            );
          })
          .sort((left, right) => {
            const leftRole = roleFor(left, catalog);
            const rightRole = roleFor(right, catalog);
            const leftDeficit = productionRoleDeficit(leftRole, roleCounts, targetMilitary, desiredRanged);
            const rightDeficit = productionRoleDeficit(rightRole, roleCounts, targetMilitary, desiredRanged);
            const totalCost = (objectName: ObjectNames) =>
              Object.values(
                catalog.entries.find((entry) => entry.sourceObjectName === objectName)?.constructionProfile
                  ?.resourceCost ?? {}
              ).reduce<number>((total, amount) => total + (amount ?? 0), 0);
            return rightDeficit - leftDeficit || totalCost(left) - totalCost(right) || left.localeCompare(right);
          })[0];
        if (!candidate) continue;
        const next = nextIds(state, compositionPrefix, ordinal++);
        const resourceCost =
          catalog.entries.find((entry) => entry.sourceObjectName === candidate)?.constructionProfile?.resourceCost ??
          {};
        const resourceClaims = Object.entries(resourceCost)
          .filter((entry): entry is [ResourceType, number] => entry[1] !== undefined && entry[1] > 0)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([resourceType, amount]) => ({
            claimId: `${next.claimId}:${resourceType}` as AiIntentV1["claims"][number]["claimId"],
            kind: "resource" as const,
            resourceType,
            amount
          }));
        intents.push({
          ...next,
          kind: "produce",
          spendingCategory: "defense",
          planId: state.opening.plan.planId,
          demandId: "demand:composition:first-squad" as AiDemandV1["demandId"],
          lane: "supply_production",
          proposedTick: observation.tick,
          urgencyClass: 3,
          utility: 600,
          preconditions: [{ kind: "actor_exists", actorId: producer.actorId }],
          claims: [
            { claimId: next.claimId, kind: "production_slot", producerId: producer.actorId, slot: 0 },
            ...resourceClaims,
            {
              claimId: `${next.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
              kind: "effect",
              effectId: next.effectId
            }
          ],
          reasonCode:
            `composition:${state.opening.archetypeId}:${roleFor(candidate, catalog)}:` +
            `frontline=${roleCounts.frontline}:ranged=${roleCounts.ranged}:projected=${
              projectedCount +
              intents.filter(
                (intent) => intent.kind === "produce" && intent.demandId === "demand:composition:first-squad"
              ).length
            }/${targetMilitary}`,
          producerId: producer.actorId,
          objectName: candidate
        });
        for (const [resourceType, amount] of Object.entries(resourceCost)) {
          remainingProductionResources.set(
            resourceType as ResourceType,
            Math.max(0, (remainingProductionResources.get(resourceType as ResourceType) ?? 0) - (amount ?? 0))
          );
        }
        roleCounts[roleFor(candidate, catalog)] += 1;
        remaining -= 1;
      }
    }

    const current = steps.find((step) => step.state !== "completed")?.stepId ?? null;
    return {
      managerId: this.managerId,
      lane: "supply_production",
      evaluated: true,
      intents,
      spendingBudget: economyPolicy.budget,
      reasons: [
        `opening_step:${current ?? "transition"}`,
        `archetype:${state.opening.archetypeId}`,
        `supply_free:${freeSupply}/${budget.supplyBuffer}`,
        `military:${military.length}/${targetMilitary}`,
        `workforce_food_priority:${workforceRecoveryOwnsFood}`,
        `economy:workers=${economyPolicy.workers}+${economyPolicy.queuedWorkers}/${economyPolicy.desiredWorkers}:` +
          `assigned=${economyPolicy.assignedWorkers}:food_runway=${economyPolicy.foodRunwayTicks}`,
        `spending:${economyPolicy.posture}:economy=${economyPolicy.budget.economyPermille}:` +
          `defense=${economyPolicy.budget.defensePermille}:blocker=${economyPolicy.blocker ?? "none"}`
      ],
      statePatch: {
        opening: {
          ...state.opening,
          plan: { ...state.opening.plan, currentStepId: current, steps, lifecycle: current ? "active" : "completed" }
        },
        economyProduction: {
          demands,
          forecasts: projectAiResourceForecasts(observation, demands, catalog),
          posture: economyPolicy.postureState,
          workforce: {
            workers: economyPolicy.workers,
            queuedWorkers: economyPolicy.queuedWorkers,
            assignedWorkers: economyPolicy.assignedWorkers,
            desiredWorkers: economyPolicy.desiredWorkers,
            desiredFoodSources: economyPolicy.desiredFoodSources,
            foodRunwayTicks: economyPolicy.foodRunwayTicks,
            blocker: economyPolicy.blocker,
            economyPermille: economyPolicy.budget.economyPermille,
            defensePermille: economyPolicy.budget.defensePermille
          },
          adaptation: state.economyProduction.adaptation
        }
      }
    };
  }
}
