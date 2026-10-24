import type { NativeDebugComparisonProof } from "./skirmish-ai-native-debug-comparison-proof";

/** Compare actual capture/replay digests and first differing fields, with independent native before/after equality. */
export function evaluateNativeDebugComparison(branch: string, proof: NativeDebugComparisonProof | undefined, revision?: string) {
  if (!proof || proof.branch !== branch || !revision || proof.sourceRevision !== revision || proof.captureTick <= 0)
    return ["debug_actual_native_capture_or_provenance_missing"];
  const failures: string[] = [];
  if (!proof.actualResultDigest || proof.actualResultDigest !== proof.replayResultDigest)
    failures.push("debug_actual_selected_decision_did_not_reproduce");
  if (!proof.artifactBeforeDigest || proof.artifactBeforeDigest !== proof.artifactAfterDigest ||
    !proof.nativeBeforeDigest || proof.nativeBeforeDigest !== proof.nativeAfterDigest)
    failures.push("debug_isolated_comparison_mutated_original_artifact_world_or_rng");
  const expected = branch === "identical" ? "same" : branch === "what_if" ? "counterfactual_divergence" :
    branch === "same_input_divergence" ? "same_input_divergence" : "changed_input";
  if (proof.classification !== expected) failures.push("debug_changed_input_config_or_divergence_misclassified");
  if (branch === "identical" ? proof.firstDifferencePath !== null :
    !proof.firstDifferencePath?.startsWith("$") ||
    JSON.stringify(proof.firstDifferenceExpected) === JSON.stringify(proof.firstDifferenceActual))
    failures.push("debug_first_canonical_differing_field_missing_or_incorrect");
  if (branch === "same_input_divergence" && !proof.firstDifferencePath?.endsWith("decisionSequence"))
    failures.push("debug_first_same_input_divergence_field_not_identified");
  return failures;
}
