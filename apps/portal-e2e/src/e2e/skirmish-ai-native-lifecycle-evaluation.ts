import type { NativeLifecycleProof } from "./skirmish-ai-native-lifecycle-proof";

/** No command-count fallback: actual same-realm late work, native ownership and a functioning new scene are mandatory. */
export function nativeLifecycleProofFailures(branch: string, proof: NativeLifecycleProof | undefined) {
  if (!proof || proof.branch !== branch) return ["native_lifecycle_proof_missing_or_wrong_branch"];
  const failures: string[] = [];
  if (!/^[a-f0-9]{40}$/.test(proof.sourceRevision) || !proof.fixtureDigest)
    failures.push("native_lifecycle_provenance_missing");
  for (const [name, owner] of [["original", proof.original], ["next_initial", proof.nextInitial],
    ["next_active", proof.nextActive]] as const) {
    if (owner.activeMapScenes !== 1 || owner.handlerCount !== 1 || owner.controllerCount !== 1 || owner.nativePlayerCount !== 1)
      failures.push(`native_lifecycle_duplicate_or_missing_owner:${name}`);
    if (!Number.isSafeInteger(owner.tick) || owner.tick < 0 || owner.tick > 4000)
      failures.push(`native_lifecycle_tick_outside_original_ceiling:${name}`);
  }
  if (!proof.original.matchId || proof.original.matchId === proof.nextInitial.matchId ||
      proof.original.seed === proof.nextInitial.seed || proof.nextInitial.matchId !== proof.nextActive.matchId ||
      proof.nextInitial.seed !== proof.nextActive.seed || proof.nextInitial.tick !== 0)
    failures.push("native_lifecycle_new_match_identity_or_clock_invalid");
  if (proof.nextActive.tick < 200 || (proof.nextActive.decisionSequence ?? 0) <= (proof.nextInitial.decisionSequence ?? 0))
    failures.push("native_lifecycle_new_controller_did_not_progress");
  if (!proof.retained.sameRealm || !proof.retained.oldSceneInactive || proof.retained.oldTickObservers !== 0 ||
      !proof.nativeBeforeLateWork || proof.nativeBeforeLateWork !== proof.nativeAfterLateWork)
    failures.push("native_lifecycle_old_work_escaped_shutdown_fence");
  if (proof.nextAiErrors.length) failures.push("native_lifecycle_new_match_ai_errors");
  if (branch === "paid_queue" && (!proof.retained.originalPaidCommandId ||
      proof.retained.completionResults.length !== 2 || proof.retained.completionResults.some((result) => result !== null)))
    failures.push("native_lifecycle_original_paid_completion_not_fenced");
  if (branch === "pending_path" && (!proof.retained.pathWasPending || !proof.retained.pathCancelled))
    failures.push("native_lifecycle_original_pending_query_not_cancelled");
  if (branch === "host_replacement" && (proof.originalEpoch === undefined || proof.promotedEpoch === undefined ||
      proof.promotedEpoch <= proof.originalEpoch || proof.retainedAuthorityUnchanged !== true))
    failures.push("native_lifecycle_real_promotion_or_old_authority_fence_missing");
  return failures;
}
