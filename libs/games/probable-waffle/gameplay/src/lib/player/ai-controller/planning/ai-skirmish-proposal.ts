import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCapabilityCatalogV1 } from "../contracts/ai-capability-catalog-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiProfileConfigV1 } from "../contracts/ai-profile-config-v1";
import type { AiManagerProposalV1 } from "./ai-manager-proposal";
import { advanceAiSkirmishDefense } from "./ai-skirmish-defense";
import { finalizeAiSkirmishProposal } from "./ai-skirmish-finalizer";
import { advanceAiSkirmishOffense } from "./ai-skirmish-offense";
import { createAiSkirmishProposalContext } from "./ai-skirmish-proposal-draft";
import { advanceAiSkirmishScouting } from "./ai-skirmish-scouting";

export function proposeAiSkirmish(
  observation: AiObservationV1,
  state: AiBrainStateV1,
  profile: AiProfileConfigV1,
  catalog: AiCapabilityCatalogV1
): AiManagerProposalV1 {
  const context = createAiSkirmishProposalContext(observation, state, catalog);
  advanceAiSkirmishDefense(context);
  const transportProposal = advanceAiSkirmishOffense(context, profile);
  if (transportProposal) return transportProposal;
  advanceAiSkirmishScouting(context);
  return finalizeAiSkirmishProposal(context);
}
