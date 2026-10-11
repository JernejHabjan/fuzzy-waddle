#!/usr/bin/env node
import { decodeRuntimeArtifact } from "../../apps/portal-e2e/src/e2e/skirmish-ai-runtime-artifact-codec.mjs";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildRepairReport } from "./skirmish-repair-report.mjs";

const toolDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(toolDirectory, "../..");

export function parseSummaryArguments(tokens) {
  const options = { input: null, scenario: null, details: false, failuresOnly: false, repairList: false,
    requireSupported: false, maxClusters: null, maxBytes: null };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--") continue;
    if (token === "--details") options.details = true;
    else if (token === "--failures-only") options.failuresOnly = true;
    else if (token === "--repair-list") options.repairList = true;
    else if (token === "--require-supported") options.requireSupported = true;
    else if (token === "--max-clusters") options.maxClusters = Number(requiredValue(tokens[++index], "max_clusters"));
    else if (token === "--max-bytes") options.maxBytes = Number(requiredValue(tokens[++index], "max_bytes"));
    else if (token === "--scenario") options.scenario = requiredValue(tokens[++index], "scenario");
    else if (token === "--report") {
      const supplied = requiredValue(tokens[++index], "report");
      options.input = options.input === null ? supplied : [...(Array.isArray(options.input) ? options.input :
        [options.input]), supplied];
    } else if (token === "--help") options.help = true;
    else if (token.startsWith("--")) throw new Error(`unknown_option:${token}`);
    else if (options.input === null) options.input = token;
    else options.input = [...(Array.isArray(options.input) ? options.input : [options.input]), token];
  }
  if (Array.isArray(options.input) && !options.repairList) throw new Error("multiple_reports_need_repair_list");
  return options;
}

export function resolveReportPath(input, root = workspaceRoot) {
  const supplied = input ?? join(root, "tmp/ai-skirmish-matrix");
  const target = isAbsolute(supplied) ? resolve(supplied) : resolve(process.cwd(), supplied);
  if (!statSync(target).isDirectory()) return target;
  const reports = readdirSync(target)
    .filter((name) => name.endsWith(".json"))
    .map((name) => ({ path: join(target, name), modified: statSync(join(target, name)).mtimeMs }))
    .sort((left, right) => right.modified - left.modified || right.path.localeCompare(left.path));
  if (reports.length === 0) throw new Error(`report_directory_empty:${target}`);
  return reports[0].path;
}

export function resolveRepairReportPaths(input, root = workspaceRoot) {
  if (Array.isArray(input)) {
    const paths = input.map((supplied) => isAbsolute(supplied) ? resolve(supplied) : resolve(process.cwd(), supplied));
    if (new Set(paths).size !== paths.length || paths.some((path) => !path.endsWith(".json") || !statSync(path).isFile()))
      throw new Error("repair_report_explicit_paths_must_be_distinct_files");
    return paths.sort();
  }
  const supplied = input ?? join(root, "tmp/ai-skirmish-matrix");
  const target = isAbsolute(supplied) ? resolve(supplied) : resolve(process.cwd(), supplied);
  if (!statSync(target).isDirectory()) return [target];
  const paths = readdirSync(target).filter((name) => name.endsWith(".json")).sort().map((name) => join(target, name));
  if (paths.length === 0) throw new Error(`report_directory_empty:${target}`);
  return paths;
}

export function summarizeReport(report, options = {}) {
  report = decodeRuntimeArtifact(report);
  const lines = [];
  const runtime = report.runtime ?? (Array.isArray(report.scenarios) ? report : null);
  const label = options.path ? relative(workspaceRoot, options.path) || options.path : "report";
  lines.push(
    [
      `REPORT ${label}`,
      `status=${report.status ?? runtime?.status ?? "unknown"}`,
      report.suite ? `suite=${report.suite}` : null,
      Array.isArray(report.rows) ? `rows=${report.rows.join(",")}` : null,
      report.candidate ? `candidate=${shortRevision(report.candidate)}` : null,
      report.dirtySourceDigest ? `dirty=${report.dirtySourceDigest}` : null,
      report.fixtureDigest ? `fixture=${report.fixtureDigest}` : null
    ]
      .filter(Boolean)
      .join(" ")
  );
  if (report.reason) lines.push(`REASON ${report.reason}`);
  const work = report.workCounts ?? runtime?.workCounts;
  if (work) {
    const workSummary = [
      `scenarios=${work.scenarios ?? 0}`,
      `suites=${work.testSuites ?? 0}`,
      `tests=${work.tests ?? 0}`,
      `decisions=${work.decisions ?? 0}`,
      `ticks=${work.ticks ?? 0}`
    ];
    lines.push(`WORK ${workSummary.join(" ")}`);
  }
  if (report.execution) {
    lines.push(`EXECUTION wallMs=${report.execution.wallMs} processStarts=${report.execution.processStarts}`);
  }
  const pureEvidence = report.pureScenarioEvidence ?? report.pure?.pureScenarioEvidence;
  if (pureEvidence) {
    const missing = pureEvidence.missingScenarioIds ?? [];
    lines.push(`PURE_COVERAGE executed=${pureEvidence.executed?.length ?? 0} missing=${missing.length}`);
    if (missing.length > 0) lines.push(`PURE_MISSING ${missing.join(",")}`);
  }

  const scenarios = runtime?.scenarios ?? [];
  const noExecutedWork =
    (work?.testSuites ?? 0) === 0 &&
    (work?.tests ?? 0) === 0 &&
    (work?.decisions ?? 0) === 0 &&
    (work?.ticks ?? 0) === 0;
  if (!runtime && noExecutedWork) lines.push("INFRASTRUCTURE no_runtime_payload");
  const selected = scenarios.filter((scenario) => !options.scenario || scenario.scenarioId === options.scenario);
  if (options.scenario && selected.length === 0) lines.push(`SCENARIO ${options.scenario} missing`);
  for (const scenario of selected) {
    if (options.failuresOnly && scenario.passed) continue;
    const failures = scenario.failures ?? [];
    lines.push(
      `SCENARIO ${scenario.scenarioId} ${scenario.passed ? "PASS" : "FAIL"}${
        failures.length > 0 ? ` failures=${failures.join("|")}` : ""
      }`
    );
    const failingVariantIds = new Set(failures.map((failure) => failure.split(":", 1)[0]));
    const variants = options.failuresOnly
      ? (scenario.variants ?? []).filter((variant) => failingVariantIds.has(variant.variantId))
      : (scenario.variants ?? []);
    for (const variant of variants) {
      const final = variant.checkpoints?.at(-1) ?? {};
      const score = final.scoreMetrics ?? {};
      const enemyLosses = (score.units_killed ?? 0) + (score.buildings_destroyed ?? 0);
      const raid = (variant.perturbations ?? []).find((entry) => entry.id === "home-raid");
      lines.push(
        [
          `  VARIANT ${variant.variantId}`,
          `seed=${variant.seed ?? "none"}`,
          `tick=${final.tick ?? "none"}`,
          variant.stopReason ? `stop=${variant.stopReason}` : null,
          `result=${final.gameResult ?? "none"}`,
          `workers=${final.workerCount ?? "none"}`,
          `army=${final.militaryActorNames?.length ?? "none"}`,
          `income=${finite(final.deliveredIncome)}`,
          `produced=${score.units_produced ?? 0}`,
          `damage=${score.damage_dealt ?? 0}`,
          `enemyLosses=${enemyLosses}`,
          raid ? `raid=${raid.dispatchedActors ?? 0}` : null,
          variant.aiErrors?.length ? `aiErrors=${variant.aiErrors.length}` : null
        ]
          .filter(Boolean)
          .join(" ")
      );
      if (variant.timing) {
        const phases = variant.timing.checkpointPhases ?? [];
        const playMs = phases.reduce((sum, phase) => sum + (phase.advanceMs ?? 0), 0);
        const settleMs = phases.reduce((sum, phase) => sum + (phase.settleMs ?? 0), 0);
        const captureMs = phases.reduce((sum, phase) => sum + (phase.captureMs ?? 0), 0);
        const ticks = Math.max(1, final.tick ?? 0);
        lines.push(
          `    timing setupMs=${variant.timing.setupMs} playMs=${playMs} settleMs=${settleMs} ` +
          `captureMs=${captureMs} perturbationMs=${variant.timing.perturbationMs ?? 0} ` +
          `playMsPer1kTicks=${Math.round((playMs * 1000) / ticks)} ` +
          `longTasks=${variant.timing.browserLongTasks?.count ?? "unsupported"}`
        );
        if (options.details) {
          lines.push(
            `    timingCheckpoints=${phases
              .map((phase) => `${phase.targetTick}:${phase.advanceMs}/${phase.settleMs}/${phase.captureMs}`)
              .join(",")}`
          );
        }
      }
      if (options.details) appendVariantDetails(lines, final);
    }
  }

  if (scenarios.length === 0 && report.process?.stderr) {
    const tail = report.process.stderr.trim().split("\n").slice(-12);
    if (tail.length > 0) lines.push("PROCESS STDERR", ...tail.map((line) => `  ${line}`));
  }
  return lines.join("\n");
}

function appendVariantDetails(lines, final) {
  if (final.resourceStockpiles) lines.push(`    resources=${JSON.stringify(final.resourceStockpiles)}`);
  const actorNames = new Map((final.ownedConstruction ?? []).map((actor) => [actor.actorId, actor.objectName]));
  if (final.workerOrders?.length) {
    lines.push(
      `    workers=${final.workerOrders
        .map(
          (order) =>
            `${order.actorId}:${order.orderType}->${actorNames.get(order.targetActorId) ?? order.targetActorId ?? "none"}`
        )
        .join(",")}`
    );
  }
  if (final.militaryProducerQueues?.length) {
    lines.push(
      `    queues=${final.militaryProducerQueues
        .map((queue) => `${queue.objectName}:${queue.occupied}/${queue.capacity}`)
        .join(",")}`
    );
  }
  if (final.squads?.length) {
    lines.push(
      `    squads=${final.squads
        .map(
          (squad) =>
            `${squad.squadId}:${squad.role}/${squad.state}#${squad.actorCount}@${squad.objectiveId ?? "none"}${
              squad.terminalReason ? `!${squad.terminalReason}` : ""
            }`
        )
        .join(",")}`
    );
  }
  if (final.missionTimeline?.length) {
    lines.push(`    missions=${final.missionTimeline.map((event) => `${event.tick}:${event.detail}`).join(",")}`);
  }
  if (final.terminalFailureReasons && Object.keys(final.terminalFailureReasons).length > 0) {
    lines.push(`    commandFailures=${JSON.stringify(final.terminalFailureReasons)}`);
  }
}

function requiredValue(value, label) {
  if (!value || value.startsWith("--")) throw new Error(`missing_${label}`);
  return value;
}

function shortRevision(value) {
  return /^[a-f0-9]{40}$/.test(value) ? value.slice(0, 12) : value;
}

function finite(value) {
  return Number.isFinite(value) ? Number(value.toFixed(2)) : "none";
}

function helpText() {
  return [
    "Summarize a skirmish matrix artifact without dumping its full runtime payload.",
    "",
    "Usage:",
    "  node tools/ai/summarize-skirmish-report.mjs [artifact-or-directory] [options]",
    "",
    "Options:",
    "  --report PATH       Read an artifact or directory; repeat for explicit repair-list files",
    "  --scenario ID       Show one scenario",
    "  --details           Add compact resources, worker orders, queues, squads and missions",
    "  --failures-only     Hide passing scenarios",
    "  --repair-list       Parse all reports in a directory and emit bounded cross-shard JSON",
    "  --require-supported Require every supported runtime row in repair-list mode",
    "  --max-clusters N    Limit displayed failure clusters (default 16)",
    "  --max-bytes N       Limit output JSON bytes (default 16384)",
    "  --help              Show this help",
    "",
    "With no path, the newest JSON report in tmp/ai-skirmish-matrix is selected.",
    "Repair-list mode reads a directory or distinct explicit files and requires a shared run ID.",
    ""
  ].join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseSummaryArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(helpText());
    else {
      if (options.repairList) {
        const manifest = options.requireSupported
          ? JSON.parse(readFileSync(join(workspaceRoot, "tools/ai/fixtures/skirmish-v1.json"), "utf8"))
          : null;
        if (manifest && (!Array.isArray(manifest.rows) || manifest.manifestVersion !== "skirmish-v1"))
          throw new Error("repair_report_invalid_manifest");
        const entries = resolveRepairReportPaths(options.input).map((path) => ({
          path: relative(workspaceRoot, path) || path,
          report: decodeRuntimeArtifact(JSON.parse(readFileSync(path, "utf8")))
        }));
        const expectedIds = manifest?.rows.filter((row) => row.drivers.includes("runtime") &&
          row.runtimeSupport?.status !== "deferred_content").map((row) => row.id);
        const repair = buildRepairReport(entries, {
          expectedIds,
          ...(options.maxClusters === null ? {} : { maxClusters: options.maxClusters }),
          ...(options.maxBytes === null ? {} : { maxBytes: options.maxBytes })
        });
        process.stdout.write(`${JSON.stringify(repair)}\n`);
        if (repair.status !== "passed") process.exitCode = 1;
      } else {
        if (options.requireSupported || options.maxClusters !== null || options.maxBytes !== null)
          throw new Error("repair_options_need_repair_list");
        const path = resolveReportPath(options.input);
        const report = JSON.parse(readFileSync(path, "utf8"));
        process.stdout.write(`${summarizeReport(report, { ...options, path })}\n`);
      }
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
