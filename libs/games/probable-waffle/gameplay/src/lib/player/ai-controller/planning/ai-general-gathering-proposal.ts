import { ObjectNames, OrderType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import { nextIds } from "./ai-macro-effect-identity";
import { aiResourceForecastDeficit, selectAiForecastEntry } from "./ai-resource-forecast";
import { rememberAiGatheringSelection } from "./ai-gathering-selection-observation";
import { selectAiSurplusLaborTransfer } from "./ai-surplus-labor-transfer";
import { readAiResourceInputRead } from "./ai-resource-input-observation";

/** Proposes a non-Field gathering assignment from aggregate forecasts or the native stockpile fallback. */
export function proposeAiGeneralGathering(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  catalog: AiCapabilityCatalogV1,
  self: readonly AiObservationV1["actors"][number][],
  openingIntents: readonly AiIntentV1[],
  reservedActorIds: ReadonlySet<string>,
  ordinal: number
): AiIntentV1 | null {
  const openingBuilderIds = new Set(
    openingIntents.flatMap((intent) => {
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
  const selectedForecast = selectAiForecastEntry(observation, state.economyProduction.forecasts, sourceResourceTypes);
  const constrainedResource =
    selectedForecast?.resourceType ??
    observation.resources
      .filter((resource) => sourceResourceTypes.has(resource.resourceType))
      .sort((left, right) => left.stockpile - right.stockpile || left.resourceType.localeCompare(right.resourceType))[0]
      ?.resourceType;
  const activeGatherersBySource = new Map<string, number>();
  for (const actor of self) {
    const order = actor.activeOrder?.status === "known" ? actor.activeOrder.value : null;
    if (order?.orderType !== OrderType.Gather || !order.targetActorId) continue;
    activeGatherersBySource.set(order.targetActorId, (activeGatherersBySource.get(order.targetActorId) ?? 0) + 1);
  }
  const gatherCandidate = gatherSources
    .filter(
      (actor) => actor.resourceState.status === "known" && actor.resourceState.value.resourceType === constrainedResource
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
  if (gatherSource?.resourceState.status !== "known" || !constrainedResource) return null;
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
  if (selectedWorkers.length === 0) return null;
  const ids = nextIds(state, "gather", ordinal);
  const intent = {
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
  } satisfies AiIntentV1;
  rememberAiGatheringSelection(intent, () => ({ intentId: intent.intentId, effectId: intent.effectId,
    playerNumber: observation.playerNumber, observationGeneration: observation.generation,
    catalogGeneration: catalog.generation, tick: observation.tick, resourceType: constrainedResource,
    branch: selectedForecast ? "forecast" : "stockpile_fallback",
    forecast: selectedForecast ? { amount: selectedForecast.amount, horizonTick: selectedForecast.horizonTick,
      confidencePermille: selectedForecast.confidencePermille } : null,
    ledger: observation.resources.find((entry) => entry.resourceType === constrainedResource) ?? null,
    plannerDeficit: selectedForecast ? aiResourceForecastDeficit(observation, selectedForecast) : null,
    resourceInputRead: readAiResourceInputRead(observation) }));
  return intent;
}
