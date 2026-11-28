import type { AiReproBundle } from "../../../contracts/diagnostics/ai-repro-bundle";
import type { AiDecisionReproPayload } from "./ai-decision-repro-payload";

/** Complete decision artifact. Runtime artifacts use the same manifest with external safe snapshot/input references. */
export interface AiDecisionReproArtifact {
  readonly manifest: AiReproBundle & { readonly kind: "decision" };
  readonly payload: AiDecisionReproPayload;
}
