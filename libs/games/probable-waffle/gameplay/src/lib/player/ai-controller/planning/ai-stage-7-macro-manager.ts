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
  selectedTileKeys: Set<string>
) {
  if (builder.logicalPosition.status !== "known") return undefined;
  const origin = builder.logicalPosition.value;
  const candidates = (observation.map?.constructionCells ?? [])
    .filter((cell) => cell.groundPassable && !cell.observedBlocked && !selectedTileKeys.has(cell.tileKey))
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
  selectedTileKeys.add(selected.tileKey);
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
            selectedConstructionTileKeys
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
            selectedConstructionTileKeys
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

    const military = self.filter(
      (actor) =>
        actor.housingCost.status === "known" &&
        actor.housingCost.value > 0 &&
        !catalog.entries.some(
          (entry) =>
            entry.sourceObjectName === actor.objectName && (entry.constructs.length > 0 || entry.gathers.length > 0)
        )
    );
    const targetMilitary = budget.firstForce;
    if (military.length < targetMilitary) {
      const producer = self.find(
        (actor) =>
          catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.produces.length > 0) &&
          queueFree(actor)
      );
      const available = producer
        ? (catalog.entries.find((entry) => entry.sourceObjectName === producer.objectName)?.produces ?? []).filter(
            (objectName) => {
              const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === objectName);
              return entry !== undefined && entry.gathers.length === 0 && entry.targetDomains.length > 0;
            }
          )
        : [];
      const roleCounts = { frontline: 0, ranged: 0, support: 0 };
      for (const actor of military) roleCounts[roleFor(actor.objectName, catalog)] += 1;
      const desiredRanged = Math.ceil((targetMilitary * budget.rangedPermille) / 1000);
      const candidate = [...available].sort((left, right) => {
        const leftDeficit =
          roleFor(left, catalog) === "ranged"
            ? desiredRanged - roleCounts.ranged
            : targetMilitary - desiredRanged - roleCounts.frontline;
        const rightDeficit =
          roleFor(right, catalog) === "ranged"
            ? desiredRanged - roleCounts.ranged
            : targetMilitary - desiredRanged - roleCounts.frontline;
        return rightDeficit - leftDeficit || left.localeCompare(right);
      })[0];
      if (producer && candidate) {
        const ids = nextIds(state, "composition", ordinal++);
        intents.push({
          ...ids,
          kind: "produce",
          planId: state.opening.plan.planId,
          demandId: "demand:composition:first-squad" as AiDemandV1["demandId"],
          lane: "supply_production",
          proposedTick: observation.tick,
          urgencyClass: 3,
          utility: 600,
          preconditions: [{ kind: "actor_exists", actorId: producer.actorId }],
          claims: [
            { claimId: ids.claimId, kind: "production_slot", producerId: producer.actorId, slot: 0 },
            {
              claimId: `${ids.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
              kind: "effect",
              effectId: ids.effectId
            }
          ],
          reasonCode: `composition:${state.opening.archetypeId}:${roleFor(candidate, catalog)}:frontline=${roleCounts.frontline}:ranged=${roleCounts.ranged}`,
          producerId: producer.actorId,
          objectName: candidate
        });
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
