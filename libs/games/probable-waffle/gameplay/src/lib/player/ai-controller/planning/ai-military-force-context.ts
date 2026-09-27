import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import { hasCredibleAiEconomyThreat } from "./ai-economy-policy";
import { plannedAiForceSize } from "./ai-force-capacity";
import { WORKER_RECOVERY_FLOOR } from "./ai-food-economy-proposal";
import { queuedProduction } from "./ai-macro-observation";
import { isMilitaryCatalogEntry } from "./ai-military-catalog";
import { projectAiResourceForecasts } from "./ai-resource-forecast";

/** Captures the compatible force and food pressure before proposal ordering begins. */
export function observeAiMilitaryForce(args: {
  readonly observation: AiObservationV1;
  readonly state: AiBrainStateV1;
  readonly catalog: AiCapabilityCatalogV1;
  readonly self: readonly AiObservationV1["actors"][number][];
  readonly openingComplete: boolean;
  readonly firstForce: number;
}) {
  const { observation, state, catalog, self, openingComplete, firstForce } = args;
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
    hasCredibleAiEconomyThreat(observation) ? firstForce : null
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
  return {
    pressureDomain,
    military,
    militaryProducts,
    queuedMilitary,
    workforceRecoveryOwnsFood,
    targetMilitary,
    compositionPrefix,
    pressureForecast
  };
}
