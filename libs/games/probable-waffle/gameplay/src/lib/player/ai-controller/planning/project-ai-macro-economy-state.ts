import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import type { AiProductionTransitionV1 } from "../contracts/brain-state/ai-production-transition-v1";
import type { proposeAiFoodEconomy } from "./ai-food-economy-proposal";
import { projectAiResourceForecasts } from "./ai-resource-forecast";

/** Projects macro's owned ledger, workforce and optional transition without overwriting adaptation ownership. */
export function projectAiMacroEconomyState(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  catalog: AiCapabilityCatalogV1,
  demands: readonly AiDemandV1[],
  economyPolicy: ReturnType<typeof proposeAiFoodEconomy>["policy"],
  transition: AiProductionTransitionV1 | undefined
): AiBrainStateV1["economyProduction"] {
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
