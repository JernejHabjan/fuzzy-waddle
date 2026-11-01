import type { AiBrainState } from "../contracts/ai-brain-state";
import type { AiCapabilityCatalog } from "../contracts/ai-capability-catalog";
import type { AiObservation } from "../contracts/ai-observation";
import type { AiProfileConfig } from "../contracts/ai-profile-config";
import type { AiManagerProposal } from "./ai-manager-proposal";
import { advanceAiSkirmishDefense } from "./ai-skirmish-defense";
import { finalizeAiSkirmishProposal } from "./ai-skirmish-finalizer";
import { advanceAiSkirmishOffense } from "./ai-skirmish-offense";
import { createAiSkirmishProposalContext } from "./ai-skirmish-proposal-draft";
import { advanceAiSkirmishScouting } from "./ai-skirmish-scouting";

export function proposeAiSkirmish(
  observation: AiObservation,
  state: AiBrainState,
  profile: AiProfileConfig,
  catalog: AiCapabilityCatalog
): AiManagerProposal {
  const context = createAiSkirmishProposalContext(observation, state, catalog);
  advanceAiSkirmishDefense(context, profile);
  advanceAiSkirmishScouting(context);
  const transportProposal = advanceAiSkirmishOffense(context, profile);
  if (transportProposal) return transportProposal;
  return finalizeAiSkirmishProposal(context);
}
