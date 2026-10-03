#!/usr/bin/env node
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { inspectCacheEvidence } from "./cache-evidence.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDirectory, "../..");

export function parseArguments(args) {
  const options = { workflowIds: [] };
  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--") continue;
    if (argument === "--help") options.help = true;
    else if (argument === "--workflow") options.workflowIds.push(requiredValue(args[++index], "workflow"));
    else if (argument === "--output") options.output = requiredValue(args[++index], "output");
    else if (argument === "--benchmark") options.benchmark = requiredValue(args[++index], "benchmark");
    else throw new Error(`unknown_argument:${argument}`);
  }
  return options;
}

export function validateBenchmark(benchmark) {
  if (benchmark?.schemaVersion !== 1) throw new Error("unsupported_benchmark_schema");
  if (typeof benchmark.id !== "string" || !benchmark.id) throw new Error("missing_benchmark_id");
  if (!Array.isArray(benchmark.qualityInvariants) || benchmark.qualityInvariants.length === 0)
    throw new Error("missing_quality_invariants");
  if (!Array.isArray(benchmark.workflows) || benchmark.workflows.length === 0) throw new Error("missing_workflows");
  const ids = new Set();
  for (const workflow of benchmark.workflows) {
    if (!workflow?.id || ids.has(workflow.id)) throw new Error(`invalid_workflow_id:${workflow?.id ?? "missing"}`);
    ids.add(workflow.id);
    if (!Array.isArray(workflow.contextFiles) || workflow.contextFiles.length === 0)
      throw new Error(`missing_context_files:${workflow.id}`);
    if (!Array.isArray(workflow.commands) || workflow.commands.length === 0)
      throw new Error(`missing_commands:${workflow.id}`);
    for (const command of workflow.commands) {
      if (typeof command.executable !== "string" || !Array.isArray(command.arguments))
        throw new Error(`invalid_command:${workflow.id}`);
      if (!new Set(["passed", "failed", "unavailable"]).has(command.expectedOutcome))
        throw new Error(`invalid_expected_outcome:${workflow.id}`);
    }
  }
  return benchmark;
}

export function measureBenchmark({
  root,
  benchmark,
  workflowIds = [],
  execute = executeCommand,
  now = process.hrtime.bigint
}) {
  validateBenchmark(benchmark);
  const workflows = selectWorkflows(benchmark.workflows, workflowIds);
  const benchmarkDigest = digest(JSON.stringify(benchmark));
  const outputDirectory = resolve(root, "tmp", "agent-efficiency", `${benchmark.id}-v${benchmark.version}`);
  mkdirSync(outputDirectory, { recursive: true });
  const measuredWorkflows = workflows.map((workflow) =>
    measureWorkflow({ root, workflow, outputDirectory, execute, now })
  );
  const matching = measuredWorkflows.every((workflow) => workflow.matchesExpectedOutcome);
  return {
    schemaVersion: 1,
    benchmark: { id: benchmark.id, version: benchmark.version, digest: benchmarkDigest },
    provenance: readProvenance(root),
    tokenTelemetry: benchmark.tokenTelemetry,
    qualityInvariants: benchmark.qualityInvariants,
    workflows: measuredWorkflows,
    totals: summarizeWorkflows(measuredWorkflows),
    status: matching ? "measured" : "failed"
  };
}

export function writeMeasurement(root, report, output) {
  const directory = output ? resolveInside(root, output) : resolve(root, "tmp", "agent-efficiency", "reports");
  mkdirSync(directory, { recursive: true });
  const path = join(directory, `${report.benchmark.id}-v${report.benchmark.version}-${Date.now()}.json`);
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
  return path;
}

function measureWorkflow({ root, workflow, outputDirectory, execute, now }) {
  const context = measureContext(root, workflow.contextFiles);
  const commands = workflow.commands.map((command, index) => {
    const start = now();
    const result = execute(command, root);
    const elapsedMilliseconds = Number(now() - start) / 1_000_000;
    const stdout = result.stdout ?? "";
    const stderr = result.stderr ?? "";
    const prefix = `${workflow.id}-${index + 1}`;
    const stdoutPath = join(outputDirectory, `${prefix}.stdout.log`);
    const stderrPath = join(outputDirectory, `${prefix}.stderr.log`);
    writeFileSync(stdoutPath, stdout);
    writeFileSync(stderrPath, stderr);
    const outcome = commandOutcome(result);
    return {
      command: { executable: command.executable, arguments: command.arguments },
      expectedOutcome: command.expectedOutcome,
      outcome,
      expectedOutputPresent: (command.outputIncludes ?? []).every((value) => `${stdout}\n${stderr}`.includes(value)),
      elapsedMilliseconds: rounded(elapsedMilliseconds),
      output: {
        stdoutBytes: Buffer.byteLength(stdout),
        stderrBytes: Buffer.byteLength(stderr),
        stdoutLines: lineCount(stdout),
        stderrLines: lineCount(stderr),
        cache: inspectCacheEvidence(`${stdout}\n${stderr}`),
        retainedLogs: [relative(root, stdoutPath), relative(root, stderrPath)]
      },
      errorCode: result.errorCode ?? null
    };
  });
  const matchesExpectedOutcome = commands.every(
    (command) => command.outcome === command.expectedOutcome && command.expectedOutputPresent
  );
  return {
    id: workflow.id,
    description: workflow.description,
    context,
    requiredSelections: workflow.requiredSelections,
    declaredStarts: workflow.declaredStarts,
    observedDirectProcessStarts: commands.length,
    commands,
    matchesExpectedOutcome
  };
}

function selectWorkflows(workflows, workflowIds) {
  if (workflowIds.length === 0) return workflows;
  const selected = workflowIds.map((id) => workflows.find((workflow) => workflow.id === id));
  if (selected.some((workflow) => !workflow)) throw new Error(`unknown_workflow:${workflowIds.join(",")}`);
  return selected;
}

function measureContext(root, files) {
  const entries = files.map((file) => {
    const path = resolveInside(root, file);
    return { path: file, bytes: statSync(path).size, digest: digest(readFileSync(path)) };
  });
  return { files: entries, bytes: entries.reduce((total, entry) => total + entry.bytes, 0) };
}

function executeCommand(command, root) {
  const result = spawnSync(command.executable, command.arguments, {
    cwd: root,
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024
  });
  return {
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    errorCode: result.error?.code ?? null
  };
}

function commandOutcome(result) {
  if (result.errorCode === "ENOENT") return "unavailable";
  return result.status === 0 ? "passed" : "failed";
}

function summarizeWorkflows(workflows) {
  const commands = workflows.flatMap((workflow) => workflow.commands);
  return {
    workflows: workflows.length,
    directProcessStarts: commands.length,
    declaredServerStarts: sum(workflows, (workflow) => workflow.declaredStarts.server),
    declaredBrowserStarts: sum(workflows, (workflow) => workflow.declaredStarts.browser),
    declaredWorkerStarts: sum(workflows, (workflow) => workflow.declaredStarts.worker),
    wallMilliseconds: rounded(sum(commands, (command) => command.elapsedMilliseconds)),
    contextBytes: sum(workflows, (workflow) => workflow.context.bytes),
    outputBytes: sum(commands, (command) => command.output.stdoutBytes + command.output.stderrBytes),
    outputLines: sum(commands, (command) => command.output.stdoutLines + command.output.stderrLines),
    cacheTextIndicators: sum(commands, (command) => command.output.cache.mentionCount),
    cacheHitCount: sum(commands, (command) => command.output.cache.hitCount),
    cacheMissCount: sum(commands, (command) => command.output.cache.missCount),
    retainedLogBytes: sum(commands, (command) => command.output.stdoutBytes + command.output.stderrBytes)
  };
}

function readProvenance(root) {
  const head = spawnSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" });
  const status = spawnSync("git", ["status", "--porcelain=v1"], { cwd: root, encoding: "utf8" });
  return {
    revision: head.status === 0 ? head.stdout.trim() : null,
    worktreeStatus: status.status === 0 ? status.stdout.trim().split("\n").filter(Boolean) : ["unavailable"],
    nodeVersion: process.version
  };
}

function resolveInside(root, path) {
  if (isAbsolute(path)) throw new Error(`absolute_path_not_allowed:${path}`);
  const base = resolve(root);
  const target = resolve(base, path);
  if (!target.startsWith(`${base}${sep}`)) throw new Error(`path_escapes_workspace:${path}`);
  return target;
}

function requiredValue(value, name) {
  if (!value || value.startsWith("--")) throw new Error(`missing_${name}`);
  return value;
}

function digest(value) {
  return createHash("sha256").update(value).digest("hex");
}

function lineCount(value) {
  return value ? value.split("\n").length : 0;
}

function rounded(value) {
  return Number(value.toFixed(2));
}

function sum(values, select) {
  return values.reduce((total, value) => total + select(value), 0);
}

function helpText() {
  return [
    "Measure declared repository workflows without inventing token telemetry.",
    "",
    "Usage:",
    "  node tools/agent/measure-workflows.mjs [--workflow ID] [--output DIRECTORY] [--benchmark PATH]",
    "",
    "Raw logs and reports default to ignored tmp/agent-efficiency/.",
    ""
  ].join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(helpText());
    else {
      const benchmarkPath = options.benchmark
        ? resolveInside(workspaceRoot, options.benchmark)
        : join(scriptDirectory, "benchmarks", "repository-workflows-v1.json");
      const benchmark = JSON.parse(readFileSync(benchmarkPath, "utf8"));
      const report = measureBenchmark({ root: workspaceRoot, benchmark, workflowIds: options.workflowIds });
      const path = writeMeasurement(workspaceRoot, report, options.output);
      process.stdout.write(`MEASUREMENT ${relative(workspaceRoot, path)} status=${report.status}\n`);
      if (report.status !== "measured") process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
