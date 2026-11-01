import type { AiBrainState } from "../contracts/ai-brain-state";
import type { AiCapabilityCatalog } from "../contracts/ai-capability-catalog";
import type { AiObservation } from "../contracts/ai-observation";
import type { AiDemand } from "../contracts/ai-plan-contracts";
import { hasCredibleAiEconomyThreat } from "./ai-economy-policy";
import { plannedAiForceSize } from "./ai-force-capacity";
import { WORKER_RECOVERY_FLOOR } from "./ai-food-economy-proposal";
import { queuedProduction } from "./ai-macro-observation";
import { isMilitaryCatalogEntry } from "./ai-military-catalog";
import { projectAiResourceForecasts } from "./ai-resource-forecast";
import { observeAiProductionTransition } from "./ai-production-transition";

/** Captures the compatible force and food pressure before proposal ordering begins. */
export function observeAiMilitaryForce(args: {
  readonly observation: AiObservation;
  readonly state: AiBrainState;
  readonly catalog: AiCapabilityCatalog;
  readonly self: readonly AiObservation["actors"][number][];
  readonly openingComplete: boolean;
  readonly firstForce: number;
}) {
  const { observation, state, catalog, self, openingComplete, firstForce } = args;
  const pressureDomain: "ground" | "air" =
    openingComplete && state.strategy.assessment?.routeDomain === "air" ? "air" : "ground";
  let military = self.filter(
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
  let queuedMilitary = queuedProduction(observation, militaryProducts);
  const currentWorkerCount = self.filter((actor) =>
    catalog.entries.some((entry) => entry.sourceObjectName === actor.objectName && entry.gathers.length > 0)
  ).length;
  const workforceRecoveryOwnsFood = currentWorkerCount < WORKER_RECOVERY_FLOOR && military.length > 0;
  const standingTarget = plannedAiForceSize(
    openingComplete,
    pressureDomain,
    state.strategy.assessment,
    military.length,
    hasCredibleAiEconomyThreat(observation) ? firstForce : null
  );
  const transition = observeAiProductionTransition({
    observation,
    state,
    catalog,
    domain: pressureDomain,
    readyForce: military.length,
    queuedForce: queuedMilitary.length,
    openingComplete: openingComplete && !workforceRecoveryOwnsFood
  });
  if (transition?.status === "committed") {
    military = military.filter((actor) => actor.objectName === transition.productObjectName);
    queuedMilitary = queuedMilitary.filter((item) => item.objectName === transition.productObjectName);
  }
  const held =
    transition &&
    ["abandoned", "expired"].includes(transition.status) &&
    (state.strategy.assessment?.targetActorId === transition.targetActorId ||
      !state.strategy.assessment ||
      ["scout", "recover"].includes(state.strategy.assessment.choice)) &&
    !hasCredibleAiEconomyThreat(observation);
  const targetMilitary =
    held || (transition?.status === "committed" && observation.tick < transition.beginsTick)
      ? military.length + queuedMilitary.length
      : transition?.status === "committed"
        ? transition.desiredForce
        : standingTarget;
  const capacityTargetMilitary = transition?.status === "committed" ? transition.desiredForce : targetMilitary;
  const compositionPrefix = pressureDomain === "air" ? "composition-air" : "composition";
  const pressureForecast = projectAiResourceForecasts(
    observation,
    [
      {
        demandId: "demand:composition:first-squad" as AiDemand["demandId"],
        purpose: "military_resource_forecast",
        capabilityOrRole: `${pressureDomain}_combat_composition`,
        unit: "actor_count",
        desired: capacityTargetMilitary,
        satisfiedActorIds: military.map((actor) => actor.actorId),
        queuedIds: queuedMilitary.map((item) => item.itemId),
        constructingIds: [],
        acceptedNotObservedEffectIds: [],
        preferredObjectNames:
          transition?.status === "committed" ? [transition.productObjectName] : [...militaryProducts].sort(),
        resourceObligations: {}
      }
    ],
    catalog
  );
  return {
    pressureDomain,
    military,
    militaryProducts,
    queuedMilitary,
    workforceRecoveryOwnsFood,
    targetMilitary,
    capacityTargetMilitary,
    transition,
    compositionPrefix,
    pressureForecast
  };
}
