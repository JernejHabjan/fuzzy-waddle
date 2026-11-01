import type { AiBrain, AiBrainStepResult } from "../../brain/ai-brain";
import { digestCanonicalAiValue } from "../../brain/persistence/canonical-ai-serialization";
import type { AiBrainState } from "../../contracts/state/ai-state-contracts";
import type { AiCommandOutcome } from "../../contracts/commands/ai-command-contracts";
import type { AiObservation } from "../../contracts/observation/ai-observation";
import type { AiReproBundle, AiReproInputs } from "../../contracts/diagnostics/ai-repro-bundle";
import { findFirstAiDifference, type AiFirstDifference } from "./ai-first-difference";

/** Inline data payload stored beside an AiReproBundle manifest by test/developer tooling. */
export interface AiDecisionReproPayload {
  readonly observation: AiObservation;
  readonly priorState: AiBrainState;
  readonly outcomes: readonly AiCommandOutcome[];
  readonly expectedResult?: AiBrainStepResult;
}

/** Complete decision artifact. Runtime artifacts use the same manifest with external safe snapshot/input references. */
export interface AiDecisionReproArtifact {
  readonly manifest: AiReproBundle & { readonly kind: "decision" };
  readonly payload: AiDecisionReproPayload;
}

/** Creates an exact permitted-data decision capture at a completed pure boundary. */
export function captureAiDecisionBundle(
  payload: AiDecisionReproPayload,
  replayInputs: Omit<AiReproInputs, "snapshotReference" | "snapshotDigest" | "inputReference" | "inputDigest">,
  label: string
): AiDecisionReproArtifact {
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

export type AiReplayBlocker =
  | "missing_observation_history"
  | "missing_prior_state"
  | "missing_outcome_history"
  | "incompatible_source"
  | "incompatible_config"
  | "incompatible_content"
  | "broken_digest";

/** Replay result never labels incomplete or changed-input data as exact reproduction. */
export type AiDecisionReplayResult =
  | { readonly status: "reproduced"; readonly result: AiBrainStepResult; readonly digest: string }
  | { readonly status: "blocked"; readonly blocker: AiReplayBlocker };

/** Rejects corrupted or incomplete decision data before offline execution can inspect it. */
export function assertAiDecisionArtifactIntegrity(artifact: AiDecisionReproArtifact): void {
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
export function replayAiDecisionBundle(
  artifact: AiDecisionReproArtifact,
  brain: AiBrain,
  environment: {
    readonly sourceRevision: string;
    readonly configVersion: string;
    readonly mapDigest: string;
    readonly contentDigest: string;
    readonly rulesVersion: string;
  }
): AiDecisionReplayResult {
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
export interface AiReproComparison {
  readonly classification: "same" | "changed_input" | "same_input_divergence";
  readonly firstDifference: AiFirstDifference | null;
}

/** Compares provenance first, then canonical decision output at its first stable field. */
export function compareAiDecisionBundles(
  original: AiDecisionReproArtifact,
  candidate: AiDecisionReproArtifact
): AiReproComparison {
  const inputDifference = findFirstAiDifference(original.manifest.replayInputs, candidate.manifest.replayInputs);
  if (inputDifference) return { classification: "changed_input", firstDifference: inputDifference };
  const outputDifference = findFirstAiDifference(
    original.payload.expectedResult ?? null,
    candidate.payload.expectedResult ?? null
  );
  return {
    classification: outputDifference ? "same_input_divergence" : "same",
    firstDifference: outputDifference
  };
}

/** Allowed offline breakpoints; arbitrary expressions are intentionally unsupported. */
export type AiOfflineBreakpoint =
  | "duplicate_effect"
  | "progress_overdue"
  | "mission_cancelled"
  | "command_rejected"
  | "decision_complete";

/** Tests only recorded result/state facts; named breakpoints never evaluate imported code. */
export function matchesAiOfflineBreakpoint(breakpoint: AiOfflineBreakpoint, result: AiBrainStepResult): boolean {
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
export class AiOfflineDecisionStepper {
  private consumed = false;

  constructor(
    private readonly artifact: AiDecisionReproArtifact,
    private readonly brain: AiBrain
  ) {
    assertAiDecisionArtifactIntegrity(artifact);
  }

  stepDecision(breakOn: AiOfflineBreakpoint = "decision_complete"):
    | { readonly status: "complete"; readonly result: AiBrainStepResult }
    | {
        readonly status: "breakpoint";
        readonly breakpoint: AiOfflineBreakpoint;
        readonly result: AiBrainStepResult;
      }
    | { readonly status: "exhausted" } {
    if (this.consumed) return { status: "exhausted" };
    this.consumed = true;
    const result = this.brain.step(
      this.artifact.payload.observation,
      this.artifact.payload.priorState,
      this.artifact.payload.outcomes
    );
    if (matchesAiOfflineBreakpoint(breakOn, result)) return { status: "breakpoint", breakpoint: breakOn, result };
    return { status: "complete", result };
  }
}

/** Isolated pure counterfactual; original replay inputs, state and RNG remain byte-equivalent. */
export function runAiOfflineWhatIf(
  artifact: AiDecisionReproArtifact,
  brain: AiBrain,
  counterfactual: AiDecisionReproPayload
): Readonly<{
  classification: "same" | "counterfactual_divergence";
  originalDigest: string;
  counterfactualDigest: string;
  firstDifference: AiFirstDifference | null;
}> {
  assertAiDecisionArtifactIntegrity(artifact);
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
  const firstDifference = findFirstAiDifference(original, hypothetical);
  return {
    classification: firstDifference ? "counterfactual_divergence" : "same",
    originalDigest: digestCanonicalAiValue(original),
    counterfactualDigest: digestCanonicalAiValue(hypothetical),
    firstDifference
  };
}

/** Creates a data-only draft; callers choose an explicit destination and review before committing. */
export function exportAiDecisionFixtureDraft(artifact: AiDecisionReproArtifact): Readonly<Record<string, unknown>> {
  return {
    schemaVersion: 1,
    provenance: artifact.manifest.replayInputs,
    scenarioId: artifact.manifest.replayInputs.scenarioId,
    payload: artifact.payload
  };
}
