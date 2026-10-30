import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1, AiPlanStepV1 } from "../contracts/ai-plan-contracts";
import { createAiResourceCostClaims } from "./ai-resource-cost-claims";
import { selectConstructionPosition } from "./ai-construction-site-selector";
import { nextIds } from "./ai-macro-effect-identity";
import {
  checkpointActors,
  hasAssignedBuilder,
  isAvailableBuilder,
  isFinishedActor,
  owned,
  queuedObjectIds,
  queueFree
} from "./ai-macro-observation";
import { factionOpenings, OPENING_SUPPLY_BUFFER } from "./ai-opening-catalog";
import { calculateAiHousingDemand } from "./ai-housing-demand";
import { canAffordAiEconomyCost } from "./ai-economy-policy";
import { isSafeAiGathererRetask } from "./ai-gatherer-retask";

/** Two workers unlock renewable food without exhausting the common 200-food start. */
const MINIMUM_OPENING_WORKERS = 2;

function captureOpeningStatus(observation: AiObservationV1, state: AiBrainStateV1, catalog: AiCapabilityCatalogV1) {
  return factionOpenings[observation.faction].map((checkpoint) => {
    const matchingActors = checkpointActors(observation, checkpoint, catalog);
    const previousStep = state.opening.plan.steps.find((step) => step.stepId === `step:opening:${checkpoint.id}`);
    const housing =
      checkpoint.id === "supply-safety"
        ? calculateAiHousingDemand(observation, catalog, checkpoint.requiredObject, OPENING_SUPPLY_BUFFER, [])
        : undefined;
    const supplySatisfied =
      housing !== undefined && housing.freeSupply >= housing.queuedPopulation + OPENING_SUPPLY_BUFFER;
    const desired =
      checkpoint.id === "bootstrap-worker"
        ? MINIMUM_OPENING_WORKERS
        : checkpoint.id === "supply-safety" && (supplySatisfied || previousStep?.state === "completed")
          ? 0
          : checkpoint.desired;
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
}

type OpeningStatus = ReturnType<typeof captureOpeningStatus>[number];

function proposeOpeningCheckpointIntent(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  catalog: AiCapabilityCatalogV1,
  status: OpeningStatus,
  activeCheckpointId: string | undefined,
  reservedActorIds: ReadonlySet<string>,
  selectedConstructionTileKeys: Set<string>,
  ordinal: number
): AiIntentV1 | null {
  const { checkpoint, desired, satisfiedActors, constructingActors, queuedIds, fulfilled } = status;
  if (fulfilled || checkpoint.id !== activeCheckpointId || satisfiedActors.length + queuedIds.length >= desired)
    return null;
  const demandId = `demand:opening:${checkpoint.id}` as AiDemandV1["demandId"];
  const stalledSite = [...constructingActors]
    .find((site) => !hasAssignedBuilder(observation, site.actorId));
  if (stalledSite) {
    const builder = owned(observation)
      .filter(isAvailableBuilder)
      .filter((actor) => !reservedActorIds.has(actor.actorId))
      .find((actor) =>
        catalog.entries.some(
          (entry) => entry.sourceObjectName === actor.objectName && entry.constructs.includes(checkpoint.requiredObject)
        )
      );
    if (!builder) return null;
    const ids = nextIds(state, `resume-construction:${stalledSite.actorId}`, ordinal);
    return {
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
    };
  }
  if (constructingActors.length > 0) return null;

  const producer = owned(observation).find((actor) => {
    const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === actor.objectName);
    return entry?.produces.includes(checkpoint.requiredObject) && queueFree(actor);
  });
  if (producer) {
    const ids = nextIds(state, checkpoint.id, ordinal);
    return {
      ...ids,
      kind: "produce",
      spendingCategory:
        checkpoint.id === "bootstrap-worker" ? "survival" : checkpoint.id === "first-producer" ? "defense" : "economy",
      planId: state.opening.plan.planId,
      demandId,
      lane: checkpoint.id === "bootstrap-worker" ? "essential_economy" : "supply_production",
      proposedTick: observation.tick,
      urgencyClass: checkpoint.id === "bootstrap-worker" ? 0 : 2,
      utility: checkpoint.id === "bootstrap-worker" ? 950 : 700,
      preconditions: [{ kind: "actor_exists", actorId: producer.actorId }],
      claims: [
        { claimId: ids.claimId, kind: "production_slot", producerId: producer.actorId, slot: 0 },
        ...createAiResourceCostClaims(
          ids.claimId,
          catalog.entries.find((entry) => entry.sourceObjectName === checkpoint.requiredObject)?.constructionProfile
            ?.resourceCost ?? {}
        ),
        {
          claimId: `${ids.claimId}:effect` as AiIntentV1["claims"][number]["claimId"],
          kind: "effect",
          effectId: ids.effectId
        }
      ],
      reasonCode: `opening:${checkpoint.id}:producer_available`,
      producerId: producer.actorId,
      objectName: checkpoint.requiredObject
    };
  }

  const constructionCost =
    catalog.entries.find((entry) => entry.sourceObjectName === checkpoint.requiredObject)?.constructionProfile
      ?.resourceCost ?? {};
  if (!canAffordAiEconomyCost(observation, constructionCost)) return null;
  const builder = owned(observation)
    .filter(isAvailableBuilder)
    .filter((actor) => !reservedActorIds.has(actor.actorId))
    .find((actor) =>
      catalog.entries.some(
        (entry) => entry.sourceObjectName === actor.objectName && entry.constructs.includes(checkpoint.requiredObject)
      )
    );
  if (builder?.logicalPosition.status !== "known") return null;
  const position = selectConstructionPosition(
    observation,
    builder,
    state.scheduler.decisionSequence,
    ordinal,
    selectedConstructionTileKeys,
    catalog.entries.find((entry) => entry.sourceObjectName === checkpoint.requiredObject)?.constructionProfile
      ?.footprintRadiusTiles ?? 0
  );
  if (!position) return null;
  const ids = nextIds(state, checkpoint.id, ordinal);
  return {
    ...ids,
    kind: "construct",
    spendingCategory: checkpoint.id === "first-producer" ? "defense" : "survival",
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
      ...createAiResourceCostClaims(
        ids.claimId,
        catalog.entries.find((entry) => entry.sourceObjectName === checkpoint.requiredObject)?.constructionProfile
          ?.resourceCost ?? {}
      ),
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
  };
}

/** Produces historical opening steps and at most one current legal opening action. */
export function proposeAiOpening(observation: AiObservationV1, state: AiBrainStateV1, catalog: AiCapabilityCatalogV1) {
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
  // Applied gather leases remain durable until a replacement command is accepted. Expose only
  // unloaded, currently gathering workers to proposal owners; the arbiter still authorizes the handoff.
  for (const actorId of reservedActorIds) {
    const actorReservations = state.reservations.filter((reservation) => reservation.subjectKey === `actor:${actorId}`);
    const actor = observation.actors.find((candidate) => candidate.actorId === actorId);
    if (
      actor &&
      actorReservations.length > 0 &&
      actorReservations.every((reservation) => reservation.state.kind === "applied_spending") &&
      isSafeAiGathererRetask(actor)
    )
      reservedActorIds.delete(actorId);
  }
  let ordinal = 0;
  const checkpointStatus = captureOpeningStatus(observation, state, catalog);
  const activeCheckpointId = checkpointStatus.find(({ fulfilled }) => !fulfilled)?.checkpoint.id;
  for (const status of checkpointStatus) {
    const { checkpoint, desired, satisfiedActors, constructingActors, queuedIds, fulfilled, completedTick } = status;
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
    const intent = proposeOpeningCheckpointIntent(
      observation,
      state,
      catalog,
      status,
      activeCheckpointId,
      reservedActorIds,
      selectedConstructionTileKeys,
      ordinal
    );
    if (intent) {
      intents.push(intent);
      ordinal += 1;
    }
  }
  return {
    checkpoints,
    demands,
    intents,
    steps,
    selectedConstructionTileKeys,
    reservedActorIds,
    ordinal,
    checkpointStatus,
    activeCheckpointId
  };
}
