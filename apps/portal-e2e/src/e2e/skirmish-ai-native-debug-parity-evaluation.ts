import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import type { NativeDebugParityProof } from "./skirmish-ai-native-debug-parity-proof";

/** Quota/history pressure is a brief functional control, independent of authoritative retention and physical shutdown. */
export function nativeDebugParityProofFailures(proof: NativeDebugParityProof | undefined) {
  if (!proof) return ["debug_native_quota_and_shutdown_proof_missing"];
  const failures: string[] = [];
  if (!proof.beforeDigest || proof.beforeDigest !== proof.afterDigest) failures.push("debug_quota_mutated_native_world_or_rng");
  const { peak, shutdown, history } = proof;
  const counters = peak && shutdown && history ? [proof.accepted,
    ...[peak, shutdown].flatMap((boundary) => [boundary.quotaBytes, boundary.sessionBytes,
      boundary.retainedBytes, boundary.retainedCount, boundary.episodeCount]),
    history.count, history.firstSequence, history.lastSequence, history.missingThroughTick] : [];
  if (counters.length === 0 || counters.some((value) => !Number.isSafeInteger(value) || value < 0))
    return ["debug_native_quota_history_or_shutdown_counter_invalid"];
  if (proof.accepted <= 5 || proof.rejected !== true || proof.repeated !== "episode_already_captured" ||
    peak.quotaBytes !== 16384 || peak.sessionBytes <= 0 || peak.sessionBytes > peak.quotaBytes ||
    peak.retainedCount !== 5 || peak.episodeCount !== proof.accepted || peak.retainedBytes <= 0 ||
    peak.retainedBytes > peak.sessionBytes || peak.disposed !== false || peak.listenerDetached !== true || peak.captureReleased !== false)
    failures.push("debug_native_session_quota_eviction_or_episode_deduplication_invalid");
  if (history.count !== 256 || history.firstSequence <= 1 || history.lastSequence - history.firstSequence !== 255 ||
    history.missingThroughTick <= 0) failures.push("debug_actual_history_retention_and_explicit_missing_range_missing");
  if (shutdown.quotaBytes !== peak.quotaBytes || shutdown.disposed !== true || shutdown.sessionBytes ||
    shutdown.retainedCount || shutdown.retainedBytes || shutdown.episodeCount ||
    shutdown.listenerDetached !== true || shutdown.captureReleased !== true)
    failures.push("debug_scene_shutdown_retained_incident_ownership");
  return failures;
}

export function evaluateNativeDebugParity(context: ReturnType<typeof nativeScenarioContext>) {
  const failures = nativeDebugParityProofFailures(context.result.nativeDebugParity);
  const original = context.facts.find((fact) => fact.kind === "authority_delivery" &&
    fact.delivery.faultId === "debug-original-pending" && fact.delivery.phase === "held" && fact.delivery.outcome);
  const command = original?.kind === "authority_delivery" ? original.delivery.outcome?.commandId : undefined;
  if (!command || !context.frames.at(-1)?.decision.missionState?.authority.pendingCommandIds.includes(`command:${command}`))
    failures.push("debug_quota_did_not_preserve_original_unresolved_authority_work");
  const shutdown = context.result.nativeDisposal;
  if (!shutdown?.pendingBeforeShutdown || !shutdown.settledWithNull || !shutdown.sceneInactive ||
    !shutdown.controllerDetached || !shutdown.nativeCacheCleared) failures.push("debug_actual_pending_native_teardown_missing");
  return failures;
}
