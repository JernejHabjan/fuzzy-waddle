import type { NativeSaveProof } from "./skirmish-ai-native-save-proof";

/** Native SP restore matches the save boundary and proves live decisions continue from the saved AI state. */
export function nativeSaveProofFailures(
  branch: string,
  proof: NativeSaveProof | undefined,
  saveTickOverride?: number,
  controlTickOverride?: number
): string[] {
  if (!proof || proof.branch !== branch) return ["native_save_proof_missing_or_wrong_branch"];
  const failures: string[] = [];
  const saveTicks: Readonly<Record<string, number>> = {
    before_apply: 19,
    applied_pending: 199,
    during_active: 119,
    pause_speed: 599
  };
  const saveTick = saveTickOverride ?? saveTicks[branch];
  const controlTick = controlTickOverride ?? (branch === "pause_speed" ? 801 : 401);
  if (!saveTick) return ["native_save_unknown_branch"];
  if (!proof.sameRealm || !proof.saveId || !Number.isSafeInteger(proof.saveRevision) || proof.saveRevision < 1)
    failures.push("native_save_real_codec_or_same_realm_missing");
  if (
    !proof.sourceRevision ||
    !proof.fixtureDigest ||
    proof.saved.owner.tick !== saveTick ||
    proof.restored.owner.tick !== saveTick ||
    proof.control.owner.tick !== controlTick ||
    proof.resumed.owner.tick !== controlTick
  )
    failures.push("native_save_original_boundary_or_provenance_missing");
  for (const [label, boundary] of Object.entries({
    saved: proof.saved,
    restored: proof.restored,
    control: proof.control,
    resumed: proof.resumed
  })) {
    if (
      boundary.owner.activeMapScenes !== 1 ||
      boundary.owner.handlerCount !== 1 ||
      boundary.owner.controllerCount !== 1 ||
      boundary.owner.nativePlayerCount !== 1
    )
      failures.push(`native_save_duplicate_or_missing_owner:${label}`);
    if (
      !boundary.owner.matchId ||
      boundary.owner.matchId !== proof.saved.owner.matchId ||
      boundary.owner.seed !== proof.saved.owner.seed ||
      boundary.profileVersion !== proof.saved.profileVersion ||
      boundary.profileDifficulty !== proof.saved.profileDifficulty
    )
      failures.push(`native_save_identity_or_profile_reset:${label}`);
  }
  for (const key of [
    "worldDigest",
    "brainDigest",
    "cadenceDigest",
    "recoveryDigest",
    "reservationsDigest",
    "authorityDigest"
  ] as const)
    if (!proof.saved[key] || proof.saved[key] !== proof.restored[key])
      failures.push(`native_save_restore_diverged:${key}`);
  for (const key of ["cadenceDigest", "recoveryDigest", "incomeSamplingDigest"] as const)
    if (!proof.control[key] || proof.control[key] !== proof.resumed[key])
      failures.push(`native_save_continuation_lifecycle_diverged:${key}`);
  if (
    proof.control.recoveryCount !== proof.resumed.recoveryCount ||
    proof.control.retryDebt !== proof.resumed.retryDebt ||
    proof.control.oldestFailureTick !== proof.resumed.oldestFailureTick ||
    proof.control.pendingOutcomeCount !== proof.resumed.pendingOutcomeCount
  )
    failures.push("native_save_continuation_lifecycle_counts_diverged");
  if (
    proof.resumedUsefulWork.tick !== proof.resumed.owner.tick ||
    proof.resumedUsefulWork.advancedQueueAttempts +
      proof.resumedUsefulWork.completedQueueItems +
      proof.resumedUsefulWork.nativeDamageEvents < 1
  )
    failures.push("native_save_useful_work_did_not_continue_after_restore");
  const savedDecisionSequence = proof.saved.owner.decisionSequence;
  const controlDecisionSequence = proof.control.owner.decisionSequence;
  const resumedDecisionSequence = proof.resumed.owner.decisionSequence;
  const decisionProgressValid =
    typeof savedDecisionSequence === "number" &&
    Number.isSafeInteger(savedDecisionSequence) &&
    typeof controlDecisionSequence === "number" &&
    Number.isSafeInteger(controlDecisionSequence) &&
    typeof resumedDecisionSequence === "number" &&
    Number.isSafeInteger(resumedDecisionSequence) &&
    controlDecisionSequence > savedDecisionSequence &&
    resumedDecisionSequence === controlDecisionSequence &&
    proof.controlTraceCount === controlDecisionSequence - savedDecisionSequence;
  if (
    proof.traceOverflow !== false ||
    proof.firstTraceInputDifferences.length !== 0 ||
    (proof.firstTraceDifference !== null && proof.firstTraceDifference.index < 1) ||
    !Number.isSafeInteger(proof.controlTraceCount) ||
    proof.controlTraceCount < 1 ||
    !Number.isSafeInteger(proof.resumedTraceCount) ||
    typeof proof.controlTraceDigest !== "string" ||
    proof.controlTraceDigest.length === 0 ||
    proof.controlTraceCount !== proof.resumedTraceCount ||
    !decisionProgressValid ||
    (proof.firstTraceDifference === null && proof.controlTraceDigest !== proof.resumedTraceDigest)
  )
    failures.push("native_save_next_legitimate_decisions_incomplete_or_reset");
  if (proof.resumedSimulationTimeScale !== (branch === "pause_speed" ? 2 : 1))
    failures.push("native_save_declared_speed_leg_missing");
  const premises = proof.premises;
  if (premises.tick !== saveTick || premises.captureDropped)
    failures.push("native_save_original_premise_capture_incomplete");
  if (branch === "before_apply" && proof.saved.owner.decisionSequence !== 0)
    failures.push("native_save_before_first_application_not_original");
  if (branch === "applied_pending" && (premises.heldAppliedReceipts < 1 || proof.saved.pendingCommandCount < 1))
    failures.push("native_save_unresolved_original_applied_command_missing");
  if (
    branch === "during_active" &&
    (!premises.unfinishedOriginalSite ||
      premises.paidTrainingItems < 1 ||
      premises.paidResearchItems < 1 ||
      !premises.paidTrainingProvenance ||
      !premises.paidResearchProvenance ||
      !premises.paidConstructionProvenance ||
      premises.postChargeResourceReset)
  )
    failures.push("native_save_actual_construction_training_research_or_payment_provenance_missing");
  if (
    branch === "pause_speed" &&
    (proof.saved.recoveryCount < 1 ||
      proof.saved.retryDebt < 1 ||
      proof.saved.oldestFailureTick === null ||
      proof.saved.oldestFailureTick >= saveTick)
  )
    failures.push("native_save_original_chronic_failure_age_or_retry_debt_missing");
  return failures;
}
