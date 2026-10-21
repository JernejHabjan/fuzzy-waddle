import { expect, test } from "@playwright/test";
import type { NativeDebugComparisonProof } from "./skirmish-ai-native-debug-comparison-proof";
import { evaluateNativeDebugComparison } from "./skirmish-ai-native-debug-comparison-evaluation";

/** Predicate controls only; the registered recipe obtains its payload from a real pre-dispatch native callback. */
const proof: NativeDebugComparisonProof = {
  branch: "identical", sourceRevision: "source", captureTick: 20, actualResultDigest: "result", replayResultDigest: "result",
  artifactBeforeDigest: "original", artifactAfterDigest: "original", nativeBeforeDigest: "world", nativeAfterDigest: "world",
  classification: "same", firstDifferencePath: null, firstDifferenceExpected: null, firstDifferenceActual: null
};

test("native debug comparison rejects missing capture, false exactness and mutation of original RNG/world", () => {
  expect(evaluateNativeDebugComparison("identical", proof, "source")).toEqual([]);
  expect(evaluateNativeDebugComparison("identical", undefined, "source")).not.toEqual([]);
  expect(evaluateNativeDebugComparison("identical", { ...proof, replayResultDigest: "other" }, "source"))
    .toContain("debug_actual_selected_decision_did_not_reproduce");
  for (const changed of [{ nativeAfterDigest: "mutated" }, { artifactAfterDigest: "mutated" }])
    expect(evaluateNativeDebugComparison("identical", { ...proof, ...changed }, "source"))
      .toContain("debug_isolated_comparison_mutated_original_artifact_world_or_rng");
});

test("changed input is never exact, and a same-input divergence must identify its actual first field", () => {
  const changed = { ...proof, branch: "same_input_divergence", classification: "same_input_divergence",
    firstDifferencePath: "$.nextState.scheduler.decisionSequence", firstDifferenceExpected: 1, firstDifferenceActual: 2 };
  expect(evaluateNativeDebugComparison(changed.branch, changed, "source")).toEqual([]);
  expect(evaluateNativeDebugComparison(changed.branch, { ...changed, firstDifferencePath: "$.totals" }, "source"))
    .toContain("debug_first_same_input_divergence_field_not_identified");
  expect(evaluateNativeDebugComparison("changed_input", { ...proof, branch: "changed_input" }, "source"))
    .toContain("debug_changed_input_config_or_divergence_misclassified");
});
