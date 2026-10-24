const score = (result) => result === "win" ? 1 : result === "tie" ? 0.5 : result === "loss" ? 0 : null;

/** Seed-clustered paired differences average both sides before uncertainty, avoiding treating side swaps as independent seeds. */
export function analyzeCalibration(records, difficultyPairs, phase = "calibration") {
  return difficultyPairs.map(([lower, upper]) => {
    const selected = records.filter((record) => record.job.revision === "candidate" && record.job.phase === phase);
    const seeds = [...new Set(selected.map((record) => record.job.seed))];
    const values = [], incompleteSeeds = [], fairnessFailures = [];
    for (const seed of seeds) {
      const differences = [];
      for (const side of [1, 2]) {
        const candidates = selected.filter((record) => record.job.seed === seed && record.job.targetPlayerNumber === side);
        const left = candidates.filter((record) => record.job.difficulty === lower);
        const right = candidates.filter((record) => record.job.difficulty === upper);
        if (left.length !== 1 || right.length !== 1 || left[0].status !== "completed" || right[0].status !== "completed" ||
            score(left[0].result) === null || score(right[0].result) === null) continue;
        const a = left[0], b = right[0];
        if (a.initialPhysicalDigest !== b.initialPhysicalDigest || a.job.faction !== b.job.faction ||
            a.job.mapLabel !== b.job.mapLabel || a.job.opponentArchetype !== b.job.opponentArchetype ||
            a.opponentArchetype !== b.opponentArchetype || a.opponentProfile !== b.opponentProfile) {
          fairnessFailures.push(`${seed}:${side}`); continue;
        }
        differences.push(score(b.result) - score(a.result));
      }
      if (differences.length === 2) values.push((differences[0] + differences[1]) / 2);
      else incompleteSeeds.push(seed);
    }
    const n = values.length, mean = n ? values.reduce((sum, value) => sum + value, 0) / n : null;
    // Hoeffding on [-1,1], Bonferroni-adjusted for the five declared looks and two comparisons (family-wise 95%).
    const radius = n ? Math.sqrt(2 * Math.log(400) / n) : null;
    const interval95 = n ? [Math.max(-1, mean - radius), Math.min(1, mean + radius)] : null;
    return { lower, upper, attemptedSeedCount: seeds.length, completedPairCount: n, incompleteSeeds, fairnessFailures,
      meanPairedWinScoreDifference: mean, confidenceMethod: "seed-clustered-hoeffding-familywise95-five-looks-two-comparisons", interval95,
      trend: n < 20 || fairnessFailures.length || incompleteSeeds.length ? "insufficient_evidence" :
        interval95[0] > 0 ? "higher_challenge" :
        interval95[1] < 0 ? "regression" : "indistinguishable" };
  });
}

/** Correctness and calibration are separate verdicts; timeouts/short terminal soaks never inflate completed denominators. */
export function calibrationVerdict(records, specification) {
  const comparisons = analyzeCalibration(records, specification.pairedRuns.difficultyPairs);
  const holdout = analyzeCalibration(records, specification.pairedRuns.difficultyPairs, "holdout");
  const soaks = records.filter((record) => record.job.phase === "soak");
  const correctnessFailures = records.filter((record) => record.failures?.length).map((record) => record.job.id);
  const baseline = records.filter((record) => record.job.revision === "baseline");
  const failures = [];
  if (correctnessFailures.length) failures.push("native_correctness_or_capture_failure");
  if (comparisons.some((entry) => entry.trend !== "higher_challenge")) failures.push("difficulty_ordering_not_established");
  if (holdout.some((entry) => entry.completedPairCount !== specification.pairedRuns.holdoutSeeds.length ||
      entry.fairnessFailures.length || entry.meanPairedWinScoreDifference < 0)) failures.push("holdout_not_confirmed");
  if (soaks.length !== 3 || soaks.some((record) => record.status !== "soak_completed" || record.tick < 72000))
    failures.push("three_complete_sixty_minute_soaks_missing");
  if (!baseline.length || baseline.some((record) => record.status !== "completed")) failures.push("pinned_baseline_runtime_incomplete");
  // The immutable legacy source has no selected opening/difficulty policy. Running it cannot manufacture that support.
  failures.push("pinned_baseline_difficulty_and_opening_comparison_unsupported");
  return { status: failures.length ? "failed" : "passed", failures, comparisons, holdout,
    baseline: { sourceRevision: specification.baseline.sourceRevision, attempted: baseline.length,
      completed: baseline.filter((record) => record.status === "completed").length,
      comparisonStatus: "unsupported_legacy_difficulty_and_opening_policies" },
    soaks: { required: 3, complete: soaks.filter((record) => record.status === "soak_completed" && record.tick >= 72000).length },
    correctnessFailureCount: correctnessFailures.length, firstCorrectnessFailures: correctnessFailures.slice(0, 8) };
}
