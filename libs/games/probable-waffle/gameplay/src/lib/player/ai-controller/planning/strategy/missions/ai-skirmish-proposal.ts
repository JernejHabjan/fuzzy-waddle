import type { AiBrainState } from "../../../contracts/state/ai-state-contracts";
import type { AiCapabilityCatalog } from "../../../contracts/observation/ai-capability-catalog";
import type { AiObservation } from "../../../contracts/observation/ai-observation";
import type { AiProfileConfig } from "../../../contracts/ai-profile-config";
import type { AiManagerProposal } from "../../coordination/ai-manager-proposal";
import { advanceAiSkirmishDefense } from "./ai-skirmish-defense";
import { finalizeAiSkirmishProposal } from "./ai-skirmish-finalizer";
import { advanceAiSkirmishOffense } from "../offense/ai-skirmish-offense";
import { createAiSkirmishProposalContext } from "./ai-skirmish-proposal-draft";
import { advanceAiSkirmishScouting } from "../scouting/ai-skirmish-scouting";

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
