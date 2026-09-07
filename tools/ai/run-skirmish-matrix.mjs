#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import { resolvePinnedBaselineSupport } from "./baseline-adapter-v1.mjs";

const toolDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(toolDirectory, "../..");
const fixtureDirectory = join(toolDirectory, "fixtures");
const reportDirectory = join(workspaceRoot, "tmp/ai-skirmish-matrix");
const manifestPath = join(fixtureDirectory, "skirmish-v1.json");
const manifest = readJson(manifestPath, 4 * 1024 * 1024);
const args = parseArguments(process.argv.slice(2));

try {
  validateManifest(manifest);
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
  if (options["compare-bundle"]) return compareBundles(options);
  if (options["replay-bundle"]) return replayBundle(options);
  if (options.suite) return runSuite(options);
  if (options.scenario) return runSelectedScenario(options);
  throw new Error("missing_mode: use --suite, --scenario, --replay-bundle or --compare-bundle");
}

function runSuite(options) {
  const suite = requireEnum(options.suite, ["stage-smoke", "release"], "suite");
  if (suite === "stage-smoke") {
    const stage = requireInteger(options.stage, "stage", 0, 14);
    if (options["working-tree"] !== true) throw new Error("stage_smoke_requires_working_tree");
    const rows = manifest.rows.filter((row) => row.stages.includes(stage));
    if (rows.length === 0) throw new Error(`missing_stage_coverage:${stage}`);
    const runnable = rows.filter((row) => typeof row.fixture === "string");
    if (stage === 5 && runnable.length < 4) throw new Error("stage_5_harness_coverage_missing");
    return invokeHarness({ suite, stage, rows: runnable, options });
  }
  const candidate = requireSha(options.candidate, "candidate");
  const baseline = requireSha(options.baseline, "baseline");
  const baselineManifest = readJson(join(fixtureDirectory, manifest.baseline), 64 * 1024);
  if (baseline !== baselineManifest.baselineSourceSha) throw new Error("baseline_not_pinned_manifest_sha");
  const missing = manifest.rows.filter((row) => row.fixture === null);
  if (missing.length > 0) throw new Error(`mandatory_coverage_missing:${missing.map((row) => row.id).join(",")}`);
  const baselineSupport = manifest.rows.map((row) => ({ id: row.id, ...resolvePinnedBaselineSupport(row, baselineManifest) }));
  throw new Error(
    `release_execution_deferred_to_stage_15_isolated_runner:${candidate}:${baseline}:${baselineSupport.length}`
  );
}

function runSelectedScenario(options) {
  const row = manifest.rows.find((candidate) => candidate.id === options.scenario);
  if (!row) throw new Error(`unknown_scenario:${options.scenario}`);
  if (!row.fixture) throw new Error(`scenario_fixture_not_implemented:${row.id}`);
  const seed = requireInteger(options.seed ?? manifest.defaultSeeds[0], "seed", 0, Number.MAX_SAFE_INTEGER);
  const mode = requireEnum(options.mode ?? "both", ["pure", "runtime", "both"], "mode");
  if (mode !== "both" && !row.drivers.includes(mode)) throw new Error(`scenario_driver_missing:${row.id}:${mode}`);
  return invokeHarness({ suite: "single", seed, mode, rows: [row], options });
}

function invokeHarness(input) {
  const environment = {
    ...process.env,
    AI_SKIRMISH_MATRIX_REQUEST: JSON.stringify({
      schemaVersion: 1,
      manifestVersion: manifest.manifestVersion,
      suite: input.suite,
      stage: input.stage ?? null,
      candidate: input.candidate ?? null,
      baseline: input.baseline ?? null,
      seed: input.seed ?? null,
      mode: input.mode ?? "both",
      scenarioIds: input.rows.map((row) => row.id),
      replayArtifactPath: input.options?.artifactPath ?? null,
      untilTick: input.options?.untilTick ?? null,
      breakOn: input.options?.breakOn ?? null,
      baselineSupport: input.baselineSupport ?? null
    })
  };
  const workingTreeSource = input.suite === "stage-smoke" ? readWorkingTreeSource() : "";
  const workingTreeDigest = workingTreeSource.length > 0 ? digestString(workingTreeSource) : null;
  const fixtureDigest = digestString(JSON.stringify(input.rows.map((row) => ({ row, fixture: row.fixture ? readJson(join(fixtureDirectory, row.fixture), 1024 * 1024) : null }))));
  const command = spawnSync(
    "pnpm",
    [
      "exec",
      "nx",
      "run-many",
      "--target=test",
      "--projects=probable-waffle-gameplay,probable-waffle-phaser",
      "--runInBand",
      "--testPathPatterns=(ai-(scenario-harness|runtime-scenario|repro-cli)|authoritative-state-projection|actor-manager-ai-save)\\.spec\\.ts$"
    ],
    { cwd: workspaceRoot, env: environment, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
  );
  const report = {
    schemaVersion: 1,
    status: command.status === 0 ? "passed" : "failed",
    suite: input.suite,
    manifestVersion: manifest.manifestVersion,
    candidate: input.candidate ?? readHead(),
    dirtySourceDigest: workingTreeDigest,
    fixtureDigest,
    baseline: input.baseline ?? null,
    rows: input.rows.map((row) => row.id),
    contexts: input.rows
      .filter((row) => row.fixture)
      .map((row) => ({ scenarioId: row.id, ...readJson(join(fixtureDirectory, row.fixture), 1024 * 1024).context })),
    workCounts: { scenarios: input.rows.length, decisions: 0, ticks: 0 },
    process: { exitCode: command.status, signal: command.signal, stdout: command.stdout, stderr: command.stderr }
  };
  if (command.error) throw command.error;
  if (command.status !== 0) process.exitCode = 1;
  return report;
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
  if (artifact.manifest.completeness.observation !== "complete" || artifact.manifest.completeness.priorState !== "complete") {
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
  const untilTick = options["until-tick"] === undefined ? null : requireInteger(options["until-tick"], "until-tick", 0, Number.MAX_SAFE_INTEGER);
  const breakOn = options["break-on"] ?? null;
  if (breakOn !== null) requireEnum(breakOn, ["duplicate_effect", "progress_overdue", "mission_cancelled", "command_rejected", "decision_complete"], "break-on");
  if (options["emit-fixture"]) {
    const destination = resolveExplicitPath(options["emit-fixture"]);
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(destination, `${JSON.stringify({ schemaVersion: 1, provenance: artifact.manifest.replayInputs, payload: artifact.payload }, null, 2)}\n`, { flag: "wx" });
  }
  return invokeHarness({ suite: "replay", rows: [scenarioRow(artifact.manifest.replayInputs.scenarioId)], options: { ...options, untilTick, breakOn, artifactPath } });
}

function compareBundles(options) {
  const original = readJson(resolveExplicitPath(options["compare-bundle"]), 16 * 1024 * 1024);
  const candidate = readJson(resolveExplicitPath(required(options["with-bundle"], "with-bundle")), 16 * 1024 * 1024);
  validateArtifact(original);
  validateArtifact(candidate);
  const inputDifference = firstDifference(original.manifest.replayInputs, candidate.manifest.replayInputs);
  const outputDifference = inputDifference ? null : firstDifference(comparisonOutput(original), comparisonOutput(candidate));
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
    ? artifact.payload.expectedResult ?? null
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

function validateManifest(value) {
  if (!value || value.schemaVersion !== 1 || value.manifestVersion !== "skirmish-v1" || !Array.isArray(value.rows)) throw new Error("malformed_manifest");
  if (value.rows.length !== value.requiredCaseCount || value.requiredCaseCount !== 121) throw new Error(`manifest_case_count:${value.rows.length}`);
  if (!safeReference(value.baseline)) throw new Error("unsafe_baseline_manifest_reference");
  const ids = new Set();
  for (const row of value.rows) {
    if (!row || typeof row.id !== "string" || !/^[A-Z]+-[0-9]{2}$/.test(row.id) || ids.has(row.id)) throw new Error(`invalid_manifest_row:${row?.id ?? "unknown"}`);
    if (
      !Array.isArray(row.stages) ||
      row.stages.length === 0 ||
      row.stages.some((stage) => !Number.isSafeInteger(stage) || stage < 0 || stage > 15) ||
      !Array.isArray(row.drivers) ||
      row.drivers.length === 0 ||
      row.drivers.some((driver) => driver !== "pure" && driver !== "runtime")
    ) {
      throw new Error(`incomplete_manifest_row:${row.id}`);
    }
    if (row.fixture !== null) {
      if (!safeReference(row.fixture)) throw new Error(`unsafe_fixture_reference:${row.id}`);
      const fixture = readJson(join(fixtureDirectory, row.fixture), 1024 * 1024);
      if (!Array.isArray(fixture.scenarioIds) || !fixture.scenarioIds.includes(row.id)) {
        throw new Error(`fixture_identity_mismatch:${row.id}`);
      }
    }
    ids.add(row.id);
  }
}

function validateArtifact(value) {
  if (!value || typeof value !== "object" || !value.manifest || !value.payload) throw new Error("malformed_repro_artifact");
  const bundle = value.manifest;
  if (bundle.schemaVersion !== 1 || (bundle.kind !== "decision" && bundle.kind !== "runtime")) throw new Error("unsupported_repro_version");
  if (!bundle.replayInputs || !safeReference(bundle.replayInputs.snapshotReference) || !safeReference(bundle.replayInputs.inputReference)) throw new Error("unsafe_repro_reference");
  if (containsMarkup(value)) throw new Error("unsafe_repro_markup");
}

function safeReference(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 512 && !value.startsWith("/") && !value.includes("..") && !value.includes("\\") && !value.includes(":");
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

function readJson(path, maxBytes) {
  const text = readFileSync(path, "utf8");
  if (Buffer.byteLength(text) > maxBytes) throw new Error(`oversized_json:${path}`);
  return JSON.parse(text);
}

function resolveExplicitPath(value) {
  const supplied = required(value, "path");
  if (supplied.includes("\0")) throw new Error("invalid_path");
  return isAbsolute(supplied) ? resolve(supplied) : resolve(process.cwd(), supplied);
}

function requireInteger(value, label, minimum, maximum) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < minimum || number > maximum) throw new Error(`invalid_${label}`);
  return number;
}

function requireSha(value, label) {
  const sha = required(value, label);
  if (!/^[a-f0-9]{40}$/.test(sha)) throw new Error(`invalid_${label}_sha`);
  return sha;
}

function requireEnum(value, choices, label) {
  if (!choices.includes(value)) throw new Error(`invalid_${label}:${value}`);
  return value;
}

function required(value, label) {
  if (typeof value !== "string" || value.length === 0) throw new Error(`missing_${label}`);
  return value;
}

function readHead() {
  const result = spawnSync("git", ["rev-parse", "HEAD"], { cwd: workspaceRoot, encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim() : "working-tree";
}

function readGitText(arguments_) {
  const result = spawnSync("git", arguments_, { cwd: workspaceRoot, encoding: "utf8" });
  if (result.status !== 0) throw new Error(`git_inspection_failed:${arguments_.join("_")}`);
  return result.stdout;
}

function readWorkingTreeSource() {
  const tracked = readGitText(["diff", "--no-ext-diff", "HEAD", "--"]);
  const untrackedPaths = readGitText(["ls-files", "--others", "--exclude-standard", "-z"])
    .split("\0")
    .filter(Boolean)
    .sort();
  const untracked = untrackedPaths.map((path) => {
    const absolutePath = resolve(workspaceRoot, path);
    if (relative(workspaceRoot, absolutePath).startsWith("..")) throw new Error(`unsafe_untracked_path:${path}`);
    return `${path}\0${readFileSync(absolutePath).toString("base64")}`;
  });
  return tracked.length > 0 || untracked.length > 0 ? `${tracked}\0${untracked.join("\0")}` : "";
}

function digestString(input) {
  let hash = 0x811c9dc5;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

function writeReport(report) {
  mkdirSync(reportDirectory, { recursive: true });
  const name = `${Date.now()}-${report.status ?? "report"}.json`;
  const path = join(reportDirectory, name);
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`);
  process.stdout.write(`${relative(workspaceRoot, path)}\n`);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
