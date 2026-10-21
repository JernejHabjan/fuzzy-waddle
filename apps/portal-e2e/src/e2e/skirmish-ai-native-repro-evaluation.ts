import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { evaluateNativeDebugComparison } from "./skirmish-ai-native-debug-comparison-evaluation";

/** Full physical continuation and its decision fingerprints must both reproduce; pure equality alone is insufficient. */
export function nativeReproProofFailures(id: string, branch: string, result: RuntimeVariantResultV1) {
  const proof = result.nativeRepro;
  if (!proof || proof.branch !== branch || proof.sourceRevision !== result.productionPreset?.sourceRevision ||
      proof.fixtureDigest !== result.productionPreset?.fixtureDigest) return ["native_repro_source_or_proof_missing"];
  const failures = evaluateNativeDebugComparison("identical", proof.pure, proof.sourceRevision);
  if (!proof.isolatedContext || !proof.capsuleDigest || proof.originalBeforeReplay !== proof.originalAfterReplay ||
      !proof.originalBeforeReplay || proof.aiErrors.length || result.aiErrors.length)
    failures.push("native_repro_isolation_original_state_or_runtime_errors");
  if (proof.saved.owner.tick !== 599 || proof.restored.owner.tick !== 599 || proof.control.owner.tick !== 801 ||
      proof.resumed.owner.tick !== 801 || proof.saved.recoveryCount < 1 || proof.saved.retryDebt < 1 ||
      proof.saved.oldestFailureTick === null || proof.saved.oldestFailureTick >= 599)
    failures.push("native_repro_actual_original_incident_or_exact_boundary_missing");
  for (const boundary of [proof.saved, proof.restored, proof.control, proof.resumed]) {
    if (boundary.owner.activeMapScenes !== 1 || boundary.owner.handlerCount !== 1 ||
        boundary.owner.controllerCount !== 1 || boundary.owner.nativePlayerCount !== 1 ||
        boundary.owner.matchId !== proof.saved.owner.matchId || boundary.owner.seed !== proof.saved.owner.seed ||
        boundary.profileVersion !== proof.saved.profileVersion || boundary.profileDifficulty !== proof.saved.profileDifficulty)
      failures.push("native_repro_native_owner_or_configuration_changed");
  }
  for (const [left, right] of [[proof.saved, proof.restored], [proof.control, proof.resumed]] as const)
    for (const key of ["worldDigest", "brainDigest", "authorityDigest", "cadenceDigest", "recoveryDigest",
      "reservationsDigest", "incomeSamplingDigest", "observationMemoryDigest"] as const)
      if (!left[key] || left[key] !== right[key]) failures.push(`native_physical_replay_diverged:${key}`);
  if (proof.overflow || proof.controlTraceCount < 1 || proof.controlTraceCount !== proof.resumedTraceCount ||
      proof.controlTraceDigest !== proof.resumedTraceDigest) failures.push("native_repro_decision_history_incomplete_or_diverged");
  const expectedBlocker = branch === "truncated_history" ? "missing_input_ranges" :
    branch === "source_map_config_mismatch" ? "source_map_config_mismatch" : null;
  if (proof.rejectedCopy !== expectedBlocker) failures.push("native_repro_incomplete_or_mismatched_copy_not_refused");
  if (proof.mismatchBlockers.length !== 3 || proof.mismatchBlockers.some((blocker) => blocker !== "source_map_config_mismatch"))
    failures.push("native_repro_source_map_or_configuration_copy_not_refused");
  if (id === "DBG-03") failures.push(...workbenchFailures(result));
  else if (proof.steps.length) failures.push("native_repro_unexpected_step_operations");
  return [...new Set(failures)];
}

function workbenchFailures(result: RuntimeVariantResultV1) {
  const proof = result.nativeRepro, live = result.nativeLiveWorkbench;
  if (!proof || proof.steps.length !== 3 || proof.steps[0].kind !== "tick" || proof.steps[1].kind !== "decision" ||
      proof.steps[2].kind !== "queue_progress") return ["native_workbench_named_safe_steps_missing"];
  const failures: string[] = [];
  const [tick, decision, progress] = proof.steps;
  if (tick.after.tick !== tick.before.tick + 1 || decision.after.sequence !== decision.before.sequence + 1 ||
      progress.originalQueueId === null || progress.beforeRemainingTime === null || progress.afterRemainingTime === null ||
      progress.afterRemainingTime >= progress.beforeRemainingTime || proof.steps.some((step) =>
        !step.before.settled || !step.after.settled || step.after.tick <= step.before.tick || step.after.tick - step.before.tick > 200))
    failures.push("native_workbench_step_overshot_or_not_completed");
  if (proof.branch === "live_history_bookmark" && (!live || live.humanClients !== 2 || live.actions.before !== live.actions.after ||
      live.actions.tick !== live.actions.afterTick || !live.actions.pauseReasonsUnchanged || live.actions.historical < 1 ||
      live.actions.restoredHistory !== live.actions.historical || live.actions.bookmarkCount !== 1 ||
      live.actions.bookmarkedTick === null || live.actions.bookmarkedSequence === null ||
      !live.liveStepBlocker.includes("native_replay_step_requires_isolated_single_player") ||
      live.matchingLaterHashes.length !== 2 || live.divergedSharedHashCount !== 0 || live.aiErrors.length))
    failures.push("native_live_history_bookmark_changed_gameplay_paused_or_not_exercised");
  return failures;
}
