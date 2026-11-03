import type { AiBrainState } from "../contracts/state/ai-state-contracts";
import type { AiObservation } from "../contracts/observation/ai-observation";
import type { AiProposalManager, AiManagerProposal } from "../planning/coordination/ai-manager-proposal";
import type { projectAiDebugSnapshot } from "../debug/project-ai-debug-snapshot";

/** Explicit test-only dependency overrides. Ordinary brains omit this; no global policy or alternate command authority. */
export interface AiBrainBoundaryHooks {
  /** Executed outside optional guards; a thrown mandatory failure must remain visible to the controller. */
  readonly assertAuthority?: (observation: AiObservation) => void;
  /** Wraps the real proposer, before any result is published or ranked. */
  readonly propose?: (manager: AiProposalManager, observation: AiObservation, state: AiBrainState) => AiManagerProposal;
  readonly projectDebug?: typeof projectAiDebugSnapshot;
}
