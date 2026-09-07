import { FactionType, ObjectNames, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
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

function actorCount(observation: AiObservationV1, objectName: ObjectNames): number {
  return owned(observation).filter((actor) => actor.objectName === objectName).length;
}

function queueFree(actor: AiObservationV1["actors"][number]): boolean {
  return actor.queue.status !== "known" || actor.queue.value.occupied < Math.min(2, actor.queue.value.capacity);
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
      return { managerId: this.managerId, lane: "essential_economy", evaluated: false, intents: [], reasons: ["catalog_not_ready"] };
    }

    const checkpoints = factionOpenings[observation.faction];
    const demands: AiDemandV1[] = [];
    const intents: AiIntentV1[] = [];
    const steps: AiPlanStepV1[] = [];
    let ordinal = 0;

    for (const checkpoint of checkpoints) {
      const count = actorCount(observation, checkpoint.requiredObject);
      const fulfilled = count >= checkpoint.desired;
      const demandId = `demand:opening:${checkpoint.id}` as AiDemandV1["demandId"];
      demands.push({
        demandId,
        purpose: checkpoint.purpose,
        capabilityOrRole: checkpoint.requiredObject,
        unit: "actor_count",
        desired: checkpoint.desired,
        satisfiedActorIds: owned(observation).filter((actor) => actor.objectName === checkpoint.requiredObject).map((actor) => actor.actorId),
        queuedIds: [],
        constructingIds: [],
        acceptedNotObservedEffectIds: [],
        preferredObjectNames: [checkpoint.requiredObject],
        resourceObligations: {}
      });
      steps.push({
        stepId: `step:opening:${checkpoint.id}` as AiPlanStepV1["stepId"],
        state: fulfilled ? "completed" : "pending",
        demandIds: [demandId],
        deadline: null,
        completedTick: fulfilled ? observation.tick : null
      });
      if (fulfilled) continue;

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
            { claimId: `${ids.claimId}:effect` as AiIntentV1["claims"][number]["claimId"], kind: "effect", effectId: ids.effectId }
          ],
          reasonCode: `opening:${checkpoint.id}:producer_available`,
          producerId: producer.actorId,
          objectName: checkpoint.requiredObject
        });
      } else {
        const builder = owned(observation).find((actor) =>
          catalog.entries.some(
            (entry) => entry.sourceObjectName === actor.objectName && entry.constructs.includes(checkpoint.requiredObject)
          )
        );
        if (builder?.logicalPosition.status === "known") {
          const ids = nextIds(state, checkpoint.id, ordinal++);
          const position = { ...builder.logicalPosition.value, x: builder.logicalPosition.value.x + ordinal + 1, y: builder.logicalPosition.value.y + 1 };
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
              { claimId: ids.claimId, kind: "site", siteKey: `opening:${checkpoint.id}:${position.x}:${position.y}` },
              { claimId: `${ids.claimId}:effect` as AiIntentV1["claims"][number]["claimId"], kind: "effect", effectId: ids.effectId }
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
    const housing = self.reduce((total, actor) => total + (actor.housingCapacity.status === "known" ? actor.housingCapacity.value : 0), 0);
    const used = self.reduce((total, actor) => total + (actor.housingCost.status === "known" ? actor.housingCost.value : 0), 0);
    const freeSupply = housing - used;
    const housingEntries = catalog.entries.filter((entry) => (entry.housingCapacity ?? 0) > 0).sort((a, b) => a.sourceObjectName.localeCompare(b.sourceObjectName));
    const neededHousing = freeSupply < 3 ? Math.ceil((3 - freeSupply) / Math.max(1, housingEntries[0]?.housingCapacity ?? 1)) : 0;
    if (neededHousing > 0 && housingEntries[0]) {
      const housingObject = housingEntries[0].sourceObjectName;
      demands.push({
        demandId: "demand:supply:buffer" as AiDemandV1["demandId"], purpose: "supply_buffer", capabilityOrRole: "housing", unit: "population", desired: used + 3,
        satisfiedActorIds: self.filter((actor) => actor.housingCapacity.status === "known" && actor.housingCapacity.value > 0).map((actor) => actor.actorId), queuedIds: [], constructingIds: [], acceptedNotObservedEffectIds: [], preferredObjectNames: [housingObject], resourceObligations: {}
      });
      const builder = self.find((actor) => catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.constructs.includes(housingObject)));
      if (builder && builder.logicalPosition.status === "known") {
        for (let index = 0; index < neededHousing; index += 1) {
          const ids = nextIds(state, "supply", ordinal++);
          const position = { ...builder.logicalPosition.value, x: builder.logicalPosition.value.x + index + 2, y: builder.logicalPosition.value.y + 2 };
          intents.push({
            ...ids, kind: "construct", planId: state.opening.plan.planId, demandId: "demand:supply:buffer" as AiDemandV1["demandId"], lane: "supply_production", proposedTick: observation.tick, urgencyClass: 1, utility: 850,
            preconditions: [{ kind: "actor_exists", actorId: builder.actorId }],
            claims: [{ claimId: ids.claimId, kind: "site", siteKey: `supply:${housingObject}:${position.x}:${position.y}` }, { claimId: `${ids.claimId}:effect` as AiIntentV1["claims"][number]["claimId"], kind: "effect", effectId: ids.effectId }],
            reasonCode: `supply_buffer:deficit=${3 - freeSupply}`, builderIds: [builder.actorId], objectName: housingObject, logicalPosition: position, siteKey: `supply:${housingObject}:${position.x}:${position.y}`
          });
        }
      }
    }

    const military = self.filter((actor) => actor.housingCost.status === "known" && actor.housingCost.value > 0 && !catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.constructs.length > 0));
    const targetMilitary = 6;
    if (military.length < targetMilitary) {
      const producer = self.find((actor) => catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.produces.length > 0) && queueFree(actor));
      const available = producer ? catalog.entries.find((entry) => entry.sourceObjectName === producer.objectName)?.produces ?? [] : [];
      const roleCounts = { frontline: 0, ranged: 0, support: 0 };
      for (const actor of military) roleCounts[roleFor(actor.objectName, catalog)] += 1;
      const desiredRanged = Math.ceil(targetMilitary * 0.4);
      const candidate = [...available].sort((left, right) => {
        const leftDeficit = roleFor(left, catalog) === "ranged" ? desiredRanged - roleCounts.ranged : targetMilitary - desiredRanged - roleCounts.frontline;
        const rightDeficit = roleFor(right, catalog) === "ranged" ? desiredRanged - roleCounts.ranged : targetMilitary - desiredRanged - roleCounts.frontline;
        return rightDeficit - leftDeficit || left.localeCompare(right);
      })[0];
      if (producer && candidate) {
        const ids = nextIds(state, "composition", ordinal++);
        intents.push({
          ...ids, kind: "produce", planId: state.opening.plan.planId, demandId: "demand:composition:first-squad" as AiDemandV1["demandId"], lane: "supply_production", proposedTick: observation.tick, urgencyClass: 3, utility: 600,
          preconditions: [{ kind: "actor_exists", actorId: producer.actorId }],
          claims: [{ claimId: ids.claimId, kind: "production_slot", producerId: producer.actorId, slot: 0 }, { claimId: `${ids.claimId}:effect` as AiIntentV1["claims"][number]["claimId"], kind: "effect", effectId: ids.effectId }],
          reasonCode: `composition:${roleFor(candidate, catalog)}:frontline=${roleCounts.frontline}:ranged=${roleCounts.ranged}`, producerId: producer.actorId, objectName: candidate
        });
      }
    }

    const current = steps.find((step) => step.state !== "completed")?.stepId ?? null;
    return {
      managerId: this.managerId, lane: "supply_production", evaluated: true, intents, reasons: [`opening_step:${current ?? "transition"}`, `supply_free:${freeSupply}`, `military:${military.length}/${targetMilitary}`],
      statePatch: {
        opening: { ...state.opening, plan: { ...state.opening.plan, currentStepId: current, steps, lifecycle: current ? "active" : "completed" } },
        economyProduction: { demands, forecasts: Object.values(ResourceType).sort().map((resourceType) => ({ resourceType, horizonTick: observation.tick + 600, amount: 0, confidencePermille: 0 })) }
      }
    };
  }
}
