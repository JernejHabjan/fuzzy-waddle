import type { NativeImportProof } from "./skirmish-ai-native-import-proof";

/** Mandatory actual UI and peer predicates; malformed parser-only controls cannot satisfy this scenario. */
export function nativeImportProofFailures(branch: string, proof: NativeImportProof | undefined) {
  if (!proof || proof.branch !== branch) return ["native_import_proof_missing_or_wrong_branch"];
  const failures: string[] = [];
  if (!proof.sourceRevision || !proof.fixtureDigest || !proof.capturedManifestDigest || !proof.capturedArtifactUnchanged ||
      proof.capturedTick < 1 || proof.capturedTick > 2000) failures.push("native_import_capture_or_provenance_missing");
  const required = branch === "oversized" ? [["oversized_bytes", "oversized"], ["oversized_count", "oversized"]] :
    branch === "unauthorized_peer" ? [] : [[branch, ({ malformed: "malformed_json", version_mismatch: "unsupported_version",
      traversal: "unsafe_reference", html: "unsafe_label" } as Record<string, string>)[branch]]];
  const expected = [["valid_control", "imported"], ...required];
  if (proof.attempts.length !== expected.length || expected.some(([caseId, result]) => !result ||
      proof.attempts.filter((attempt) => attempt.caseId === caseId && attempt.result === result).length !== 1))
    failures.push("native_import_required_ui_rejection_or_valid_control_missing");
  if (proof.attempts.some((attempt) => !attempt.nativeWorldUnchanged || attempt.injectedElements !== 0))
    failures.push("native_import_mutated_world_or_executed_markup");
  if (branch === "unauthorized_peer" && (!proof.realPeerAccess || proof.realPeerAccess.humanClients !== 2 ||
      proof.realPeerAccess.result !== "access_denied" || proof.realPeerAccess.captureResult !== "runtime_capture_access_denied" ||
      !proof.realPeerAccess.nativeWorldUnchanged ||
      proof.realPeerAccess.injectedElements !== 0)) failures.push("native_import_real_peer_privacy_control_missing");
  return failures;
}
