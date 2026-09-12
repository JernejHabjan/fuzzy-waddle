import { readFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

/** Compares two compatible measured workflow reports without changing workflow selection or evidence. */
export function compareMeasurements(root, beforePath, afterPath) {
  const before = readMeasurement(root, beforePath);
  const after = readMeasurement(root, afterPath);
  validateComparable(before, after);
  const comparison = compareTotals(before.totals, after.totals);
  return {
    schemaVersion: 1,
    status: "passed",
    configured: true,
    reports: [beforePath, afterPath],
    benchmark: after.benchmark,
    before: measurementReference(beforePath, before),
    after: measurementReference(afterPath, after),
    quality: { status: "preserved", invariantIds: after.qualityInvariants.map((invariant) => invariant.id) },
    comparison,
    cache: compareCache(before, after),
    bottlenecks: rankBottlenecks(after)
  };
}

function readMeasurement(root, reportPath) {
  const path = resolveReportPath(root, reportPath);
  let report;
  try {
    report = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error("unreadable_metrics_report");
  }
  validateMeasurement(report);
  return report;
}

function resolveReportPath(root, reportPath) {
  if (typeof reportPath !== "string" || !reportPath || isAbsolute(reportPath))
    throw new Error("invalid_metrics_report_path");
  const workspace = resolve(root);
  const target = resolve(workspace, reportPath);
  if (relative(workspace, target).startsWith(`..${sep}`) || target === workspace)
    throw new Error("metrics_report_escapes_workspace");
  return target;
}

function validateMeasurement(report) {
  if (
    report?.schemaVersion !== 1 ||
    report.status !== "measured" ||
    !record(report.benchmark) ||
    !validBenchmark(report.benchmark) ||
    !validProvenance(report.provenance) ||
    !Array.isArray(report.qualityInvariants) ||
    report.qualityInvariants.length === 0 ||
    !Array.isArray(report.workflows) ||
    report.workflows.length === 0 ||
    !numericRecord(report.totals)
  )
    throw new Error("invalid_metrics_report");
  const workflowIds = new Set();
  for (const workflow of report.workflows) {
    if (
      !record(workflow) ||
      typeof workflow.id !== "string" ||
      workflowIds.has(workflow.id) ||
      !validContext(workflow.context)
    )
      throw new Error("invalid_metrics_report");
    workflowIds.add(workflow.id);
    if (workflow.matchesExpectedOutcome !== true || !Array.isArray(workflow.commands) || workflow.commands.length === 0)
      throw new Error("invalid_metrics_report");
  }
}

function validateComparable(before, after) {
  if (
    before.benchmark.id !== after.benchmark.id ||
    before.benchmark.version !== after.benchmark.version ||
    before.benchmark.digest !== after.benchmark.digest ||
    canonicalInvariantIds(before) !== canonicalInvariantIds(after) ||
    canonicalWorkflowIds(before) !== canonicalWorkflowIds(after)
  )
    throw new Error("metrics_quality_invariants_changed");
}

function compareTotals(before, after) {
  const metrics = [
    "wallMilliseconds",
    "directProcessStarts",
    "contextBytes",
    "outputBytes",
    "outputLines",
    "retainedLogBytes"
  ];
  return Object.fromEntries(metrics.map((metric) => [metric, delta(before[metric], after[metric])]));
}

function compareCache(before, after) {
  const beforeCache = cacheTotals(before.workflows);
  const afterCache = cacheTotals(after.workflows);
  return {
    before: beforeCache,
    after: afterCache,
    note:
      beforeCache.observedCommands === 0 && afterCache.observedCommands === 0
        ? "No explicit cache hit/miss diagnostic was emitted; cache reuse is unknown."
        : "Only explicit command diagnostics are counted; generic cache mentions are not hits or misses."
  };
}

function rankBottlenecks(report) {
  return report.workflows
    .map((workflow) => ({
      workflowId: workflow.id,
      wallMilliseconds: sum(workflow.commands, (command) => command.elapsedMilliseconds),
      contextBytes: workflow.context.bytes,
      outputBytes: sum(workflow.commands, (command) => command.output.stdoutBytes + command.output.stderrBytes),
      owner: suggestedOwner(workflow)
    }))
    .sort((left, right) => right.wallMilliseconds - left.wallMilliseconds || right.contextBytes - left.contextBytes)
    .slice(0, 3);
}

function suggestedOwner(workflow) {
  if (workflow.declaredStarts.server + workflow.declaredStarts.browser + workflow.declaredStarts.worker > 0)
    return "persistent-process-lifecycle";
  if (workflow.context.bytes > 50_000) return "context-selection";
  if (sum(workflow.commands, (command) => command.output.stdoutBytes + command.output.stderrBytes) > 12_000)
    return "output-budget";
  return "verification-selection";
}

function cacheTotals(workflows) {
  const caches = workflows.flatMap((workflow) => workflow.commands.map((command) => command.output.cache));
  return {
    observedCommands: caches.filter((cache) => cache && cache.status !== "not_reported").length,
    hitCount: sum(caches, (cache) => cache?.hitCount ?? 0),
    missCount: sum(caches, (cache) => cache?.missCount ?? 0)
  };
}

function measurementReference(path, report) {
  return { path, revision: report.provenance.revision, totals: report.totals };
}

function validBenchmark(benchmark) {
  return (
    typeof benchmark.id === "string" && Number.isInteger(benchmark.version) && /^[0-9a-f]{64}$/u.test(benchmark.digest)
  );
}

function validProvenance(provenance) {
  return record(provenance) && /^[0-9a-f]{40}$/u.test(provenance.revision) && Array.isArray(provenance.worktreeStatus);
}

function numericRecord(value) {
  return record(value) && Object.values(value).every((entry) => typeof entry === "number" && Number.isFinite(entry));
}

function validContext(context) {
  return record(context) && typeof context.bytes === "number" && Number.isFinite(context.bytes);
}

function canonicalInvariantIds(report) {
  return report.qualityInvariants
    .map((invariant) => invariant?.id)
    .sort()
    .join(",");
}

function canonicalWorkflowIds(report) {
  return report.workflows
    .map((workflow) => workflow.id)
    .sort()
    .join(",");
}

function delta(before, after) {
  return { before, after, delta: after - before };
}

function sum(values, select) {
  return values.reduce((total, value) => total + select(value), 0);
}

function record(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
