import type Phaser from "phaser";
import type { AiCapabilityCatalogV1, AiObservationV1, AiProfileConfigV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiDecisionReproPayloadV1 } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-repro-runner-v1";

/** One actual selected boundary; installed only by an explicit developer observer, before native dispatch. */
export interface AiRuntimeDecisionRepro {
  readonly profile: AiProfileConfigV1;
  readonly catalog: AiCapabilityCatalogV1;
  readonly payload: AiDecisionReproPayloadV1;
}

/** No listener means no cloning, retained history or alternate planner execution in an ordinary match. */
export function publishAiRuntimeDecisionRepro(
  scene: Phaser.Scene, profile: AiProfileConfigV1 | undefined, catalog: AiCapabilityCatalogV1 | undefined,
  observation: AiObservationV1, priorState: AiDecisionReproPayloadV1["priorState"],
  outcomes: AiDecisionReproPayloadV1["outcomes"], expectedResult: AiDecisionReproPayloadV1["expectedResult"]
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
