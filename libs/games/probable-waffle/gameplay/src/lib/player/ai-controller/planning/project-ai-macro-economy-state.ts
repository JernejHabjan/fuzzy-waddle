import type { AiBrainState } from "../contracts/ai-brain-state";
import type { AiCapabilityCatalog } from "../contracts/ai-capability-catalog";
import type { AiObservation } from "../contracts/ai-observation";
import type { AiDemand } from "../contracts/ai-plan-contracts";
import type { AiProductionTransition } from "../contracts/brain-state/ai-production-transition";
import type { proposeAiFoodEconomy } from "./ai-food-economy-proposal";
import { projectAiResourceForecasts } from "./ai-resource-forecast";

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
