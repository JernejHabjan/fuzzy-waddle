import { buildSkirmishShardIndex } from "./skirmish-shard-index.ts";

const RULE_HEAVY = "================================================================================";
const RULE_LIGHT = "--------------------------------------------------------------------------------";
const MAX_DISPLAYED_FAILURES = 40;

/** Summarize evidence layers separately with readable details for failing and unproven scenarios. */
export function summarizeMatrixRun(report): string[] {
  const lines = [
    RULE_HEAVY,
    `AI matrix: ${report.status ?? "unknown"}; ${report.rows?.length ?? 0} catalog entries selected.`,
    RULE_LIGHT
  ];
  const pure = report.pure ?? (report.pureScenarioEvidence ? report : null);
  if (pure) {
    appendPureSummary(lines, pure);
  }
  if (report.runtime || !pure) {
    appendRuntimeSummary(lines, report, pure !== null);
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
  lines.push(RULE_HEAVY);
  return lines;
}

function appendPureSummary(lines: string[], pure): void {
  const evidence = pure.pureScenarioEvidence;
  const expected = pure.rows?.length ?? 0;
  const executed = evidence?.executed ?? [];
  const unproven = executed.filter((entry) => !(entry.passedTestCount > 0 && entry.bindingsComplete !== false));
  const proven = executed.length - unproven.length;
  lines.push(`AI pure coverage: ${proven}/${expected} proven; ${expected - proven} unproven.`);
  if (unproven.length === 0) return;
  lines.push(`  Unproven pure scenarios (${unproven.length}):`);
  for (const entry of unproven.slice(0, MAX_DISPLAYED_FAILURES)) {
    lines.push(`    - ${entry.scenarioId}: ${describeUnprovenPure(entry)}`);
  }
  if (unproven.length > MAX_DISPLAYED_FAILURES) {
    lines.push(`    ... and ${unproven.length - MAX_DISPLAYED_FAILURES} more unproven pure scenarios`);
  }
}

function describeUnprovenPure(entry): string {
  const failedBindings = Array.isArray(entry.bindings)
    ? entry.bindings.filter((binding) => !binding.passed).map((binding) => binding.title)
    : [];
  if (failedBindings.length > 0) {
    return `failed binding(s): ${failedBindings.join(" | ").slice(0, 140)}`;
  }
  if (entry.passedTestCount === 0) return "no passing test matched";
  return "incomplete bindings";
}

function appendRuntimeSummary(lines: string[], report, hasPure: boolean): void {
  const index = buildSkirmishShardIndex(report, "summary");
  const totals = index.totals;
  const label = report.runtime ? "AI runtime scenarios" : "AI scenarios";
  lines.push(
    `${label}: ${totals.executed}/${totals.expected} executed; ${totals.passed} passed; ` +
      `${totals.failed} failed; ${totals.unexecuted} not run.`
  );
  const runtimeContainer = report.runtime?.runtime ? report.runtime : report;
  const runtimeScenarios = runtimeContainer.runtime?.scenarios ?? [];
  const failedScenarios = index.failures;
  if (failedScenarios.length > 0) {
    lines.push(`  Failed runtime scenarios (${totals.failed}):`);
    for (const failure of failedScenarios.slice(0, MAX_DISPLAYED_FAILURES)) {
      lines.push(`    - ${failure.scenarioId}: ${failure.predicate}`);
    }
    const omitted = totals.failed - Math.min(failedScenarios.length, MAX_DISPLAYED_FAILURES);
    if (omitted > 0) lines.push(`    ... and ${omitted} more failing runtime scenarios`);
  }
  if (totals.unexecuted > 0 && hasPure && report.runtime) {
    const executedIds = new Set(runtimeScenarios.map((scenario) => scenario.scenarioId));
    const expectedIds = Array.isArray(runtimeContainer.rows) ? runtimeContainer.rows : [];
    const notRunIds = expectedIds.filter((id) => !executedIds.has(id));
    if (notRunIds.length > 0 && notRunIds.length <= 24) {
      lines.push(`  Not run runtime scenarios (${notRunIds.length}): ${notRunIds.join(", ")}`);
    } else if (notRunIds.length > 24) {
      lines.push(
        `  Not run runtime scenarios (${notRunIds.length}): ${notRunIds.slice(0, 20).join(", ")}, ... (+${
          notRunIds.length - 20
        } more)`
      );
    }
  }
  const shards = runtimeContainer.shards;
  if (Array.isArray(shards) && shards.length > 1) {
    const failedShards = shards.filter((shard) => shard.status !== "passed");
    lines.push(
      `  Runtime shards: ${shards.length - failedShards.length}/${shards.length} passed` +
        (totals.wallMs ? ` (${(totals.wallMs / 1000).toFixed(1)}s total)` : "")
    );
  }
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
