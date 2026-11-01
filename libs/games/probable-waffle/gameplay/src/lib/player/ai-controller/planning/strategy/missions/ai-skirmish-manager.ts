import type { AiBrainState } from "../../../contracts/state/ai-state-contracts";
import type { AiCapabilityCatalog } from "../../../contracts/observation/ai-capability-catalog";
import type { AiObservation } from "../../../contracts/observation/ai-observation";
import type { AiProfileConfig } from "../../../contracts/ai-profile-config";
import type { AiManagerProposal, AiProposalManager } from "../../coordination/ai-manager-proposal";
import { proposeAiSkirmish } from "./ai-skirmish-proposal";

export { AI_PURSUIT_LEASH_TICKS, AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS } from "./ai-skirmish-defense";
export { AI_CONCESSION_HOPELESS_TICKS } from "./ai-skirmish-finalizer";

/**
 * Owns the first complete strategic loop: player-fair information questions, bounded incidents,
 * durable squad missions, and a mode-safe concession proposal. Tactical target scoring remains
 * intentionally small until Stage 13, but every emitted action already has a persisted purpose.
 */
export class AiSkirmishManager implements AiProposalManager {
  readonly managerId = "stage9.skirmish";

  constructor(
    private readonly profile: AiProfileConfig,
    private readonly getCatalog: () => AiCapabilityCatalog | undefined
  ) {}

  propose(observation: AiObservation, state: AiBrainState): AiManagerProposal {
    const catalog = this.getCatalog();
    if (!catalog || catalog.generation !== observation.generation)
      return {
        managerId: this.managerId,
        lane: "army_threat",
        evaluated: false,
        intents: [],
        reasons: ["catalog_not_ready"]
      };
    return proposeAiSkirmish(observation, state, this.profile, catalog);
  }
}
