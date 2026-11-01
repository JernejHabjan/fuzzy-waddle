import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiBrainState } from "../contracts/ai-brain-state";
import type { AiCapabilityCatalog } from "../contracts/ai-capability-catalog";
import type { AiObservation } from "../contracts/ai-observation";
import type { AiManagerProposal, AiProposalManager } from "./ai-manager-proposal";
import { advanceAiTransportPlan } from "./ai-transport-plan-advancer";
import { proposeAiIslandEstablishment } from "./ai-island-establishment";

export { AI_TRANSPORT_BOARDING_TIMEOUT_TICKS, AI_TRANSPORT_MINIMUM_DEPARTURE_PERMILLE } from "./ai-transport-constants";
export { createAiTransportPlan } from "./ai-transport-plan-creation";
export type { CreateAiTransportPlanInput } from "./ai-transport-plan-input";
export { scoreAiTransportTransfer } from "./ai-transport-transfer";

/** Advances saved transport operations and emits only shared command intents. */
export class AiTransportManager implements AiProposalManager {
  readonly managerId = "stage8.transport";

  constructor(private readonly getCatalog: () => AiCapabilityCatalog | undefined) {}

  propose(observation: AiObservation, state: AiBrainState): AiManagerProposal {
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
    const establishment = context.catalog ? proposeAiIslandEstablishment(observation, { ...state, transport }, context.catalog) : undefined;
    const newPlans = establishment?.statePatch?.transportAppend ?? [];
    return {
      managerId: this.managerId,
      lane: "army_threat",
      evaluated: true,
      intents: context.intents,
      reasons: [...context.reasons, ...(establishment?.reasons ?? [])],
      statePatch: { transport: [...transport, ...newPlans] }
    };
  }
}
