import type { AiBrainState } from "../../contracts/state/ai-state-contracts";
import type { AiCapabilityCatalog } from "../../contracts/observation/ai-capability-catalog";
import type { AiIntent } from "../../contracts/commands/ai-intent";
import type { AiObservation } from "../../contracts/observation/ai-observation";
import { adaptationRoleTargets, mergeAdaptationEvidence } from "./ai-adaptation-evidence";
import { counterInfrastructurePath } from "./ai-counter-infrastructure-path";
import { matchesAdaptationRole } from "./ai-adaptation-role-match";
import { queuedAdaptationRoleItemIds } from "./ai-adaptation-queued-role";
import { claimedActorIds, isAvailableBuilder, isFinishedActor } from "../production/macro/ai-macro-observation";
import { nextIds, unresolvedReservedEffectIds } from "../production/macro/ai-macro-effect-identity";
import { selectAiMilitaryCapacitySite } from "../production/capacity/ai-military-capacity-site";
import { canAffordAiEconomyCost } from "../economy/service/ai-economy-policy";
import { createAiResourceCostClaims } from "../economy/forecast/ai-resource-cost-claims";

/** Adds one missing counter dependency only while confirmed, unfilled demand still exists. */
export function proposeAiCounterInfrastructure(args: {
  observation: AiObservation;
  state: AiBrainState;
  catalog: AiCapabilityCatalog;
  self: readonly AiObservation["actors"][number][];
  reservedActorIds: ReadonlySet<string>;
  selectedConstructionTileKeys: Set<string>;
  priorIntents: readonly AiIntent[];
  ordinal: number;
}): AiIntent | null {
  const { observation, state, catalog, self, reservedActorIds, selectedConstructionTileKeys, priorIntents, ordinal } =
    args;
  const demand = state.economyProduction.demands.find((item) => item.demandId === "demand:adapt:anti_air");
  if (!demand) return null;
  const target = adaptationRoleTargets(mergeAdaptationEvidence(state, observation), state).find(
    (item) => item.role === "anti_air"
  );
  if (!target) return null;
  const readyCount = self.filter(isFinishedActor).filter((actor) => {
    const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === actor.objectName);
    return entry && matchesAdaptationRole(entry, "anti_air");
  }).length;
  const committed = state.reservations.filter(
    (reservation) => reservation.subjectKey?.startsWith("effect:effect:stage14:anti_air:") === true
  ).length;
  if (
    readyCount + queuedAdaptationRoleItemIds(observation, catalog, "anti_air").length + committed >=
    Math.min(demand.desired, target.desired)
  )
    return null;
  const path = counterInfrastructurePath(catalog, self);
  const objectName = path?.[0];
  if (
    !objectName ||
    self.some((actor) => actor.objectName === objectName) ||
    priorIntents.some((intent) => intent.kind === "construct" && intent.objectName === objectName) ||
    state.economyProduction.demands.some(
      (item) => item.preferredObjectNames.includes(objectName) && item.acceptedNotObservedEffectIds.length > 0
    ) ||
    unresolvedReservedEffectIds(state, `effect:capacity:${objectName}:effect:`).length > 0 ||
    unresolvedReservedEffectIds(state, `effect:counter-infrastructure:${objectName}:effect:`).length > 0
  )
    return null;
  const entry = catalog.entries.find((candidate) => candidate.sourceObjectName === objectName);
  if (!entry?.constructionProfile || !canAffordAiEconomyCost(observation, entry.constructionProfile.resourceCost))
    return null;
  const claimed = claimedActorIds(priorIntents);
  const builders = self
    .filter(isAvailableBuilder)
    .filter(isFinishedActor)
    .filter((actor) => !reservedActorIds.has(actor.actorId) && !claimed.has(actor.actorId))
    .filter((actor) =>
      catalog.entries.some(
        (candidate) => candidate.sourceObjectName === actor.objectName && candidate.constructs.includes(objectName)
      )
    )
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
  const selected = selectAiMilitaryCapacitySite({
    observation,
    builders,
    decisionSequence: state.scheduler.decisionSequence,
    ordinal,
    selectedTileKeys: selectedConstructionTileKeys,
    footprintRadiusTiles: entry.constructionProfile.footprintRadiusTiles,
    safePolicy: false,
    threats: []
  });
  if (!selected) return null;
  const next = nextIds(state, `counter-infrastructure:${objectName}`, ordinal);
  const siteKey = `counter-infrastructure:${objectName}:${selected.position.x}:${selected.position.y}`;
  return {
    ...next,
    kind: "construct",
    spendingCategory: "defense",
    planId: state.opening.plan.planId,
    demandId: demand.demandId,
    lane: "supply_production",
    proposedTick: observation.tick,
    urgencyClass: 2,
    utility: 760,
    preconditions: [{ kind: "actor_exists", actorId: selected.builder.actorId }],
    claims: [
      {
        claimId: `${next.claimId}:builder` as AiIntent["claims"][number]["claimId"],
        kind: "actor",
        actorId: selected.builder.actorId
      },
      { claimId: next.claimId, kind: "site", siteKey },
      ...createAiResourceCostClaims(next.claimId, entry.constructionProfile.resourceCost),
      {
        claimId: `${next.claimId}:effect` as AiIntent["claims"][number]["claimId"],
        kind: "effect",
        effectId: next.effectId
      }
    ],
    reasonCode: `counter_infrastructure:anti_air:${objectName}`,
    builderIds: [selected.builder.actorId],
    objectName,
    logicalPosition: selected.position,
    siteKey
  };
}
