import type { AiBrainV1, AiBrainStepResultV1 } from "../brain/ai-brain";
import { digestCanonicalAiValue } from "../brain/canonical-ai-serialization";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiCommandOutcomeV1 } from "../contracts/ai-command-contracts";
import type { AiObservationV1 } from "../contracts/ai-observation-v1";
import type { AiReproBundleV1, AiReproInputsV1 } from "../contracts/ai-repro-bundle-v1";
import { findFirstAiDifferenceV1, type AiFirstDifferenceV1 } from "./ai-first-difference-v1";

/** Inline data payload stored beside an AiReproBundleV1 manifest by test/developer tooling. */
export interface AiDecisionReproPayloadV1 {
  readonly observation: AiObservationV1;
  readonly priorState: AiBrainStateV1;
  readonly outcomes: readonly AiCommandOutcomeV1[];
  readonly expectedResult?: AiBrainStepResultV1;
}

/** Complete decision artifact. Runtime artifacts use the same manifest with external safe snapshot/input references. */
export interface AiDecisionReproArtifactV1 {
  readonly manifest: AiReproBundleV1 & { readonly kind: "decision" };
  readonly payload: AiDecisionReproPayloadV1;
}

/** Creates an exact permitted-data decision capture at a completed pure boundary. */
export function captureAiDecisionBundleV1(
  payload: AiDecisionReproPayloadV1,
  replayInputs: Omit<AiReproInputsV1, "snapshotReference" | "snapshotDigest" | "inputReference" | "inputDigest">,
  label: string
): AiDecisionReproArtifactV1 {
  const snapshotDigest = digestCanonicalAiValue(payload.priorState);
  const inputDigest = digestCanonicalAiValue({ observation: payload.observation, outcomes: payload.outcomes });
  const scenarioLabel = replayInputs.scenarioId ?? "decision";
  return {
    manifest: {
      schemaVersion: 1,
      kind: "decision",
      replayInputs: {
        ...replayInputs,
        snapshotReference: `snapshots/${scenarioLabel}-${replayInputs.tick}.json`,
        snapshotDigest,
        inputReference: `inputs/${scenarioLabel}-${replayInputs.tick}.json`,
        inputDigest
      },
      completeness: {
        observation: "complete",
        priorState: "complete",
        outcomes: "complete",
        alternatives: payload.expectedResult ? "complete" : "not_recorded",
        missingRanges: [],
        truncatedEventCount: 0
      },
      privacy: "permitted_player_data",
      display: { label }
    },
    payload: structuredClone(payload)
  };
}

export type AiReplayBlockerV1 =
  | "missing_observation_history"
  | "missing_prior_state"
  | "missing_outcome_history"
  | "incompatible_source"
  | "incompatible_config"
  | "incompatible_content"
  | "broken_digest";

/** Replay result never labels incomplete or changed-input data as exact reproduction. */
export type AiDecisionReplayResultV1 =
  | { readonly status: "reproduced"; readonly result: AiBrainStepResultV1; readonly digest: string }
  | { readonly status: "blocked"; readonly blocker: AiReplayBlockerV1 };

/** Rejects corrupted or incomplete decision data before offline execution can inspect it. */
export function assertAiDecisionArtifactIntegrityV1(artifact: AiDecisionReproArtifactV1): void {
  if (
    artifact.manifest.completeness.observation !== "complete" ||
    artifact.manifest.completeness.priorState !== "complete" ||
    artifact.manifest.completeness.outcomes !== "complete"
  ) {
    throw new Error("incomplete_ai_decision_artifact");
  }
  if (
    artifact.manifest.replayInputs.snapshotDigest !== digestCanonicalAiValue(artifact.payload.priorState) ||
    artifact.manifest.replayInputs.inputDigest !==
      digestCanonicalAiValue({ observation: artifact.payload.observation, outcomes: artifact.payload.outcomes })
  ) {
    throw new Error("broken_ai_decision_artifact_digest");
  }
}

/** Replays exactly one safe pure boundary and rejects missing history or incompatible versions. */
export function replayAiDecisionBundleV1(
  artifact: AiDecisionReproArtifactV1,
  brain: AiBrainV1,
  environment: {
    readonly sourceRevision: string;
    readonly configVersion: string;
    readonly mapDigest: string;
    readonly contentDigest: string;
    readonly rulesVersion: string;
  }
): AiDecisionReplayResultV1 {
  const completeness = artifact.manifest.completeness;
  if (completeness.observation !== "complete") return { status: "blocked", blocker: "missing_observation_history" };
  if (completeness.priorState !== "complete") return { status: "blocked", blocker: "missing_prior_state" };
  if (completeness.outcomes !== "complete") return { status: "blocked", blocker: "missing_outcome_history" };
  if (artifact.manifest.replayInputs.sourceRevision !== environment.sourceRevision) {
    return { status: "blocked", blocker: "incompatible_source" };
  }
  if (artifact.manifest.replayInputs.configVersion !== environment.configVersion) {
    return { status: "blocked", blocker: "incompatible_config" };
  }
  if (
    artifact.manifest.replayInputs.mapDigest !== environment.mapDigest ||
    artifact.manifest.replayInputs.contentDigest !== environment.contentDigest ||
    artifact.manifest.replayInputs.rulesVersion !== environment.rulesVersion
  ) {
    return { status: "blocked", blocker: "incompatible_content" };
  }
  if (
    artifact.manifest.replayInputs.snapshotDigest !== digestCanonicalAiValue(artifact.payload.priorState) ||
    artifact.manifest.replayInputs.inputDigest !==
      digestCanonicalAiValue({ observation: artifact.payload.observation, outcomes: artifact.payload.outcomes })
  ) {
    return { status: "blocked", blocker: "broken_digest" };
  }
  const result = brain.step(artifact.payload.observation, artifact.payload.priorState, artifact.payload.outcomes);
  return { status: "reproduced", result, digest: digestCanonicalAiValue(result) };
}

/** First divergence plus an explicit changed-input label for DBG-04. */
export interface AiReproComparisonV1 {
  readonly classification: "same" | "changed_input" | "same_input_divergence";
  readonly firstDifference: AiFirstDifferenceV1 | null;
}

/** Compares provenance first, then canonical decision output at its first stable field. */
export function compareAiDecisionBundlesV1(
  original: AiDecisionReproArtifactV1,
  candidate: AiDecisionReproArtifactV1
): AiReproComparisonV1 {
  const inputDifference = findFirstAiDifferenceV1(original.manifest.replayInputs, candidate.manifest.replayInputs);
  if (inputDifference) return { classification: "changed_input", firstDifference: inputDifference };
  const outputDifference = findFirstAiDifferenceV1(
    original.payload.expectedResult ?? null,
    candidate.payload.expectedResult ?? null
  );
  return {
    classification: outputDifference ? "same_input_divergence" : "same",
    firstDifference: outputDifference
  };
}

/** Allowed offline breakpoints; arbitrary expressions are intentionally unsupported. */
export type AiOfflineBreakpointV1 =
  | "duplicate_effect"
  | "progress_overdue"
  | "mission_cancelled"
  | "command_rejected"
  | "decision_complete";

/** Tests only recorded result/state facts; named breakpoints never evaluate imported code. */
export function matchesAiOfflineBreakpointV1(
  breakpoint: AiOfflineBreakpointV1,
  result: AiBrainStepResultV1
): boolean {
  switch (breakpoint) {
    case "decision_complete":
      return true;
    case "command_rejected":
      return result.decisions.some((decision) => decision.outcome === "rejected");
    case "duplicate_effect": {
      const effectIds = result.acceptedIntents.map((intent) => intent.effectId);
      return new Set(effectIds).size !== effectIds.length;
    }
    case "progress_overdue":
      return result.nextState.progress.some(
        (progress) => progress.milestoneDeadline.dueTick <= result.nextState.lastCommittedTick
      );
    case "mission_cancelled":
      return result.nextState.squads.some((squad) => squad.state === "cancelled");
  }
}

/** Bounded pure stepping cursor used by the Stage 13 workbench, never by a live match. */
export class AiOfflineDecisionStepperV1 {
  private consumed = false;

  constructor(
    private readonly artifact: AiDecisionReproArtifactV1,
    private readonly brain: AiBrainV1
  ) {
    assertAiDecisionArtifactIntegrityV1(artifact);
  }

  stepDecision(breakOn: AiOfflineBreakpointV1 = "decision_complete"):
    | { readonly status: "complete"; readonly result: AiBrainStepResultV1 }
    | { readonly status: "breakpoint"; readonly breakpoint: AiOfflineBreakpointV1; readonly result: AiBrainStepResultV1 }
    | { readonly status: "exhausted" } {
    if (this.consumed) return { status: "exhausted" };
    this.consumed = true;
    const result = this.brain.step(
      this.artifact.payload.observation,
      this.artifact.payload.priorState,
      this.artifact.payload.outcomes
    );
    if (matchesAiOfflineBreakpointV1(breakOn, result)) return { status: "breakpoint", breakpoint: breakOn, result };
    return { status: "complete", result };
  }
}

/** Isolated pure counterfactual; original replay inputs, state and RNG remain byte-equivalent. */
export function runAiOfflineWhatIfV1(
  artifact: AiDecisionReproArtifactV1,
  brain: AiBrainV1,
  counterfactual: AiDecisionReproPayloadV1
): Readonly<{
  classification: "same" | "counterfactual_divergence";
  originalDigest: string;
  counterfactualDigest: string;
  firstDifference: AiFirstDifferenceV1 | null;
}> {
  assertAiDecisionArtifactIntegrityV1(artifact);
  const originalArtifactDigest = digestCanonicalAiValue(artifact);
  const original = brain.step(
    structuredClone(artifact.payload.observation),
    structuredClone(artifact.payload.priorState),
    structuredClone(artifact.payload.outcomes)
  );
  const hypothetical = brain.step(
    structuredClone(counterfactual.observation),
    structuredClone(counterfactual.priorState),
    structuredClone(counterfactual.outcomes)
  );
  if (digestCanonicalAiValue(artifact) !== originalArtifactDigest) throw new Error("ai_what_if_mutated_original");
  const firstDifference = findFirstAiDifferenceV1(original, hypothetical);
  return {
    classification: firstDifference ? "counterfactual_divergence" : "same",
    originalDigest: digestCanonicalAiValue(original),
    counterfactualDigest: digestCanonicalAiValue(hypothetical),
    firstDifference
  };
}

/** Creates a data-only draft; callers choose an explicit destination and review before committing. */
export function exportAiDecisionFixtureDraftV1(artifact: AiDecisionReproArtifactV1): Readonly<Record<string, unknown>> {
  return {
    schemaVersion: 1,
    provenance: artifact.manifest.replayInputs,
    scenarioId: artifact.manifest.replayInputs.scenarioId,
    payload: artifact.payload
  };
}
