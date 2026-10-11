import { ObjectNames } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiIntentV1 } from "../contracts/ai-intent-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiDemandV1 } from "../contracts/ai-plan-contracts";
import { decideAiEconomyPolicy } from "./ai-economy-policy";
import { proposeAiFieldCapacity } from "./ai-field-capacity-proposal";
import { proposeAiFieldLabor } from "./ai-field-labor-proposal";
import { proposeAiFoodPrerequisite } from "./ai-food-prerequisite-proposal";
import { unresolvedReservedEffectIds } from "./ai-macro-effect-identity";
import { isFinishedActor } from "./ai-macro-observation";
import { projectAiResourceForecasts } from "./ai-resource-forecast";
import { proposeAiWorkerRecovery } from "./ai-worker-recovery";

export const WORKER_RECOVERY_FLOOR = 6;

/** Appends workforce and renewable-food proposals in their original priority and ordinal order. */
export function proposeAiFoodEconomy(args: {
  readonly observation: AiObservationV1;
  readonly state: AiBrainStateV1;
  readonly catalog: AiCapabilityCatalogV1;
  readonly self: readonly AiObservationV1["actors"][number][];
  readonly pressureForecast: ReturnType<typeof projectAiResourceForecasts>;
  readonly openingComplete: boolean;
  readonly workerRequiredObject: ObjectNames | undefined;
  readonly reservedActorIds: ReadonlySet<string>;
  readonly selectedConstructionTileKeys: Set<string>;
  readonly demands: AiDemandV1[];
  readonly intents: AiIntentV1[];
  readonly ordinal: number;
}): { readonly policy: ReturnType<typeof decideAiEconomyPolicy>; readonly ordinal: number } {
  const {
    observation, state, catalog, self, pressureForecast, openingComplete, workerRequiredObject, reservedActorIds,
    selectedConstructionTileKeys, demands, intents
  } = args;
  let ordinal = args.ordinal;
  // A granary is only a drop-off point. Sustained reinforcement needs actual
  // renewable food sources plus workers assigned to them; otherwise a faction
  // can spend its starting food and permanently stop replacing combat losses.
  const foodSourceEntry = catalog.entries.find((entry) => entry.sourceObjectName === ObjectNames.Field);
  const readyFoodSources = self
    .filter((actor) => actor.objectName === ObjectNames.Field && isFinishedActor(actor))
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
  const constructingFoodSources = self
    .filter((actor) => actor.objectName === ObjectNames.Field && !isFinishedActor(actor))
    .sort((left, right) => left.actorId.localeCompare(right.actorId));
  const acceptedFoodSourceEffectIds = unresolvedReservedEffectIds(state, "effect:food-capacity:Field:effect:");
  const policy = decideAiEconomyPolicy(
    observation,
    catalog,
    pressureForecast,
    state.strategy.stance === "defend",
    state.economyProduction.posture,
    state.strategy.assessment?.choice === "finish" &&
      state.strategy.assessment.readyForce >= state.strategy.assessment.requiredForce &&
      state.strategy.assessment.expectedEffectTick !== null &&
      state.strategy.assessment.expectedEffectTick <= observation.tick + 600
  );
  const desiredFoodSources = openingComplete && foodSourceEntry ? policy.desiredFoodSources : 0;
  if (workerRequiredObject) {
    const recovery = proposeAiWorkerRecovery(
      observation,
      state,
      catalog,
      workerRequiredObject,
      Math.max(WORKER_RECOVERY_FLOOR, policy.desiredWorkers),
      policy.posture !== "safe" ? { urgencyClass: 2, utility: 700 } : undefined
    );
    demands.push(recovery.demand);
    if (recovery.intent) intents.push(recovery.intent);
  }
  const prerequisite = proposeAiFoodPrerequisite(
    observation,
    state,
    catalog,
    self,
    foodSourceEntry,
    desiredFoodSources,
    reservedActorIds,
    selectedConstructionTileKeys,
    intents,
    ordinal
  );
  if (prerequisite.demand) demands.push(prerequisite.demand);
  if (prerequisite.intent) {
    intents.push(prerequisite.intent);
    ordinal += 1;
  }
  const fieldCapacity = proposeAiFieldCapacity({
    observation,
    state,
    catalog,
    self,
    foodSourceEntry,
    desiredFoodSources,
    readyFoodSources,
    constructingFoodSources,
    acceptedFoodSourceEffectIds,
    foodPrerequisiteObject: prerequisite.objectName,
    readyFoodPrerequisites: prerequisite.ready,
    reservedActorIds,
    selectedConstructionTileKeys,
    priorIntents: intents,
    ordinal
  });
  if (fieldCapacity.demand) demands.push(fieldCapacity.demand);
  if (fieldCapacity.intent) {
    intents.push(fieldCapacity.intent);
    ordinal += 1;
  }
  if (desiredFoodSources > 0 && foodSourceEntry) {
    const laborIntent = proposeAiFieldLabor(
      observation,
      state,
      catalog,
      self,
      readyFoodSources,
      prerequisite.objectName,
      reservedActorIds,
      intents,
      ordinal
    );
    if (laborIntent) {
      intents.push(laborIntent);
      ordinal += 1;
    }
  }
  return { policy, ordinal };
}
