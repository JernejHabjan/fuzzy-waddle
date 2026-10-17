/**
 * Describes whether the pinned pre-AI baseline can execute a scenario without
 * borrowing candidate behavior. Unsupported is a reportable result, never a pass.
 */
export function resolvePinnedBaselineSupport(row, baselineManifest) {
  if (baselineManifest.pinnedBeforeAiBehaviorChanges !== true) throw new Error("baseline_not_prechange");
  return {
    pure: row.drivers.includes("pure")
      ? { status: "unsupported", reason: baselineManifest.compatibility.pureBrain, adapter: null }
      : { status: "not_requested", adapter: null },
    runtime: row.drivers.includes("runtime")
      ? { status: "supported", adapter: "legacy-runtime-command-and-world-projection-v1" }
      : { status: "not_requested", adapter: null }
  };
}
