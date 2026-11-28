import type { AiBrainState } from "../../../contracts/state/ai-state-contracts";
import type { AiCapabilityCatalog } from "../../../contracts/observation/ai-capability-catalog";
import type { AiObservation } from "../../../contracts/observation/ai-observation";
import type { AiDemand } from "../../../contracts/planning/ai-plan-contracts";
import type { AiProductionTransition } from "../../../contracts/state/ai-production-transition";
import type { proposeAiFoodEconomy } from "../../economy/food/ai-food-economy-proposal";
import { projectAiResourceForecasts } from "../../economy/forecast/ai-resource-forecast";

/** Projects macro's owned ledger, workforce and optional transition without overwriting adaptation ownership. */
export function projectAiMacroEconomyState(
  observation: AiObservation,
  state: AiBrainState,
  catalog: AiCapabilityCatalog,
  demands: readonly AiDemand[],
  economyPolicy: ReturnType<typeof proposeAiFoodEconomy>["policy"],
  transition: AiProductionTransition | undefined
): AiBrainState["economyProduction"] {
  return {
    ...(transition ? { transition } : {}),
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
  };
}
