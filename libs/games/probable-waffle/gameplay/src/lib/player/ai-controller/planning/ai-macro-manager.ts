import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";
import { projectAiResourceForecasts } from "./ai-resource-forecast";
import { proposeAiHousing } from "./ai-housing-proposal";
import { proposeAiFoodEconomy } from "./ai-food-economy-proposal";
import { proposeAiGeneralGathering } from "./ai-general-gathering-proposal";
import { openingBudget } from "./ai-opening-catalog";
import { proposeAiOpening } from "./ai-opening-proposal";
import { owned } from "./ai-macro-observation";
import { unresolvedReservedEffectIds } from "./ai-macro-effect-identity";
import { proposeAiMilitaryCapacity } from "./ai-military-capacity-proposal";
import { proposeAiMilitaryUnits } from "./ai-military-unit-proposal";
import { observeAiMilitaryForce } from "./ai-military-force-context";

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
    const gatheringIntent = proposeAiGeneralGathering(
      observation, state, catalog, self, intents, reservedActorIds, ordinal
    );
    if (gatheringIntent) {
      intents.push(gatheringIntent);
      ordinal += 1;
    }
    const openingComplete = activeCheckpointId === undefined;
    const workerCheckpoint = checkpointStatus.find((entry) => entry.checkpoint.id === "bootstrap-worker");
    const housing = proposeAiHousing(
      observation,
      state,
      catalog,
      checkpoints,
      self,
      openingComplete,
      budget.supplyBuffer,
      reservedActorIds,
      selectedConstructionTileKeys,
      ordinal
    );
    if (housing.demand) demands.push(housing.demand);
    intents.push(...housing.intents);
    ordinal = housing.ordinal;
    const freeSupply = housing.freeSupply;

    const {
      pressureDomain,
      military,
      militaryProducts,
      queuedMilitary,
      workforceRecoveryOwnsFood,
      targetMilitary,
      compositionPrefix,
      pressureForecast
    } = observeAiMilitaryForce({
      observation,
      state,
      catalog,
      self,
      openingComplete,
      firstForce: budget.firstForce
    });
    const foodEconomy = proposeAiFoodEconomy({
      observation,
      state,
      catalog,
      self,
      pressureForecast,
      openingComplete,
      workerRequiredObject: workerCheckpoint?.fulfilled ? workerCheckpoint.checkpoint.requiredObject : undefined,
      reservedActorIds,
      selectedConstructionTileKeys,
      demands,
      intents,
      ordinal
    });
    const economyPolicy = foodEconomy.policy;
    ordinal = foodEconomy.ordinal;
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

    const capacity = proposeAiMilitaryCapacity({
      observation,
      state,
      catalog,
      self,
      pressureDomain,
      targetMilitary,
      militaryCount: military.length,
      queuedMilitaryCount: queuedMilitary.length,
      openingComplete,
      workforceRecoveryOwnsFood,
      reservedActorIds,
      selectedConstructionTileKeys,
      priorIntents: intents,
      ordinal
    });
    if (capacity.demand) demands.push(capacity.demand);
    if (capacity.intent) {
      intents.push(capacity.intent);
      ordinal += 1;
    }
    intents.push(
      ...proposeAiMilitaryUnits({
        observation,
        state,
        catalog,
        producers: capacity.producers,
        military,
        queuedMilitary,
        acceptedEffectCount: acceptedMilitaryEffectIds.length,
        targetMilitary,
        rangedPermille: budget.rangedPermille,
        pressureDomain,
        compositionPrefix,
        workforceRecoveryOwnsFood,
        priorIntents: intents,
        ordinal
      })
    );
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
