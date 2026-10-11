#!/usr/bin/env node
import { encodeRuntimeArtifact } from "../../apps/portal-e2e/src/e2e/skirmish-ai-runtime-artifact-codec.mjs";
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { resolvePinnedBaselineSupport } from "./baseline-adapter-v1.mjs";
import { invokeHarness, invokeSelectedHarness } from "./skirmish-matrix-execution.mjs";
import { selectDiagnosticVariant } from "./skirmish-runtime-diagnostic-selection.mjs";
import { buildSkirmishShardIndex } from "./skirmish-shard-index.mjs";
import {
  fixtureReference, pureFixtureReference, runtimeFixtureReference, safeReference, validateManifest
} from "./skirmish-matrix-fixtures.mjs";
import {
  digestString, isRecord, readHead, readJson, readWorkingTreeSource, required, requireEnum, requireInteger,
  requireSha, resolveExplicitPath, workspaceRoot
} from "./skirmish-matrix-io.mjs";

const toolDirectory = dirname(fileURLToPath(import.meta.url));
const args = parseArguments(process.argv.slice(2));
if (args.help === true) {
  process.stdout.write(helpText());
  process.exit(0);
}
const manifestPath = args.manifest
  ? resolveExplicitPath(args.manifest)
  : join(toolDirectory, "fixtures", "skirmish-v1.json");
const fixtureDirectory = dirname(manifestPath);
const reportDirectory = args.output ? resolveExplicitPath(args.output) : join(workspaceRoot, "tmp/ai-skirmish-matrix");
const manifest = readJson(manifestPath, 4 * 1024 * 1024);
const matrixContext = { manifest, workspaceRoot, fixtureDirectory };

try {
  validateManifest(manifest, fixtureDirectory);
  const result = dispatch(args);
  if (result) writeReport(result);
} catch (error) {
  const report = {
    schemaVersion: 1,
    status: "failed",
    reason: error instanceof Error ? error.message : String(error),
    workCounts: { scenarios: 0, decisions: 0, ticks: 0 }
  };
  writeReport(report);
  process.stderr.write(`${report.reason}\n`);
  process.exitCode = 1;
}

function dispatch(options) {
  if (options.variant !== undefined || options.repetition !== undefined) {
    if (!options.scenario || options.scenarios || options.suite || options.candidate || options.baseline ||
        options["replay-bundle"] || options["compare-bundle"]) {
      throw new Error("diagnostic_selection_requires_single_scenario");
    }
  }
  if (options["compare-bundle"]) return compareBundles(options);
  if (options["replay-bundle"]) return replayBundle(options);
  if (options.suite) return runSuite(options);
  if (options.scenarios) return runSelectedScenarios(options);
  if (options.scenario) return runSelectedScenario(options);
  if (options.candidate || options.baseline) return runSuite({ ...options, suite: "release" });
  throw new Error(
    "missing_mode: use --candidate with --baseline, --suite, --scenario, --scenarios, --replay-bundle or --compare-bundle"
  );
}

function runSuite(options) {
  const suite = requireEnum(options.suite, ["stage-smoke", "release"], "suite");
  if (suite === "stage-smoke") {
    const stage = requireInteger(options.stage, "stage", 0, 15);
    if (options["working-tree"] !== true) throw new Error("stage_smoke_requires_working_tree");
    const rows = manifest.rows.filter((row) => row.stages.includes(stage));
    if (rows.length === 0) throw new Error(`missing_stage_coverage:${stage}`);
    const runnable = rows.filter((row) => typeof fixtureReference(row) === "string");
    if (stage === 5 && runnable.length < 4) throw new Error("stage_5_harness_coverage_missing");
    return invokeSelectedHarness({ suite, stage, rows: runnable, mode: "both", options }, matrixContext);
  }
  const candidate = requireSha(options.candidate, "candidate");
  const baseline = requireSha(options.baseline, "baseline");
  const baselineManifest = readJson(join(fixtureDirectory, manifest.baseline), 64 * 1024);
  if (baseline !== baselineManifest.baselineSourceSha) throw new Error("baseline_not_pinned_manifest_sha");
  const missingRuntime = manifest.rows.filter(
    (row) => row.drivers.includes("runtime") && row.runtimeSupport?.status !== "deferred_content" &&
      runtimeFixtureReference(row) === null
  );
  const missingPure = manifest.rows.filter(
    (row) => row.drivers.includes("pure") && pureFixtureReference(row, fixtureDirectory) === null
  );
  if (missingRuntime.length > 0 || missingPure.length > 0) {
    throw new Error(
      `mandatory_coverage_missing:runtime=${missingRuntime.map((row) => row.id).join(",")};pure=${missingPure
        .map((row) => row.id)
        .join(",")}`
    );
  }
  const baselineSupport = manifest.rows.map((row) => ({
    id: row.id,
    ...resolvePinnedBaselineSupport(row, baselineManifest)
  }));
  if (readHead() !== candidate) throw new Error(`candidate_source_not_checked_out:${candidate}`);
  if (readWorkingTreeSource().length > 0) throw new Error("candidate_source_is_dirty");
  const report = invokeSelectedHarness({
    suite,
    mode: "both",
    rows: manifest.rows,
    options,
    candidate,
    baseline,
    baselineSupport
  }, matrixContext);
  const unexecutedBaselineRuntime = baselineSupport
    .filter((support) => support.runtime.status === "supported")
    .map((support) => support.id);
  if (report.status === "passed" && unexecutedBaselineRuntime.length > 0) {
    process.exitCode = 1;
    return {
      ...report,
      status: "blocked",
      reason: "baseline_runtime_adapter_not_implemented",
      baselineSupport,
      unexecutedBaselineRuntime
    };
  }
  return { ...report, baselineSupport, unexecutedBaselineRuntime };
}

function runSelectedScenario(options) {
  return runSelectedScenarios({ ...options, scenarios: options.scenario });
}

function runSelectedScenarios(options) {
  const scenarioIds = String(options.scenarios)
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
  if (scenarioIds.length === 0) throw new Error("missing_scenarios");
  if (new Set(scenarioIds).size !== scenarioIds.length) throw new Error("duplicate_scenarios");
  const rows = scenarioIds.map((scenarioId) => {
    const row = manifest.rows.find((candidate) => candidate.id === scenarioId);
    if (!row) throw new Error(`unknown_scenario:${scenarioId}`);
    if (pureFixtureReference(row, fixtureDirectory) === null && runtimeFixtureReference(row) === null) {
      throw new Error(`scenario_fixture_not_implemented:${row.id}`);
    }
    return row;
  });
  const allHavePure = rows.every((row) => pureFixtureReference(row, fixtureDirectory) !== null);
  const allHaveRuntime = rows.every((row) => runtimeFixtureReference(row) !== null);
  const defaultMode = allHaveRuntime && allHavePure ? "both" : allHaveRuntime ? "runtime" : "pure";
  const mode = requireEnum(options.mode ?? defaultMode, ["pure", "runtime", "both"], "mode");
  const diagnosticSelection = options.variant === undefined && options.repetition === undefined
    ? null
    : selectedDiagnosticVariant(options, rows, mode);
  const seed =
    options.seed === undefined
      ? mode === "runtime"
        ? null
        : requireInteger(manifest.defaultSeeds[0], "seed", 0, Number.MAX_SAFE_INTEGER)
      : requireInteger(options.seed, "seed", 0, Number.MAX_SAFE_INTEGER);
  const missingPure = rows.filter((row) => pureFixtureReference(row, fixtureDirectory) === null);
  if ((mode === "pure" || mode === "both") && missingPure.length > 0) {
    throw new Error(`scenario_pure_fixture_deferred:${missingPure.map((row) => row.id).join(",")}`);
  }
  const missingRuntime = rows.filter((row) => runtimeFixtureReference(row) === null);
  if ((mode === "runtime" || mode === "both") && missingRuntime.length > 0) {
    throw new Error(`scenario_runtime_fixture_deferred:${missingRuntime.map((row) => row.id).join(",")}`);
  }
  const missingDriver = rows.find((row) => mode !== "both" && !row.drivers.includes(mode));
  if (missingDriver) throw new Error(`scenario_driver_missing:${missingDriver.id}:${mode}`);
  return invokeSelectedHarness(
    { suite: scenarioIds.length === 1 ? "single" : "selection", seed, mode, rows, options, diagnosticSelection },
    matrixContext
  );
}

function selectedDiagnosticVariant(options, rows, mode) {
  if (rows.length !== 1) throw new Error("diagnostic_selection_requires_single_scenario");
  const row = rows[0];
  const reference = runtimeFixtureReference(row);
  if (!reference) throw new Error(`diagnostic_runtime_fixture_missing:${row.id}`);
  const fixture = readJson(join(fixtureDirectory, reference), 1024 * 1024);
  return selectDiagnosticVariant(options, row.id, mode, fixture);
}

function replayBundle(options) {
  const artifactPath = resolveExplicitPath(options["replay-bundle"]);
  const artifact = readJson(artifactPath, 16 * 1024 * 1024);
  validateArtifact(artifact);
  if (artifact.manifest.replayInputs.sourceRevision !== readHead()) {
    throw new Error(`replay_source_not_checked_out:${artifact.manifest.replayInputs.sourceRevision}`);
  }
  const currentWorkingTreeSource = readWorkingTreeSource();
  const currentDirtySourceDigest = currentWorkingTreeSource.length > 0 ? digestString(currentWorkingTreeSource) : null;
  if (artifact.manifest.replayInputs.dirtySourceDigest !== currentDirtySourceDigest) {
    throw new Error("replay_dirty_source_not_checked_out");
  }
  if (
    artifact.manifest.completeness.observation !== "complete" ||
    artifact.manifest.completeness.priorState !== "complete"
  ) {
    throw new Error("replay_not_exact:missing_history");
  }
  if (artifact.manifest.kind === "runtime") {
    const snapshotDigest = digestString(JSON.stringify(artifact.payload));
    const inputDigest = digestString(
      JSON.stringify({ observation: artifact.payload.observation, outcomes: artifact.payload.outcomes })
    );
    if (
      artifact.manifest.replayInputs.snapshotDigest !== snapshotDigest ||
      artifact.manifest.replayInputs.inputDigest !== inputDigest
    ) {
      throw new Error("replay_runtime_digest_mismatch");
    }
  }
  const untilTick =
    options["until-tick"] === undefined
      ? null
      : requireInteger(options["until-tick"], "until-tick", 0, Number.MAX_SAFE_INTEGER);
  const breakOn = options["break-on"] ?? null;
  if (breakOn !== null)
    requireEnum(
      breakOn,
      ["duplicate_effect", "progress_overdue", "mission_cancelled", "command_rejected", "decision_complete"],
      "break-on"
    );
  if (options["emit-fixture"]) {
    const destination = resolveExplicitPath(options["emit-fixture"]);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(
      destination,
      `${JSON.stringify({ schemaVersion: 1, provenance: artifact.manifest.replayInputs, payload: artifact.payload }, null, 2)}\n`,
      { flag: "wx" }
    );
  }
  return invokeHarness({
    suite: "replay",
    rows: [scenarioRow(artifact.manifest.replayInputs.scenarioId)],
    options: { ...options, untilTick, breakOn, artifactPath }
  }, matrixContext);
}

function compareBundles(options) {
  const original = readJson(resolveExplicitPath(options["compare-bundle"]), 16 * 1024 * 1024);
  const candidate = readJson(resolveExplicitPath(required(options["with-bundle"], "with-bundle")), 16 * 1024 * 1024);
  validateArtifact(original);
  validateArtifact(candidate);
  const inputDifference = firstDifference(original.manifest.replayInputs, candidate.manifest.replayInputs);
  const outputDifference = inputDifference
    ? null
    : firstDifference(comparisonOutput(original), comparisonOutput(candidate));
  return {
    schemaVersion: 1,
    status: "compared",
    classification: inputDifference ? "changed_input" : outputDifference ? "same_input_divergence" : "same",
    firstDifference: inputDifference ?? outputDifference,
    firstTick: firstCheckpointDifferenceTick(original, candidate) ?? original.manifest.replayInputs.tick ?? null,
    workCounts: { scenarios: 1, decisions: 0, ticks: 0 }
  };
}

function comparisonOutput(artifact) {
  return artifact.manifest.kind === "decision"
    ? (artifact.payload.expectedResult ?? null)
    : {
        authoritativeProjection: artifact.payload.authoritativeProjection,
        outcomes: artifact.payload.outcomes,
        controllerState: artifact.payload.controllerState
      };
}

function firstCheckpointDifferenceTick(original, candidate) {
  const left = original.manifest.replayInputs.expectedCheckpoints ?? [];
  const right = candidate.manifest.replayInputs.expectedCheckpoints ?? [];
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    if (firstDifference(left[index], right[index])) return left[index]?.tick ?? right[index]?.tick ?? null;
  }
  return null;
}

function scenarioRow(id) {
  if (id === null) throw new Error("bundle_has_no_scenario_id");
  const row = manifest.rows.find((candidate) => candidate.id === id);
  if (!row) throw new Error(`unknown_scenario:${id}`);
  return row;
}

function validateArtifact(value) {
  if (!value || typeof value !== "object" || !value.manifest || !value.payload)
    throw new Error("malformed_repro_artifact");
  const bundle = value.manifest;
  if (bundle.schemaVersion !== 1 || (bundle.kind !== "decision" && bundle.kind !== "runtime"))
    throw new Error("unsupported_repro_version");
  if (
    !bundle.replayInputs ||
    !safeReference(bundle.replayInputs.snapshotReference) ||
    !safeReference(bundle.replayInputs.inputReference)
  )
    throw new Error("unsafe_repro_reference");
  if (containsMarkup(value)) throw new Error("unsafe_repro_markup");
}

function containsMarkup(value) {
  if (typeof value === "string") return /<\/?[a-z]|on[a-z]+\s*=|javascript:/i.test(value);
  if (Array.isArray(value)) return value.some(containsMarkup);
  return value && typeof value === "object" ? Object.values(value).some(containsMarkup) : false;
}

function firstDifference(expected, actual, path = "$") {
  if (Object.is(expected, actual)) return null;
  if (Array.isArray(expected) && Array.isArray(actual)) {
    for (let index = 0; index < Math.max(expected.length, actual.length); index += 1) {
      const difference = firstDifference(expected[index], actual[index], `${path}[${index}]`);
      if (difference) return difference;
    }
    return null;
  }
  if (isRecord(expected) && isRecord(actual)) {
    for (const key of [...new Set([...Object.keys(expected), ...Object.keys(actual)])].sort()) {
      const difference = firstDifference(expected[key], actual[key], `${path}.${key}`);
      if (difference) return difference;
    }
    return null;
  }
  return { path, expected, actual };
}

function parseArguments(tokens) {
  const parsed = {};
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token.startsWith("--")) throw new Error(`unexpected_argument:${token}`);
    const key = token.slice(2);
    const next = tokens[index + 1];
    if (!next || next.startsWith("--")) parsed[key] = true;
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function helpText() {
  return [
    "Run deterministic or real-runtime skirmish AI scenarios.",
    "", "Usage:",
    "  node tools/ai/run-skirmish-matrix.mjs --scenario ID [--mode pure|runtime|both]",
    "  node tools/ai/run-skirmish-matrix.mjs --scenario ID --mode runtime --variant ID --repetition N [--seed INTEGER]",
    "  node tools/ai/run-skirmish-matrix.mjs --scenarios ID,ID [--mode pure|runtime|both]",
    "  node tools/ai/run-skirmish-matrix.mjs --suite stage-smoke --stage N --working-tree",
    "  node tools/ai/run-skirmish-matrix.mjs --candidate SHA --baseline SHA",
    "", "Options:",
    "  --manifest PATH       Override tools/ai/fixtures/skirmish-v1.json",
    "  --output DIRECTORY    Store the JSON artifact in this directory",
    "  --seed INTEGER        Override the authored seed for a selected run",
    "  --variant ID          Diagnostic-only: run one variant of --scenario in runtime mode",
    "  --repetition INTEGER  Diagnostic-only: select one 1-based repetition with --variant",
    "  --help                Show this help without creating a failure artifact",
    "", "Diagnostic replays cannot satisfy full scenario coverage.",
    "Use tools/ai/summarize-skirmish-report.mjs on the emitted artifact.",
    "Group compatible runtime IDs with --scenarios so Playwright starts once.", ""
  ].join("\n");
}

function writeReport(report) {
  mkdirSync(reportDirectory, { recursive: true });
  const name = `${Date.now()}-${report.status ?? "report"}.json`;
  const path = join(reportDirectory, name);
  // Preserve shared captures in storage too; expanding them again would recreate the V8 string-length failure.
  writeFileSync(path, `${JSON.stringify(encodeRuntimeArtifact(report))}\n`);
  process.stdout.write(`${relative(workspaceRoot, path)}\n`);
  if (report.runtime || report.reason) {
    const indexDirectory = join(reportDirectory, "indexes");
    mkdirSync(indexDirectory, { recursive: true });
    const indexPath = join(indexDirectory, name);
    const index = buildSkirmishShardIndex(report, relative(workspaceRoot, path));
    writeFileSync(indexPath, `${JSON.stringify(index, null, 2)}\n`);
    process.stdout.write(`${relative(workspaceRoot, indexPath)}\n`);
  }
}
