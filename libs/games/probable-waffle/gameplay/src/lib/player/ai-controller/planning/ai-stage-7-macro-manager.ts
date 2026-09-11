import { FactionType, ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiDemandV1, AiPlanStepV1 } from "../contracts/ai-plan-contracts";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";

/** One resolved opening checkpoint; the runtime catalog remains the authority for legality. */
interface OpeningCheckpointV1 {
  readonly id: string;
  readonly purpose: string;
  readonly requiredObject: ObjectNames;
  readonly desired: number;
}

const factionOpenings: Readonly<Record<FactionType, readonly OpeningCheckpointV1[]>> = {
  [FactionType.Tivara]: [
    { id: "bootstrap-worker", purpose: "bootstrap_worker", requiredObject: ObjectNames.TivaraWorker, desired: 1 },
    { id: "supply-safety", purpose: "supply_buffer", requiredObject: ObjectNames.Olival, desired: 1 },
    { id: "first-producer", purpose: "first_military_producer", requiredObject: ObjectNames.AnkGuard, desired: 1 },
    { id: "sustainable-food", purpose: "sustainable_food", requiredObject: ObjectNames.Granary, desired: 1 }
  ],
  [FactionType.Skaduwee]: [
    { id: "bootstrap-worker", purpose: "bootstrap_worker", requiredObject: ObjectNames.SkaduweeWorker, desired: 1 },
    { id: "supply-safety", purpose: "supply_buffer", requiredObject: ObjectNames.Emberstone, desired: 1 },
    { id: "first-producer", purpose: "first_military_producer", requiredObject: ObjectNames.InfantryInn, desired: 1 },
    { id: "sustainable-food", purpose: "sustainable_food", requiredObject: ObjectNames.Granary, desired: 1 }
  ]
};

function owned(observation: AiObservationV1) {
  return observation.actors.filter((actor) => actor.relation === "self" && actor.visibility === "owned");
}

function checkpointActors(
  observation: AiObservationV1,
  checkpoint: OpeningCheckpointV1,
  catalog: AiCapabilityCatalogV1
) {
  const actors = owned(observation);
  if (checkpoint.id !== "bootstrap-worker") {
    return actors.filter((actor) => actor.objectName === checkpoint.requiredObject);
  }
  return actors.filter((actor) => {
    const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === actor.objectName);
    return actor.objectName === checkpoint.requiredObject || (entry?.gathers.length ?? 0) > 0;
  });
}

function isFinishedActor(actor: AiObservationV1["actors"][number]): boolean {
  return actor.constructionProgress?.status !== "known" || actor.constructionProgress.value >= 100;
}

function queueFree(actor: AiObservationV1["actors"][number]): boolean {
  return actor.queue.status !== "known" || actor.queue.value.occupied === 0;
}

function claimedActorIds(intents: readonly AiIntentV1[]): ReadonlySet<string> {
  return new Set(
    intents.flatMap((intent) => intent.claims.flatMap((claim) => (claim.kind === "actor" ? [claim.actorId] : [])))
  );
}

function queuedProduction(observation: AiObservationV1, objectNames: ReadonlySet<ObjectNames>) {
  return owned(observation)
    .flatMap((actor) =>
      actor.queue.status === "known"
        ? (actor.queue.value.items ?? [])
            .filter(
              (item): item is typeof item & { readonly objectName: ObjectNames } =>
                item.kind === "production" && item.objectName !== null && objectNames.has(item.objectName)
            )
            .map((item) => ({ producerId: actor.actorId, itemId: item.itemId, objectName: item.objectName }))
        : []
    )
    .sort((left, right) => left.itemId.localeCompare(right.itemId));
}

/** Historical opening progress must not regress when a later expansion becomes active. */
const OPENING_WORKER_COUNT = 6;

function queuedObjectIds(observation: AiObservationV1, objectName: ObjectNames): string[] {
  return owned(observation)
    .flatMap((actor) =>
      actor.queue.status === "known"
        ? (actor.queue.value.items ?? [])
            .filter((item) => item.kind === "production" && item.objectName === objectName)
            .map((item) => item.itemId)
        : []
    )
    .sort();
}

function isAvailableBuilder(actor: AiObservationV1["actors"][number]): boolean {
  return actor.activeOrder?.status !== "known" || actor.activeOrder.value?.orderType !== OrderType.Build;
}

function hasAssignedBuilder(observation: AiObservationV1, siteActorId: string): boolean {
  return owned(observation).some(
    (actor) =>
      actor.activeOrder?.status === "known" &&
      actor.activeOrder.value?.orderType === OrderType.Build &&
      actor.activeOrder.value.targetActorId === siteActorId
  );
}

function selectConstructionPosition(
  observation: AiObservationV1,
  builder: AiObservationV1["actors"][number],
  decisionSequence: number,
  ordinal: number,
  selectedTileKeys: Set<string>,
  footprintRadiusTiles = 0
) {
  if (builder.logicalPosition.status !== "known") return undefined;
  const origin = builder.logicalPosition.value;
  const cells = observation.map?.constructionCells ?? [];
  const byKey = new Map(cells.map((cell) => [cell.tileKey, cell]));
  const footprintKeys = (x: number, y: number) => {
    const keys: string[] = [];
    for (let offsetY = -footprintRadiusTiles; offsetY <= footprintRadiusTiles; offsetY += 1) {
      for (let offsetX = -footprintRadiusTiles; offsetX <= footprintRadiusTiles; offsetX += 1) {
        keys.push(`${x + offsetX},${y + offsetY}`);
      }
    }
    return keys;
  };
  const candidates = cells
    .filter((cell) => {
      const keys = footprintKeys(cell.position.x, cell.position.y);
      return keys.every((key) => {
        const footprintCell = byKey.get(key);
        return (
          footprintCell !== undefined &&
          footprintCell.groundPassable &&
          !footprintCell.observedBlocked &&
          !selectedTileKeys.has(key)
        );
      });
    })
    .sort(
      (left, right) =>
        Math.abs(left.position.x - origin.x) +
          Math.abs(left.position.y - origin.y) -
          (Math.abs(right.position.x - origin.x) + Math.abs(right.position.y - origin.y)) ||
        left.tileKey.localeCompare(right.tileKey)
    );
  if (candidates.length === 0) return undefined;
  const selected = candidates[(decisionSequence + ordinal) % candidates.length];
  if (!selected) return undefined;
  for (const key of footprintKeys(selected.position.x, selected.position.y)) selectedTileKeys.add(key);
  return selected.position;
}

function nextIds(state: AiBrainStateV1, prefix: string, index: number) {
  const suffix = `${state.scheduler.decisionSequence}:${index}`;
  return {
    intentId: `${prefix}:intent:${suffix}` as AiIntentV1["intentId"],
    effectId: `${prefix}:effect:${suffix}` as AiIntentV1["effectId"],
    claimId: `${prefix}:claim:${suffix}` as AiIntentV1["claims"][number]["claimId"]
  };
}

function roleFor(objectName: ObjectNames, catalog: AiCapabilityCatalogV1): "frontline" | "ranged" | "support" {
  const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === objectName);
  const family = entry?.family.toLowerCase() ?? "";
  if (family.includes("heal") || family.includes("support")) return "support";
  if (family.includes("range")) return "ranged";
  return "frontline";
}

function isMilitaryCatalogEntry(entry: AiCapabilityCatalogV1["entries"][number]): boolean {
  return entry.gathers.length === 0 && entry.targetDomains.length > 0;
}

function producerMilitaryProducts(
  objectName: ObjectNames,
  catalog: AiCapabilityCatalogV1,
  movementDomain?: "ground" | "air" | "water"
): readonly ObjectNames[] {
  const producer = catalog.entries.find((entry) => entry.sourceObjectName === objectName);
  return (producer?.produces ?? [])
    .filter((candidate) => {
      const product = catalog.entries.find((entry) => entry.sourceObjectName === candidate);
      return (
        product !== undefined &&
        isMilitaryCatalogEntry(product) &&
        (movementDomain === undefined || product.movementDomains.includes(movementDomain))
      );
    })
    .sort();
}

/** Archetypes vary a legal branch budget only; every profile still executes the shared essential checkpoints. */
function openingBudget(archetypeId: string): {
  readonly firstForce: number;
  readonly supplyBuffer: number;
  readonly rangedPermille: number;
} {
  const parts = archetypeId.split(":");
  const purpose = parts[parts.length - 1];
  switch (purpose) {
    case "rush":
    case "pressure":
      return { firstForce: 4, supplyBuffer: 3, rangedPermille: 300 };
    case "macro":
      return { firstForce: 4, supplyBuffer: 5, rangedPermille: 400 };
    case "tech":
      return { firstForce: 5, supplyBuffer: 4, rangedPermille: 500 };
    case "turtle":
    case "safe":
      return { firstForce: 6, supplyBuffer: 4, rangedPermille: 500 };
    default:
      return { firstForce: 6, supplyBuffer: 3, rangedPermille: 400 };
  }
}

/**
 * Stage 7 proposal owner. It derives opening, supply and composition demand
 * from one committed observation and the paired runtime capability catalog.
 * It never assumes that an object is buildable merely because its name appears
 * in a faction recipe: the catalog must expose the matching producer/builder.
 */
export class AiStage7MacroManagerV1 implements AiProposalManagerV1 {
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

    const checkpoints = factionOpenings[observation.faction];
    const demands: AiDemandV1[] = [];
    const intents: AiIntentV1[] = [];
    const steps: AiPlanStepV1[] = [];
    const selectedConstructionTileKeys = new Set<string>();
    const reservedActorIds = new Set(
      state.reservations
        .map((reservation) => reservation.subjectKey)
        .filter((subjectKey): subjectKey is string => subjectKey?.startsWith("actor:") === true)
        .map((subjectKey) => subjectKey.slice("actor:".length))
    );
    let ordinal = 0;
    const checkpointStatus = checkpoints.map((checkpoint) => {
      const matchingActors = checkpointActors(observation, checkpoint, catalog);
      const desired = checkpoint.id === "bootstrap-worker" ? OPENING_WORKER_COUNT : checkpoint.desired;
      const previousStep = state.opening.plan.steps.find((step) => step.stepId === `step:opening:${checkpoint.id}`);
      const satisfiedActors = matchingActors.filter(isFinishedActor);
      return {
        checkpoint,
        desired,
        satisfiedActors,
        constructingActors: matchingActors.filter((actor) => !isFinishedActor(actor)),
        queuedIds: queuedObjectIds(observation, checkpoint.requiredObject),
        fulfilled: previousStep?.state === "completed" || satisfiedActors.length >= desired,
        completedTick: previousStep?.completedTick ?? null
      };
    });
    const activeCheckpointId = checkpointStatus.find(({ fulfilled }) => !fulfilled)?.checkpoint.id;

    for (const {
      checkpoint,
      desired,
      satisfiedActors,
      constructingActors,
      queuedIds,
      fulfilled,
      completedTick
    } of checkpointStatus) {
      const count = satisfiedActors.length;
      const demandId = `demand:opening:${checkpoint.id}` as AiDemandV1["demandId"];
      demands.push({
        demandId,
        purpose: checkpoint.purpose,
        capabilityOrRole: checkpoint.requiredObject,
        unit: "actor_count",
        desired,
        satisfiedActorIds: satisfiedActors.map((actor) => actor.actorId),
        queuedIds,
        constructingIds: constructingActors.map((actor) => actor.actorId),
        acceptedNotObservedEffectIds: [],
        preferredObjectNames: [checkpoint.requiredObject],
        resourceObligations: {}
      });
      steps.push({
        stepId: `step:opening:${checkpoint.id}` as AiPlanStepV1["stepId"],
        state: fulfilled ? "completed" : checkpoint.id === activeCheckpointId ? "current" : "pending",
        demandIds: [demandId],
        deadline: null,
        completedTick: fulfilled ? (completedTick ?? observation.tick) : null
      });
      if (fulfilled || checkpoint.id !== activeCheckpointId || satisfiedActors.length + queuedIds.length >= desired)
        continue;

      const stalledSite = [...constructingActors]
        .sort((left, right) => left.actorId.localeCompare(right.actorId))
        .find((site) => !hasAssignedBuilder(observation, site.actorId));
      if (stalledSite) {
        const builder = owned(observation)
          .filter(isAvailableBuilder)
          .filter((actor) => !reservedActorIds.has(actor.actorId))
          .sort((left, right) => left.actorId.localeCompare(right.actorId))
          .find((actor) =>
            catalog.entries.some(
              (entry) =>
                entry.sourceObjectName === actor.objectName && entry.constructs.includes(checkpoint.requiredObject)
            )
          );
        if (builder) {
          const ids = nextIds(state, `resume-construction:${stalledSite.actorId}`, ordinal++);
          intents.push({
            ...ids,
            kind: "resume_construct",
            planId: state.opening.plan.planId,
            demandId,
            lane: "supply_production",
            proposedTick: observation.tick,
            urgencyClass: 1,
            utility: 900,
            preconditions: [
              { kind: "actor_exists", actorId: builder.actorId },
              { kind: "actor_exists", actorId: stalledSite.actorId }
            ],
            claims: [
              {
                claimId: `${ids.claimId}:builder` as AiIntentV1["claims"][number]["claimId"],
                kind: "actor",
                actorId: builder.actorId
              },
              {
                claimId: `${ids.claimId}:site` as AiIntentV1["claims"][number]["claimId"],
                kind: "site",
                siteKey: `observed-site:${stalledSite.actorId}`
              },
              {
                claimId: `${ids.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
                kind: "effect",
                effectId: ids.effectId
              }
            ],
            reasonCode: `opening:${checkpoint.id}:resume_stalled_construction`,
            actorIds: [builder.actorId],
            targetActorId: stalledSite.actorId
          });
        }
        continue;
      }
      if (constructingActors.length > 0) continue;

      const producer = owned(observation).find((actor) => {
        const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === actor.objectName);
        return entry?.produces.includes(checkpoint.requiredObject) && queueFree(actor);
      });
      if (producer) {
        const ids = nextIds(state, checkpoint.id, ordinal++);
        intents.push({
          ...ids,
          kind: "produce",
          planId: state.opening.plan.planId,
          demandId,
          lane: checkpoint.id === "bootstrap-worker" ? "essential_economy" : "supply_production",
          proposedTick: observation.tick,
          urgencyClass: checkpoint.id === "bootstrap-worker" ? 0 : 2,
          utility: checkpoint.id === "bootstrap-worker" ? 950 : 700,
          preconditions: [{ kind: "actor_exists", actorId: producer.actorId }],
          claims: [
            { claimId: ids.claimId, kind: "production_slot", producerId: producer.actorId, slot: 0 },
            {
              claimId: `${ids.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
              kind: "effect",
              effectId: ids.effectId
            }
          ],
          reasonCode: `opening:${checkpoint.id}:producer_available`,
          producerId: producer.actorId,
          objectName: checkpoint.requiredObject
        });
      } else {
        const builder = owned(observation)
          .filter(isAvailableBuilder)
          .filter((actor) => !reservedActorIds.has(actor.actorId))
          .find((actor) =>
            catalog.entries.some(
              (entry) =>
                entry.sourceObjectName === actor.objectName && entry.constructs.includes(checkpoint.requiredObject)
            )
          );
        if (builder?.logicalPosition.status === "known") {
          const position = selectConstructionPosition(
            observation,
            builder,
            state.scheduler.decisionSequence,
            ordinal,
            selectedConstructionTileKeys,
            catalog.entries.find((entry) => entry.sourceObjectName === checkpoint.requiredObject)?.constructionProfile
              ?.footprintRadiusTiles ?? 0
          );
          if (!position) continue;
          const ids = nextIds(state, checkpoint.id, ordinal++);
          intents.push({
            ...ids,
            kind: "construct",
            planId: state.opening.plan.planId,
            demandId,
            lane: checkpoint.id === "bootstrap-worker" ? "essential_economy" : "supply_production",
            proposedTick: observation.tick,
            urgencyClass: checkpoint.id === "bootstrap-worker" ? 0 : 2,
            utility: checkpoint.id === "bootstrap-worker" ? 950 : 700,
            preconditions: [{ kind: "actor_exists", actorId: builder.actorId }],
            claims: [
              {
                claimId: `${ids.claimId}:builder` as AiIntentV1["claims"][number]["claimId"],
                kind: "actor",
                actorId: builder.actorId
              },
              { claimId: ids.claimId, kind: "site", siteKey: `opening:${checkpoint.id}:${position.x}:${position.y}` },
              {
                claimId: `${ids.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
                kind: "effect",
                effectId: ids.effectId
              }
            ],
            reasonCode: `opening:${checkpoint.id}:builder_fallback`,
            builderIds: [builder.actorId],
            objectName: checkpoint.requiredObject,
            logicalPosition: position,
            siteKey: `opening:${checkpoint.id}:${position.x}:${position.y}`
          });
        }
      }
    }

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
    const constrainedResource = observation.resources
      .filter((resource) => sourceResourceTypes.has(resource.resourceType))
      .sort(
        (left, right) => left.stockpile - right.stockpile || left.resourceType.localeCompare(right.resourceType)
      )[0]?.resourceType;
    const gatherSource = gatherSources.find(
      (actor) =>
        actor.resourceState.status === "known" && actor.resourceState.value.resourceType === constrainedResource
    );
    if (idleWorkers.length > 0 && gatherSource?.resourceState.status === "known" && constrainedResource) {
      const capacity =
        gatherSource.resourceState.value.serviceCapacity.status === "known"
          ? gatherSource.resourceState.value.serviceCapacity.value
          : 1;
      const selectedWorkers = idleWorkers.slice(0, Math.max(1, Math.min(4, capacity)));
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
        reasonCode: `economy:idle_workers:${selectedWorkers.length}:${constrainedResource}`,
        actorIds: selectedWorkers.map((worker) => worker.actorId),
        resourceType: constrainedResource,
        sourceActorId: gatherSource.actorId
      });
    }
    const housing = self.reduce(
      (total, actor) => total + (actor.housingCapacity.status === "known" ? actor.housingCapacity.value : 0),
      0
    );
    const used = self.reduce(
      (total, actor) => total + (actor.housingCost.status === "known" ? actor.housingCost.value : 0),
      0
    );
    const freeSupply = housing - used;
    const housingEntries = catalog.entries
      .filter((entry) => (entry.housingCapacity ?? 0) > 0)
      .sort((a, b) => a.sourceObjectName.localeCompare(b.sourceObjectName));
    const neededHousing =
      freeSupply < budget.supplyBuffer
        ? Math.ceil((budget.supplyBuffer - freeSupply) / Math.max(1, housingEntries[0]?.housingCapacity ?? 1))
        : 0;
    const openingComplete = activeCheckpointId === undefined;
    if (openingComplete && neededHousing > 0 && housingEntries[0]) {
      const housingObject = housingEntries[0].sourceObjectName;
      demands.push({
        demandId: "demand:supply:buffer" as AiDemandV1["demandId"],
        purpose: "supply_buffer",
        capabilityOrRole: "housing",
        unit: "population",
        desired: used + budget.supplyBuffer,
        satisfiedActorIds: self
          .filter((actor) => actor.housingCapacity.status === "known" && actor.housingCapacity.value > 0)
          .map((actor) => actor.actorId),
        queuedIds: [],
        constructingIds: [],
        acceptedNotObservedEffectIds: [],
        preferredObjectNames: [housingObject],
        resourceObligations: {}
      });
      const builders = self
        .filter(isAvailableBuilder)
        .filter((actor) => !reservedActorIds.has(actor.actorId))
        .filter((actor) =>
          catalog.entries.some(
            (entry) => entry.sourceObjectName === actor.objectName && entry.constructs.includes(housingObject)
          )
        );
      if (builders.length > 0) {
        for (let index = 0; index < Math.min(neededHousing, builders.length); index += 1) {
          const builder = builders[index];
          if (!builder || builder.logicalPosition.status !== "known") continue;
          const position = selectConstructionPosition(
            observation,
            builder,
            state.scheduler.decisionSequence,
            ordinal + index,
            selectedConstructionTileKeys,
            housingEntries[0].constructionProfile?.footprintRadiusTiles ?? 0
          );
          if (!position) continue;
          const ids = nextIds(state, "supply", ordinal++);
          intents.push({
            ...ids,
            kind: "construct",
            planId: state.opening.plan.planId,
            demandId: "demand:supply:buffer" as AiDemandV1["demandId"],
            lane: "supply_production",
            proposedTick: observation.tick,
            urgencyClass: 1,
            utility: 850,
            preconditions: [{ kind: "actor_exists", actorId: builder.actorId }],
            claims: [
              {
                claimId: `${ids.claimId}:builder` as AiIntentV1["claims"][number]["claimId"],
                kind: "actor",
                actorId: builder.actorId
              },
              { claimId: ids.claimId, kind: "site", siteKey: `supply:${housingObject}:${position.x}:${position.y}` },
              {
                claimId: `${ids.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
                kind: "effect",
                effectId: ids.effectId
              }
            ],
            reasonCode: `supply_buffer:${state.opening.archetypeId}:deficit=${budget.supplyBuffer - freeSupply}`,
            builderIds: [builder.actorId],
            objectName: housingObject,
            logicalPosition: position,
            siteKey: `supply:${housingObject}:${position.x}:${position.y}`
          });
        }
      }
    }

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
    const acceptedFoodSourceEffectIds = state.reservations
      .map((reservation) => reservation.subjectKey)
      .filter(
        (subjectKey): subjectKey is string => subjectKey?.startsWith("effect:food-capacity:Field:effect:") === true
      )
      .map((subjectKey) => subjectKey.slice("effect:".length) as AiIntentV1["effectId"])
      .sort();
    const foodStockpile =
      observation.resources.find((resource) => resource.resourceType === ResourceType.Food)?.stockpile ?? 0;
    const foodCapableWorkerCount = self.filter((actor) =>
      catalog.entries.some(
        (entry) => entry.sourceObjectName === actor.objectName && entry.gathers.includes(ResourceType.Food)
      )
    ).length;
    const desiredFoodSources =
      openingComplete && foodSourceEntry
        ? Math.min(foodStockpile < 600 ? 6 : 2, Math.max(1, foodCapableWorkerCount))
        : 0;
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
      if (committedFoodSources < desiredFoodSources) {
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
      // A returning worker is still part of a renewable-food labor cycle even
      // though its transient target is the drop-off. Account for it against a
      // stable unclaimed Field so another decision does not overstaff the source.
      const returningWorkerCount = self.filter((actor) => {
        const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
        return order?.orderType === OrderType.ReturnResources;
      }).length;
      readyFoodSources
        .filter((source) => !staffedFoodSourceIds.has(source.actorId))
        .slice(0, returningWorkerCount)
        .forEach((source) => staffedFoodSourceIds.add(source.actorId));
      const unstaffedFoodSource = readyFoodSources.find((source) => !staffedFoodSourceIds.has(source.actorId));
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
                (order.targetActorId === null || !readyFoodSources.some((source) => source.actorId === order.targetActorId)))
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
            utility: 870,
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

    const military = self.filter(
      (actor) =>
        actor.housingCost.status === "known" &&
        actor.housingCost.value > 0 &&
        catalog.entries.some(
          (entry) =>
            entry.sourceObjectName === actor.objectName &&
            isMilitaryCatalogEntry(entry) &&
            entry.movementDomains.includes("ground")
        )
    );
    const militaryProducts = new Set(
      catalog.entries
        .filter((entry) => isMilitaryCatalogEntry(entry) && entry.movementDomains.includes("ground"))
        .map((entry) => entry.sourceObjectName)
    );
    const queuedMilitary = queuedProduction(observation, militaryProducts);
    const targetMilitary = openingComplete ? 12 : budget.firstForce;
    const rawAcceptedMilitaryEffectIds = state.reservations
      .map((reservation) => reservation.subjectKey)
      .filter((subjectKey): subjectKey is string => subjectKey?.startsWith("effect:composition:effect:") === true)
      .map((subjectKey) => subjectKey.slice("effect:".length) as AiIntentV1["effectId"])
      .sort();
    // The opening force is enough to survive and scout. A completed opening commits
    // to a dated 12-unit transition so the land loop can launch and reinforce rather
    // than permanently hovering below the six-unit mission threshold.
    // Queue observation and accepted leases can briefly describe the same command.
    // Clamp accepted-not-observed identities to the genuinely unobserved remainder
    // so the demand ledger stays disjoint and does not report false overproduction.
    const acceptedMilitaryEffectIds = rawAcceptedMilitaryEffectIds.slice(
      0,
      Math.max(0, targetMilitary - military.length - queuedMilitary.length)
    );
    demands.push({
      demandId: "demand:composition:first-squad" as AiDemandV1["demandId"],
      purpose: openingComplete ? "dated_land_pressure" : "opening_force",
      capabilityOrRole: "ground_combat_composition",
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
      .filter((actor) => producerMilitaryProducts(actor.objectName, catalog, "ground").length > 0)
      .sort((left, right) => left.actorId.localeCompare(right.actorId));
    const primaryProducerObjectName = militaryProducers[0]?.objectName;
    const desiredProducerCount = openingComplete && targetMilitary >= 12 ? 2 : 1;
    if (primaryProducerObjectName) {
      const constructingProducers = self
        .filter((actor) => actor.objectName === primaryProducerObjectName && !isFinishedActor(actor))
        .sort((left, right) => left.actorId.localeCompare(right.actorId));
      const acceptedCapacityEffectIds = state.reservations
        .map((reservation) => reservation.subjectKey)
        .filter(
          (subjectKey): subjectKey is string =>
            subjectKey?.startsWith(`effect:capacity:${primaryProducerObjectName}:effect:`) === true
        )
        .map((subjectKey) => subjectKey.slice("effect:".length) as AiIntentV1["effectId"])
        .sort();
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
      if (openingComplete && committedCapacity < desiredProducerCount) {
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
                {
                  claimId: `${next.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
                  kind: "effect",
                  effectId: next.effectId
                }
              ],
              reasonCode: `capacity:dated_target=${targetMilitary}:ready=${militaryProducers.length}:committed=${committedCapacity}/${desiredProducerCount}`,
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
    if (projectedCount < targetMilitary) {
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
        const candidate = [...producerMilitaryProducts(producer.objectName, catalog, "ground")]
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
            const leftDeficit =
              leftRole === "ranged"
                ? desiredRanged - roleCounts.ranged
                : targetMilitary - desiredRanged - roleCounts.frontline;
            const rightDeficit =
              rightRole === "ranged"
                ? desiredRanged - roleCounts.ranged
                : targetMilitary - desiredRanged - roleCounts.frontline;
            const totalCost = (objectName: ObjectNames) =>
              Object.values(
                catalog.entries.find((entry) => entry.sourceObjectName === objectName)?.constructionProfile
                  ?.resourceCost ?? {}
              ).reduce<number>((total, amount) => total + (amount ?? 0), 0);
            return rightDeficit - leftDeficit || totalCost(left) - totalCost(right) || left.localeCompare(right);
          })[0];
        if (!candidate) continue;
        const next = nextIds(state, "composition", ordinal++);
        const resourceCost =
          catalog.entries.find((entry) => entry.sourceObjectName === candidate)?.constructionProfile?.resourceCost ?? {};
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
          reasonCode: `composition:${state.opening.archetypeId}:${roleFor(candidate, catalog)}:frontline=${roleCounts.frontline}:ranged=${roleCounts.ranged}:projected=${projectedCount + intents.filter((intent) => intent.kind === "produce" && intent.demandId === "demand:composition:first-squad").length}/${targetMilitary}`,
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
      reasons: [
        `opening_step:${current ?? "transition"}`,
        `archetype:${state.opening.archetypeId}`,
        `supply_free:${freeSupply}/${budget.supplyBuffer}`,
        `military:${military.length}/${targetMilitary}`
      ],
      statePatch: {
        opening: {
          ...state.opening,
          plan: { ...state.opening.plan, currentStepId: current, steps, lifecycle: current ? "active" : "completed" }
        },
        economyProduction: {
          demands,
          forecasts: Object.values(ResourceType)
            .sort()
            .map((resourceType) => ({
              resourceType,
              horizonTick: observation.tick + 600,
              amount: 0,
              confidencePermille: 0
            })),
          adaptation: state.economyProduction.adaptation
        }
      }
    };
  }
}
