import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";
import { advanceAiTransportPlan } from "./ai-transport-plan-advancer";

export { AI_TRANSPORT_BOARDING_TIMEOUT_TICKS, AI_TRANSPORT_MINIMUM_DEPARTURE_PERMILLE } from "./ai-transport-constants";
export { createAiTransportPlanV1 } from "./ai-transport-plan-creation";
export type { CreateAiTransportPlanV1Input } from "./ai-transport-plan-input";
export { scoreAiTransportTransferV1 } from "./ai-transport-transfer";

/** Advances saved transport operations and emits only shared command intents. */
export class AiTransportManager implements AiProposalManagerV1 {
  readonly managerId = "stage8.transport";

  constructor(private readonly getCatalog: () => AiCapabilityCatalogV1 | undefined) {}

  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1 {
    const candidateCatalog = this.getCatalog();
    const context = {
      observation,
      state,
      graph: observation.map?.accessGraph,
      catalog: candidateCatalog?.generation === observation.generation ? candidateCatalog : undefined,
      intents: [],
      reasons: [],
      occupiedActors: new Set<ActorId>(),
      occupiedTransfers: new Set<string>(),
      occupiedDestinations: new Set<string>()
    };
    const transport = [...state.transport]
      .sort((left, right) => left.planId.localeCompare(right.planId))
      .map((plan) => (plan.lifecycle ? advanceAiTransportPlan({ ...plan, lifecycle: plan.lifecycle }, context) : plan));
    return {
      managerId: this.managerId,
      lane: "army_threat",
      evaluated: true,
      intents: context.intents,
      reasons: context.reasons,
      statePatch: { transport }
    };
  }
}
