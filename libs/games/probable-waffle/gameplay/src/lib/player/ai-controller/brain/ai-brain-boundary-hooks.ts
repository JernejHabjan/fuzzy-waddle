import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiProposalManagerV1, AiManagerProposalV1 } from "../planning/ai-manager-proposal";
import type { projectAiDebugSnapshot } from "../debug/project-ai-debug-snapshot";

/** Explicit test-only dependency overrides. Ordinary brains omit this; no global policy or alternate command authority. */
export interface AiBrainBoundaryHooks {
  /** Executed outside optional guards; a thrown mandatory failure must remain visible to the controller. */
  readonly assertAuthority?: (observation: AiObservationV1) => void;
  /** Wraps the real proposer, before any result is published or ranked. */
  readonly propose?: (manager: AiProposalManagerV1, observation: AiObservationV1, state: AiBrainStateV1) => AiManagerProposalV1;
  readonly projectDebug?: typeof projectAiDebugSnapshot;
}
