import { buildSkirmishShardIndex } from "./skirmish-shard-index.ts";

/** Summarize evidence layers separately: a catalog entry is not necessarily an executed runtime scenario. */
export function summarizeMatrixRun(report): string[] {
  const lines = [`AI matrix: ${report.status ?? "unknown"}; ${report.rows?.length ?? 0} catalog entries selected.`];
  const pure = report.pure ?? (report.pureScenarioEvidence ? report : null);
  if (pure) {
    const evidence = pure.pureScenarioEvidence;
    const expected = pure.rows?.length ?? 0;
    const proven = (evidence?.executed ?? []).filter(
      (entry) => entry.passedTestCount > 0 && entry.bindingsComplete !== false
    ).length;
    lines.push(`AI pure coverage: ${proven}/${expected} proven; ${expected - proven} unproven.`);
  }
  // The existing index owns runtime work/variant/process-failure classification.
  // Before dispatch fails there is no layer payload, so all selected entries remain unexecuted.
  if (report.runtime || !pure) {
    const index = buildSkirmishShardIndex(report, "summary");
    const totals = index.totals;
    const label = report.runtime ? "AI runtime scenarios" : "AI scenarios";
    lines.push(
      `${label}: ${totals.executed}/${totals.expected} executed; ${totals.passed} passed; ` +
        `${totals.failed} failed; ${totals.unexecuted} not run.`
    );
  }
  if (report.reason) lines.push(`AI matrix reason: ${report.reason}`);
  if (report.reason === "candidate_source_is_dirty") {
    lines.push(
      "AI scenarios did not start. Commit tracked changes and move or commit untracked files; inspect git status --short."
    );
  }
  if (report.unexecutedBaselineRuntime?.length) {
    lines.push(`AI baseline runtime comparisons not run: ${report.unexecutedBaselineRuntime.length}.`);
  }
  return lines;
}

/** Preserve requested IDs on setup errors instead of emitting a misleading zero-scenario denominator. */
export function selectedMatrixIds(manifest, options): string[] {
  const rows = Array.isArray(manifest?.rows) ? manifest.rows.filter((row) => typeof row?.id === "string") : [];
  if (options.suite === "release" || (!options.suite && (options.candidate || options.baseline))) {
    return rows.map((row) => row.id);
  }
  if (options.suite === "stage-smoke") {
    return rows
      .filter((row) => Array.isArray(row.stages) && row.stages.includes(Number(options.stage)))
      .map((row) => row.id);
  }
  const selected = options.scenarios ?? options.scenario;
  return typeof selected === "string"
    ? [
        ...new Set(
          selected
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean)
        )
      ]
    : [];
}
