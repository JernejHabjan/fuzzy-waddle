import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import type { NativeRetentionProof } from "./skirmish-ai-native-retention-proof";
import { nativeRetentionFenceFailures } from "./skirmish-ai-native-retention-fence";
import { nativePaidMissionOutputs } from "./skirmish-ai-native-mission-evidence";

/** Native receipts, actual eviction, persisted unresolved work and independently acknowledged peer inputs are all mandatory. */
export function evaluateNativeRetention(branch: string, context: ReturnType<typeof nativeScenarioContext>) {
  const proof = context.result.nativeRetention;
  if (!proof || proof.branch !== branch || proof.sourceRevision !== context.result.productionPreset?.sourceRevision ||
      proof.fixtureDigest !== context.result.productionPreset?.fixtureDigest) return ["native_retention_proof_or_provenance_missing"];
  const failures = nativeRetentionFenceFailures(proof.original, proof.compacted, proof.afterReplay);
  if (proof.dispatchedCount !== 2049 || proof.uniqueDispatchedCount !== 2049 || !proof.dispatchedDigest ||
      !pressureWitnessMatches(proof.witness, proof.dispatchedDigest, 1)) failures.push("native_retention_real_pressure_incomplete");
  if (!proof.beforeEffects || proof.beforeEffects !== proof.afterEffects)
    failures.push("native_retention_old_command_changed_physical_effects");
  failures.push(...continuationFailures(proof.beforeContinuation, proof.afterContinuation));
  if (nativePaidMissionOutputs(context).filter((entry) => entry.item.commandId === proof.original.commandId).length !== 1)
    failures.push("native_retention_original_paid_native_output_not_exactly_once");
  if (branch === "save_restore") {
    const save = proof.save;
    if (!save || !save.sameRealm || !save.saveId || save.revision < 1 || save.saved.owner.tick !== 199 ||
        save.restored.owner.tick !== 199 || save.saved.worldDigest !== save.restored.worldDigest ||
        save.saved.owner.matchId !== save.restored.owner.matchId || save.saved.owner.seed !== save.restored.owner.seed)
      failures.push("native_retention_real_codec_restore_or_exact_saved_world_missing");
    if (save) {
      failures.push(...continuationFailures(save.saved, save.restored));
      failures.push(...continuationFailures(save.restored, save.afterReplayContinuation));
      failures.push(...nativeRetentionFenceFailures(proof.original, save.restoredAuthority, save.afterReplayAuthority));
      if (!save.beforeEffects || save.beforeEffects !== save.afterEffects || save.resumed.owner.tick !== 201 ||
          save.resumed.owner.decisionSequence !== (save.saved.owner.decisionSequence ?? -1) + 1 ||
          !save.resumedAuthority.activeOriginal || save.resumedOriginalCharges !== 0 || save.resumedOriginalOutputs !== 0 ||
          save.resumedCaptureDropped) failures.push("native_retention_restored_paid_work_reapplied_or_not_resumed");
    }
  }
  if (branch === "acknowledged_compaction") {
    const peers = proof.multiplayer;
    if (!peers || peers.humanClients !== 2 || peers.dispatchedCount !== 2049 || peers.uniqueDispatchedCount !== 2049 ||
        !pressureWitnessMatches(peers.hostWitness, peers.dispatchedDigest, 2) ||
        !pressureWitnessMatches(peers.peerWitness, peers.dispatchedDigest, 2) ||
        peers.hostWitness.tick !== peers.peerWitness.tick || !peers.hostRelay.active || !peers.peerRelay.active ||
        peers.hostRelay.localPlayerNumber !== 1 || peers.peerRelay.localPlayerNumber !== 2)
      failures.push("native_retention_real_peer_acknowledgment_or_pressure_missing");
    if (peers) {
      failures.push(...nativeRetentionFenceFailures(peers.original, peers.beforeHost, peers.afterHost, false));
      failures.push(...nativeRetentionFenceFailures(peers.original, peers.beforePeer, peers.afterPeer, false));
      failures.push(...continuationFailures(peers.beforeContinuation, peers.afterContinuation));
      if (peers.beforeHostEffects !== peers.beforePeerEffects || peers.beforeHostEffects !== peers.afterHostEffects ||
          peers.beforePeerEffects !== peers.afterPeerEffects || peers.afterHostProbe.applications !== 1 ||
          peers.afterPeerProbe.applications !== 1 || peers.afterHostProbe.failure || peers.afterPeerProbe.failure || peers.aiErrors.length)
        failures.push("native_retention_native_peers_diverged_reapplied_or_lost_capture");
      if (peers.checkpoint.snapshotBrainDigest !== peers.checkpoint.original.brainDigest ||
          peers.checkpoint.snapshotCadenceDigest !== peers.checkpoint.original.cadenceDigest)
        failures.push("native_retention_initial_real_peer_checkpoint_drifted");
    }
  }
  return [...new Set(failures)];
}

function pressureWitnessMatches(witness: NativeRetentionProof["witness"], digest: string, playerNumber: number) {
  return witness.admitted === 2049 && witness.completed === 2049 && witness.failed === 0 && witness.duplicateCompletions === 0 &&
    witness.admittedDigest === digest && witness.playerNumber === playerNumber && witness.firstId !== null && witness.lastId !== null &&
    witness.firstId !== witness.lastId && witness.lastSequence >= 2048 && witness.tick > 0 && witness.tick <= 2400;
}

function continuationFailures(left: NativeRetentionProof["beforeContinuation"], right: NativeRetentionProof["afterContinuation"]) {
  const failures: string[] = [];
  if (left.owner.tick !== right.owner.tick || left.owner.matchId !== right.owner.matchId || left.owner.seed !== right.owner.seed ||
      left.owner.decisionSequence !== right.owner.decisionSequence || left.profileDifficulty !== right.profileDifficulty ||
      left.profileVersion !== right.profileVersion || left.archetypeId !== right.archetypeId)
    failures.push("retention_frozen_boundary_identity_or_profile_changed");
  for (const boundary of [left, right]) if (boundary.owner.activeMapScenes !== 1 || boundary.owner.handlerCount !== 1 ||
      boundary.owner.controllerCount !== 1 || boundary.owner.nativePlayerCount !== 1) failures.push("retention_native_owner_invalid");
  for (const key of ["brainDigest", "cadenceDigest", "blackboardDigest", "incomeSamplingDigest",
    "observationMemoryDigest", "reconciliationDigest"] as const)
    if (left[key] !== right[key]) failures.push(`retention_gameplay_continuation_changed:${key}`);
  return failures;
}
