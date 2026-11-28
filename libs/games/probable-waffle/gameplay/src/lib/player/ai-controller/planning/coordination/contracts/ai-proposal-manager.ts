import type { AiObservation } from "../../../contracts/observation/ai-observation";
import type { AiBrainState } from "../../../contracts/state/ai-state-contracts";
import type { AiManagerProposal } from "../ai-manager-proposal";

/** Read-only manager boundary; managers propose and never mutate the brain or runtime. */
export interface AiProposalManager {
  readonly managerId: string;
  propose(observation: AiObservation, state: AiBrainState): AiManagerProposal;
}
