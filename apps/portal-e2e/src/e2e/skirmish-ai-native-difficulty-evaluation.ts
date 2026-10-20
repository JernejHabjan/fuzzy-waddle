import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { nativeDifficultyProfile } from "./skirmish-ai-native-difficulty-profile";

/** D-01 checks real lobby data and every selected boundary; a profile label or a few sparse polls cannot certify cadence. */
export function evaluateNativeDifficulty(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const expected = nativeDifficultyProfile(branch), failures = nativeDifficultySelectionFailures(branch, context.frames);
  const player = context.capture?.setup?.players.find((entry) => entry.playerNumber === 2);
  if (player?.controller.playerDefinition?.difficulty !== expected.sourceDifficulty)
    failures.push("difficulty_native_lobby_selection_mismatch");
  if (!context.result.checkpoints.length || context.result.checkpoints.some((checkpoint) =>
    checkpoint.profileDifficulty !== expected.difficulty)) failures.push("difficulty_saved_brain_profile_mismatch");
  if (!context.facts.some((fact) => fact.kind === "outcome" && fact.outcome.kind === "applied" &&
      fact.outcome.playerNumber === 2 && !!fact.outcome.intentId && !!fact.outcome.effectId))
    failures.push("difficulty_no_actual_ai_application");
  return [...new Set(failures)];
}

/** Separate predicate controls can erase/reorder real-shaped boundaries without constructing a fake native match. */
export function nativeDifficultySelectionFailures(branch: string, frames: ReturnType<typeof nativeScenarioContext>["frames"]) {
  const expected = nativeDifficultyProfile(branch), failures: string[] = [];
  const horizon = 2000, interval = expected.decisionIntervalTicks;
  if (frames.length !== horizon / interval) failures.push("difficulty_complete_cadence_missing");
  for (const [index, frame] of frames.entries()) {
    const input = frame.decision.input, profile = input?.profile;
    if (!profile || Object.entries(expected).some(([key, value]) => Reflect.get(profile, key) !== value))
      failures.push("difficulty_consumed_versioned_profile_mismatch");
    if (frame.decision.persistedProfile?.profileVersion !== expected.profileVersion ||
        frame.decision.persistedProfile.profileDifficulty !== expected.difficulty)
      failures.push("difficulty_selected_brain_profile_mismatch");
    if (frame.tick !== (index + 1) * interval || input?.cadence.clock !== "simulation" ||
        input.cadence.configuredIntervalTicks !== interval || input.cadence.completedBefore !== index)
      failures.push("difficulty_actual_cadence_mismatch");
    const accepted = frame.decision.acceptedIntents;
    const acceptedDecisions = frame.decision.decisions.filter((decision) => decision.outcome === "accepted");
    if (accepted.length > expected.maxAcceptedCommandBatchesPerStep || accepted.length > expected.maxIntentProposalsPerStep ||
        new Set(accepted.map((intent) => intent.intentId)).size !== accepted.length ||
        new Set(acceptedDecisions.map((decision) => decision.intent.intentId)).size !== acceptedDecisions.length ||
        accepted.length !== acceptedDecisions.length || accepted.some((intent) => !acceptedDecisions.some((decision) =>
          JSON.stringify(decision.intent) === JSON.stringify(intent))))
      failures.push("difficulty_selected_command_quota_or_lineage_mismatch");
  }
  return [...new Set(failures)];
}
