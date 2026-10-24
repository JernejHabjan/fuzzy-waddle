function firstFailure(scenario) {
  const failure = scenario.failures?.[0];
  if (typeof failure !== "string") return "scenario_failed_without_reason";
  return failure.slice(0, 160);
}

function scenarioStatus(scenario) {
  if (!scenario || !Array.isArray(scenario.variants) || scenario.variants.length === 0) return "unexecuted";
  if (scenario.passed && (!scenario.failures || scenario.failures.length === 0)) return "passed";
  return "failed";
}

/** Keep a small reversible index beside a retained full matrix report. */
export function buildSkirmishShardIndex(report, artifact, maxBytes = 8192) {
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1024) throw new Error("shard_index_invalid_limit");
  const shard = Array.isArray(report.runtime?.scenarios) ? report : report.runtime?.runtime ? report.runtime : report;
  const ids = Array.isArray(shard.rows) ? shard.rows : [];
  const scenarios = new Map((shard.runtime?.scenarios ?? []).map((scenario) => [scenario.scenarioId, scenario]));
  const hasWork = (shard.workCounts?.ticks ?? 0) > 0 && (shard.workCounts?.decisions ?? 0) > 0;
  const processFailed = shard.process?.exitCode !== undefined && shard.process.exitCode !== 0;
  const failed = [];
  const stopReasons = {};
  let passed = 0;
  let unexecuted = 0;
  for (const id of ids) {
    const scenario = scenarios.get(id);
    const status = hasWork ? scenarioStatus(scenario) === "passed" && processFailed ? "failed" :
      scenarioStatus(scenario) : "unexecuted";
    for (const variant of scenario?.variants ?? []) {
      const reason = variant.stopReason ?? "unknown";
      stopReasons[reason] = (stopReasons[reason] ?? 0) + 1;
    }
    if (status === "passed") passed += 1;
    else if (status === "unexecuted") unexecuted += 1;
    else failed.push({ scenarioId: id, predicate: processFailed && scenario?.passed ?
      `process_exit:${shard.process.exitCode}` : firstFailure(scenario) });
  }
  const index = {
    schemaVersion: 1,
    status: shard.status ?? report.status ?? "failed",
    runId: shard.runId ?? null,
    candidate: shard.candidate ?? report.candidate ?? null,
    dirtySourceDigest: shard.dirtySourceDigest ?? null,
    manifestVersion: shard.manifestVersion ?? report.manifestVersion ?? null,
    fixtureDigest: shard.fixtureDigest ?? null,
    totals: { expected: ids.length, executed: ids.length - unexecuted, passed,
      failed: failed.length, unexecuted, decisions: shard.workCounts?.decisions ?? 0,
      ticks: shard.workCounts?.ticks ?? 0, wallMs: shard.execution?.wallMs ?? null },
    stopReasons,
    reason: shard.reason ?? report.reason ?? (!hasWork ? "runtime_zero_work" :
      processFailed ? `process_exit:${shard.process.exitCode}` : null),
    artifact,
    failures: [],
    omittedFailures: 0
  };
  for (const failure of failed) {
    if (Buffer.byteLength(JSON.stringify({ ...index, failures: [...index.failures, failure] })) <= maxBytes) {
      index.failures.push(failure);
    } else index.omittedFailures += 1;
  }
  if (Buffer.byteLength(JSON.stringify(index)) > maxBytes) throw new Error("shard_index_limit_too_small_for_provenance");
  return index;
}
