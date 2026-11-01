#!/usr/bin/env node
import { spawn } from "node:child_process";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { resolveAiRegressionSelection } from "../regression/ai-regression-selection.ts";
import { executeAiRegressionCases } from "../regression/ai-regression-execution.ts";

import { workspaceRoot as root } from "../shared/workspace-paths.ts";
const args = parseArgs(process.argv.slice(2));
const fixtureDirectory = join(root, "tools/probable-waffle/skirmish/ai/testing/fixtures");
const pack = readJson(join(fixtureDirectory, "periodic-native-regression-profiles.json"));
const manifest = readJson(join(fixtureDirectory, "skirmish-scenario-manifest.json"));
const selection = resolveAiRegressionSelection(
  pack,
  manifest,
  (reference) => readJson(join(fixtureDirectory, reference)),
  args.profile
);

if (args.help) {
  process.stdout.write("Usage: pnpm ai:regression [--profile core|scout] [--list | --case CASE_ID]\n");
  process.exit(0);
}
if (args.list) {
  const outputDirectory = join(root, "tmp/ai-skirmish-regression");
  mkdirSync(outputDirectory, { recursive: true });
  const selectionPath = join(outputDirectory, "selection.json");
  writeFileSync(selectionPath, `${JSON.stringify(selection, null, 2)}\n`);
  const omittedByReason = Object.groupBy(selection.omissions, (entry) => entry.reason);
  process.stdout.write(
    `${JSON.stringify(
      {
        packId: selection.packId,
        preflight: pack.preflight,
        selectedCases: selection.selected.map(({ caseId, scenarioId, variantId, evidence, variants }) => ({
          caseId,
          scenarioId,
          variantId,
          evidence,
          variants
        })),
        estimatedWallMs: selection.estimatedWallMs,
        runtimeEstimateMinutes: Number((selection.estimatedWallMs / 60000).toFixed(1)),
        runtimeBudgetMinutes: selection.runtimeBudgetMs / 60000,
        omittedVariantCount: selection.omissions.length,
        omittedScenarioCount: new Set(selection.omissions.map((entry) => entry.scenarioId)).size,
        omissionsByReason: Object.fromEntries(
          Object.entries(omittedByReason).map(([reason, entries]) => [reason, entries.length])
        ),
        machineReadableSelection: selectionPath
      },
      null,
      2
    )}\n`
  );
  process.exit(0);
}

const cases = args.caseId ? selection.selected.filter((entry) => entry.caseId === args.caseId) : selection.selected;
if (args.caseId && cases.length !== 1) throw new Error(`ai_regression_case_not_selected:${args.caseId}`);
if (cases.length === 0) throw new Error("ai_regression_empty_selection");

const startedAt = Date.now();
const startedAtIso = new Date(startedAt).toISOString();
const sourceRevision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const results = [];
const outputDirectory = join(root, "tmp/ai-skirmish-regression");
mkdirSync(outputDirectory, { recursive: true });
const summaryPath = join(outputDirectory, "latest.json");
let preflight = null;

process.stdout.write(
  `AI regression ${cases.length} case${cases.length === 1 ? "" : "s"}; ` +
    `estimated ${(cases.reduce((sum, entry) => sum + entry.estimatedWallMs, 0) / 60000).toFixed(1)} min; ` +
    `hard cap ${selection.runtimeBudgetMs / 60000} min.\n`
);
process.stdout.write(`${pack.preflight.purpose}\n`);
preflight = await runPreflight(selection.runtimeBudgetMs - (Date.now() - startedAt));
process.stdout.write(
  `AI gameplay preflight ${preflight.status}${preflight.wallMs === undefined ? "" : ` (${(preflight.wallMs / 1000).toFixed(1)}s)`}.\n`
);
if (preflight.status !== "passed") {
  writeSummary();
  process.stderr.write(
    "AI regression stopped before native cases because focused gameplay checks failed or timed out.\n"
  );
  process.exit(1);
}

let completed = 0;
await executeAiRegressionCases({
  cases,
  budgetMs: Math.max(1, selection.runtimeBudgetMs - (Date.now() - startedAt)),
  runCase: (entry, remainingMs) => {
    process.stdout.write(`[${completed + 1}/${cases.length}] ${entry.caseId} — ${entry.covers}\n`);
    return runVariant(entry, remainingMs);
  },
  onResult: (result) => {
    completed++;
    results.push(result);
    const elapsed = result.wallMs === undefined ? "" : ` (${(result.wallMs / 1000).toFixed(0)}s)`;
    const artifact = result.artifact ? ` — ${result.artifact}` : "";
    process.stdout.write(`  ${result.status}${elapsed}${artifact}\n`);
    writeSummary();
  }
});

const failed = results.some((result) => !successful(result));
writeSummary();
process.stdout.write(`AI regression ${failed ? "FAILED" : "PASSED"}; results: ${summaryPath}\n`);
if (failed) process.exitCode = 1;

function successful(result) {
  const entry = cases.find((candidate) => candidate.caseId === result.caseId);
  return result.status === (entry?.family ? "passed" : "diagnostic_passed");
}

function writeSummary() {
  const summary = {
    schemaVersion: 1,
    packId: selection.packId,
    status:
      preflight && preflight.status !== "passed"
        ? "failed"
        : results.length !== cases.length
          ? "in_progress"
          : results.every((result) => successful(result))
            ? "passed"
            : "failed",
    sourceRevision,
    startedAt: startedAtIso,
    elapsedMs: Date.now() - startedAt,
    runtimeBudgetMs: selection.runtimeBudgetMs,
    estimatedWallMs: cases.reduce((sum, entry) => sum + entry.estimatedWallMs, 0),
    selectedCases: cases.map(({ caseId, scenarioId, variantId, repetition, evidence, covers, family, variants }) => ({
      caseId,
      scenarioId,
      variantId,
      repetition,
      evidence,
      covers,
      family,
      variants
    })),
    omissions: selection.omissions,
    preflight,
    results
  };
  writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
}

function runPreflight(remainingMs) {
  const started = Date.now();
  const child = spawn(
    process.execPath,
    [
      join(root, "node_modules/nx/dist/bin/nx.js"),
      "test",
      pack.preflight.project,
      "--runInBand",
      `--testPathPattern=${pack.preflight.testPathPattern}`
    ],
    {
      cwd: root,
      stdio: "inherit",
      detached: process.platform !== "win32",
      windowsHide: true
    }
  );
  let timedOut = false;
  const timeout = setTimeout(
    () => {
      timedOut = true;
      killTree(child);
    },
    Math.min(pack.preflight.timeoutMs, Math.max(1, remainingMs))
  );
  return new Promise((resolveResult) => {
    child.once("error", (error) =>
      resolveResult({ status: "failed", wallMs: Date.now() - started, error: error.message })
    );
    child.once("close", (code, signal) =>
      resolveResult({
        status: timedOut ? "timeout" : code === 0 ? "passed" : "failed",
        wallMs: Date.now() - started,
        exitCode: code,
        signal
      })
    );
  }).finally(() => clearTimeout(timeout));
}

async function runVariant(entry, remainingMs) {
  const started = Date.now();
  const childArgs = [
    join(root, "tools/probable-waffle/skirmish/ai/cli/run-skirmish-matrix.ts"),
    "--scenario",
    entry.scenarioId,
    "--mode",
    "runtime",
    ...(entry.family ? [] : ["--variant", entry.variantId, "--repetition", String(entry.repetition)])
  ];
  const child = spawn(process.execPath, childArgs, {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
    windowsHide: true
  });
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    const value = chunk.toString();
    stdout += value;
    process.stdout.write(value);
  });
  child.stderr.on("data", (chunk) => {
    const value = chunk.toString();
    stderr += value;
    process.stderr.write(value);
  });
  let timedOut = false;
  const timeout = setTimeout(
    () => {
      timedOut = true;
      killTree(child);
    },
    Math.min(remainingMs, 30 * 60 * 1000)
  );
  const exit = await new Promise<{ code: number | null; signal: NodeJS.Signals | null }>((resolveExit, reject) => {
    child.once("error", reject);
    child.once("close", (code, signal) => resolveExit({ code, signal }));
  }).finally(() => clearTimeout(timeout));
  const wallMs = Date.now() - started;
  const artifact = stdout.match(/tmp[\\/]ai-skirmish-matrix[\\/][^\r\n]+\.json/)?.[0];
  const artifactPath = artifact ? resolve(root, artifact) : null;
  const report = artifactPath ? readJson(artifactPath, false) : null;
  return {
    caseId: entry.caseId,
    scenarioId: entry.scenarioId,
    variantId: entry.variantId,
    repetition: entry.repetition,
    status: timedOut
      ? "timeout"
      : exit.code === 0
        ? (report?.status ?? "runner_report_missing")
        : `runner_failed_${exit.code ?? exit.signal ?? "unknown"}`,
    wallMs,
    artifact: artifactPath,
    sourceRevision: report?.runtime?.sourceRevision ?? report?.candidate ?? null,
    fixtureDigest: report?.runtime?.fixtureDigest ?? report?.fixtureDigest ?? null,
    dirtySourceDigest: report?.runtime?.dirtySourceDigest ?? report?.dirtySourceDigest ?? null,
    failures: report?.runtime?.scenarios?.flatMap((scenario) => scenario.failures ?? []) ?? [],
    exitCode: exit.code,
    signal: exit.signal,
    stderr: stderr.slice(-3000)
  };
}

function killTree(child) {
  if (process.platform === "win32" && child.pid) {
    spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
  } else if (child.pid) {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      child.kill("SIGTERM");
    }
  }
}

function readJson(path, required = true) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    if (!required && error?.code === "ENOENT") return null;
    throw error;
  }
}

function parseArgs(values) {
  const parsed = { list: false, help: false, caseId: null, profile: process.env.AI_REGRESSION_PROFILE ?? "core" };
  if (values[0] === "--") values = values.slice(1);
  for (let index = 0; index < values.length; index++) {
    const value = values[index];
    if (value === "--list" || value === "--dry-run") parsed.list = true;
    else if (value === "--help" || value === "-h") parsed.help = true;
    else if (value === "--profile" && values[index + 1]) parsed.profile = values[++index];
    else if (value === "--case" && values[index + 1]) parsed.caseId = values[++index];
    else throw new Error(`unknown_ai_regression_argument:${value}`);
  }
  if (parsed.list && parsed.caseId) throw new Error("ai_regression_list_conflicts_with_case");
  return parsed;
}
