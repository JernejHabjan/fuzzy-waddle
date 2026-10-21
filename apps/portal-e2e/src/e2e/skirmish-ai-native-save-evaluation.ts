import type { NativeSaveProof } from "./skirmish-ai-native-save-proof";

/** Native SP continuation must match complete saved state and every actual next decision, not just legacy score hashes. */
export function nativeSaveProofFailures(
  branch: string, proof: NativeSaveProof | undefined, saveTickOverride?: number, controlTickOverride?: number
): string[] {
  if (!proof || proof.branch !== branch) return ["native_save_proof_missing_or_wrong_branch"];
  const failures: string[] = [];
  const saveTicks: Readonly<Record<string, number>> = { before_apply: 19, applied_pending: 199, during_active: 119, pause_speed: 599 };
  const saveTick = saveTickOverride ?? saveTicks[branch];
  const controlTick = controlTickOverride ?? (branch === "pause_speed" ? 801 : 401);
  if (!saveTick) return ["native_save_unknown_branch"];
  if (!proof.sameRealm || !proof.saveId || !Number.isSafeInteger(proof.saveRevision) || proof.saveRevision < 1)
    failures.push("native_save_real_codec_or_same_realm_missing");
  if (!proof.sourceRevision || !proof.fixtureDigest || proof.saved.owner.tick !== saveTick ||
      proof.restored.owner.tick !== saveTick || proof.control.owner.tick !== controlTick || proof.resumed.owner.tick !== controlTick)
    failures.push("native_save_original_boundary_or_provenance_missing");
  for (const [label, boundary] of Object.entries({ saved: proof.saved, restored: proof.restored,
    control: proof.control, resumed: proof.resumed })) {
    if (boundary.owner.activeMapScenes !== 1 || boundary.owner.handlerCount !== 1 ||
        boundary.owner.controllerCount !== 1 || boundary.owner.nativePlayerCount !== 1)
      failures.push(`native_save_duplicate_or_missing_owner:${label}`);
    if (!boundary.owner.matchId || boundary.owner.matchId !== proof.saved.owner.matchId ||
        boundary.owner.seed !== proof.saved.owner.seed || boundary.profileVersion !== proof.saved.profileVersion ||
        boundary.profileDifficulty !== proof.saved.profileDifficulty)
      failures.push(`native_save_identity_or_profile_reset:${label}`);
  }
  for (const [label, left, right] of [["restore", proof.saved, proof.restored],
    ["continuation", proof.control, proof.resumed]] as const) {
    for (const key of ["worldDigest", "brainDigest", "cadenceDigest", "recoveryDigest", "reservationsDigest", "authorityDigest"] as const)
      if (!left[key] || left[key] !== right[key]) failures.push(`native_save_${label}_diverged:${key}`);
  }
  if (proof.traceOverflow || proof.firstTraceDifference || proof.controlTraceCount < 1 ||
      proof.controlTraceCount !== proof.resumedTraceCount || proof.controlTraceDigest !== proof.resumedTraceDigest)
    failures.push("native_save_next_legitimate_decisions_diverged_or_incomplete");
  if (proof.resumedSimulationTimeScale !== (branch === "pause_speed" ? 2 : 1))
    failures.push("native_save_declared_speed_leg_missing");
  const premises = proof.premises;
  if (premises.tick !== saveTick || premises.captureDropped || premises.captureGaps.length)
    failures.push("native_save_original_premise_capture_incomplete");
  if (branch === "before_apply" && proof.saved.owner.decisionSequence !== 0)
    failures.push("native_save_before_first_application_not_original");
  if (branch === "applied_pending" && (premises.heldAppliedReceipts < 1 || proof.saved.pendingCommandCount < 1))
    failures.push("native_save_unresolved_original_applied_command_missing");
  if (branch === "during_active" && (!premises.unfinishedOriginalSite ||
      premises.paidTrainingItems < 1 || premises.paidResearchItems < 1))
    failures.push("native_save_actual_construction_training_or_research_missing");
  if (branch === "pause_speed" && (proof.saved.recoveryCount < 1 || proof.saved.retryDebt < 1 ||
      proof.saved.oldestFailureTick === null || proof.saved.oldestFailureTick >= saveTick))
    failures.push("native_save_original_chronic_failure_age_or_retry_debt_missing");
  return failures;
}
