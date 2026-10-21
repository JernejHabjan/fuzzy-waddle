import type { runNativeProfileTransfer } from "./skirmish-ai-native-profile-transfer";

/** A real reconnect checkpoint and host fence must preserve the original brain, then serve the next eligible decision. */
export function nativeProfileTransferFailures(
  difficulty: "Easy" | "Normal" | "Hard", proof: Awaited<ReturnType<typeof runNativeProfileTransfer>> | undefined
): string[] {
  if (!proof) return ["native_profile_transfer_proof_missing"];
  const failures: string[] = [];
  if (proof.aiErrors.length) failures.push("native_profile_transfer_ai_errors");
  const expectedDifficulty = { Easy: 0, Normal: 1, Hard: 2 }[difficulty];
  const intervalTicks = { Easy: 40, Normal: 20, Hard: 10 }[difficulty];
  if (proof.humanClients !== 2 || !proof.disconnected || proof.snapshotTick !== proof.sourceTick ||
      proof.original.owner.tick !== proof.sourceTick || proof.promoted.owner.tick !== proof.sourceTick ||
      proof.sourceTick <= 0 || proof.sourceTick >= 4000)
    failures.push("native_profile_real_reconnect_boundary_missing");
  if (proof.promotedEpoch !== proof.originalEpoch + 1) failures.push("native_profile_real_host_fence_missing");
  if (proof.snapshotBrainDigest !== proof.original.brainDigest || proof.snapshotCadenceDigest !== proof.original.cadenceDigest)
    failures.push("native_profile_actual_snapshot_differs_from_original_host");
  for (const key of ["brainDigest", "cadenceDigest", "blackboardDigest", "incomeSamplingDigest", "observationMemoryDigest"] as const)
    if (proof.original[key] !== proof.promoted[key]) failures.push(`native_profile_host_continuation_reset:${key}`);
  for (const boundary of [proof.original, proof.promoted, proof.next]) {
    if (boundary.profileDifficulty !== expectedDifficulty || boundary.profileVersion !== proof.original.profileVersion ||
        boundary.archetypeId !== proof.original.archetypeId || boundary.owner.matchId !== proof.original.owner.matchId ||
        boundary.owner.seed !== proof.original.owner.seed)
      failures.push("native_profile_selected_configuration_or_identity_drifted");
    if (boundary.owner.activeMapScenes !== 1 || boundary.owner.handlerCount !== 1 ||
        boundary.owner.controllerCount !== 1 || boundary.owner.nativePlayerCount !== 1)
      failures.push("native_profile_current_controller_ownership_invalid");
  }
  const previousSequence = proof.original.owner.decisionSequence;
  const expectedTick = proof.sourceTick + Math.max(1, Math.ceil((intervalTicks * 50 - proof.original.elapsedMilliseconds) / 50));
  if (previousSequence === null || previousSequence < 3 || proof.nextDecision?.sequence !== previousSequence + 1 ||
      proof.next.owner.decisionSequence !== previousSequence + 1 || proof.nextDecision?.tick !== expectedTick ||
      proof.next.owner.tick !== expectedTick || expectedTick > 4000)
    failures.push("native_profile_next_eligible_decision_reset_or_missed");
  return [...new Set(failures)];
}
