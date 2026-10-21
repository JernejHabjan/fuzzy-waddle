import { createAiProductionBrain } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/create-ai-production-brain";
import type { AiRuntimeDecisionRepro } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-decision-repro";

/** Fresh production owners per isolated replay, consuming only the recorded permitted catalog and selected profile. */
export function nativeReproBrain(capture: AiRuntimeDecisionRepro) {
  return createAiProductionBrain(capture.profile, () => capture.catalog);
}
