import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import type { AiManagerProposalV1, AiProposalManagerV1 } from "./ai-manager-proposal";
import { proposeAiSkirmish } from "./ai-skirmish-proposal";

export { AI_PURSUIT_LEASH_TICKS, AI_SKIRMISH_ASSEMBLY_TIMEOUT_TICKS } from "./ai-skirmish-defense";
export { AI_CONCESSION_HOPELESS_TICKS } from "./ai-skirmish-finalizer";

/**
 * Owns the first complete strategic loop: player-fair information questions, bounded incidents,
 * durable squad missions, and a mode-safe concession proposal. Tactical target scoring remains
 * intentionally small until Stage 13, but every emitted action already has a persisted purpose.
 */
export class AiSkirmishManager implements AiProposalManagerV1 {
  readonly managerId = "stage9.skirmish";

  constructor(
    private readonly profile: AiProfileConfigV1,
    private readonly getCatalog: () => AiCapabilityCatalogV1 | undefined
  ) {}

  propose(observation: AiObservationV1, state: AiBrainStateV1): AiManagerProposalV1 {
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
