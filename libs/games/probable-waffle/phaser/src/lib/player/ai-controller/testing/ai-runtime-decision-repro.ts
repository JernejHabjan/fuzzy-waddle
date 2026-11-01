import type Phaser from "phaser";
import type { AiCapabilityCatalog, AiObservation, AiProfileConfig } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiDecisionReproPayload } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-repro-runner";

/** One actual selected boundary; installed only by an explicit developer observer, before native dispatch. */
export interface AiRuntimeDecisionRepro {
  readonly profile: AiProfileConfig;
  readonly catalog: AiCapabilityCatalog;
  readonly payload: AiDecisionReproPayload;
}

/** No listener means no cloning, retained history or alternate planner execution in an ordinary match. */
export function publishAiRuntimeDecisionRepro(
  scene: Phaser.Scene, profile: AiProfileConfig | undefined, catalog: AiCapabilityCatalog | undefined,
  observation: AiObservation, priorState: AiDecisionReproPayload["priorState"],
  outcomes: AiDecisionReproPayload["outcomes"], expectedResult: AiDecisionReproPayload["expectedResult"]
): void {
  if (!scene.events.listenerCount("ai-runtime-decision-repro")) return;
  if (!profile || !catalog) return;
  try {
    scene.events.emit("ai-runtime-decision-repro", structuredClone({ profile, catalog,
      payload: { observation, priorState, outcomes, expectedResult } } satisfies AiRuntimeDecisionRepro));
  } catch {
    // An optional observer cannot suppress or change the already selected native dispatch.
  }
}
