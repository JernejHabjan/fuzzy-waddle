#!/usr/bin/env node
import { readFileSync, writeFileSync, mkdirSync, mkdtempSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { calibrationJobs, calibrationSeedRounds, calibrationSoakJobs } from "./difficulty-calibration-plan.mjs";
import { analyzeCalibration, calibrationVerdict } from "./difficulty-calibration-analysis.mjs";
import { createCalibrationEnvironment, executeCalibrationBatch, closeCalibrationEnvironment } from
  "./difficulty-calibration-environment.mjs";
import { PINNED_CALIBRATION_BASELINE } from "./pinned-calibration-adapter.mjs";
import { validNativeScenarioFixture } from "./skirmish-runtime-native-scenario-fixture.mjs";

const args = Object.fromEntries(process.argv.slice(2).map((argument) => {
  const index = argument.indexOf("=");
  if (!argument.startsWith("--") || index < 3) throw new Error("calibration_explicit_arguments_required");
  return [argument.slice(2, index), argument.slice(index + 1)];
}));
const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const sha256 = (text) => `sha256:${createHash("sha256").update(text).digest("hex")}`;
let environment, result, runDirectory;
const records = [];
const identity = { sourceRevision: args.candidate, fixtureDigest: args["fixture-digest"], dirtySourceDigest: null };
try {
  if (!/^[a-f0-9]{40}$/.test(args.candidate ?? "") || args.baseline !== PINNED_CALIBRATION_BASELINE ||
      !args.output || !args.fixture || !args.manifest || !identity.fixtureDigest || existsSync(resolve(args.output)))
    throw new Error("calibration_source_output_or_fixture_identity_invalid");
  if (execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim() !== args.candidate ||
      execFileSync("git", ["status", "--porcelain", "--untracked-files=normal"], { cwd: root, encoding: "utf8" }).trim())
    throw new Error("calibration_requires_clean_pinned_candidate_source");
  const specificationText = readFileSync(join(root, "tools/ai/fixtures/difficulty-calibration-v1.json"), "utf8");
  const specification = JSON.parse(specificationText), fixtureText = readFileSync(resolve(args.fixture), "utf8");
  const fixture = JSON.parse(fixtureText), manifestText = readFileSync(resolve(args.manifest), "utf8");
  if (specification.baseline.sourceRevision !== args.baseline || !validNativeScenarioFixture(fixture, "D-06"))
    throw new Error("calibration_frozen_native_binding_or_baseline_drift");
  const rounds = calibrationSeedRounds(specification), manifestDigest = sha256(manifestText);
  mkdirSync(dirname(resolve(args.output)), { recursive: true });
  runDirectory = mkdtempSync(join(dirname(resolve(args.output)), "calibration-"));
  writeFileSync(join(runDirectory, "frozen-specification.json"), specificationText);
  writeFileSync(join(runDirectory, "frozen-native-fixture.json"), fixtureText);
  writeFileSync(join(runDirectory, "frozen-manifest.json"), manifestText);
  environment = await createCalibrationEnvironment(root, args.candidate, args.baseline, runDirectory);
  const workloadIdentity = { fixtureDigest: identity.fixtureDigest, manifestDigest };
  records.push(...executeCalibrationBatch(environment, calibrationJobs(specification, rounds[0], "calibration", "baseline"),
    fixture, workloadIdentity));
  for (const seeds of rounds) {
    if (records.some((record) => record.failures?.length || record.status === "capture_failed")) break;
    records.push(...executeCalibrationBatch(environment, calibrationJobs(specification, seeds, "calibration"), fixture, workloadIdentity));
    const comparisons = analyzeCalibration(records, specification.pairedRuns.difficultyPairs);
    if (comparisons.every((entry) => entry.trend === "higher_challenge") ||
        comparisons.some((entry) => entry.trend === "regression" || entry.fairnessFailures.length || entry.incompleteSeeds.length)) break;
  }
  const holdout = specification.pairedRuns.holdoutSeeds;
  if (!records.some((record) => record.failures?.length || record.status === "capture_failed")) {
    records.push(...executeCalibrationBatch(environment, calibrationJobs(specification, holdout, "holdout"), fixture, workloadIdentity));
    records.push(...executeCalibrationBatch(environment, calibrationJobs(specification, holdout, "holdout", "baseline"), fixture, workloadIdentity));
    records.push(...executeCalibrationBatch(environment, calibrationSoakJobs(specification), fixture, workloadIdentity));
  }
  const verdict = calibrationVerdict(records, specification);
  writeFileSync(join(runDirectory, "match-index.json"), JSON.stringify(records.map((record) => ({ job: record.job,
    artifact: record.artifact ?? null, tick: record.tick, status: record.status, sourceRevision: record.sourceRevision }))));
  const calibration = { ...verdict, candidate: args.candidate, specificationDigest: sha256(specificationText), manifestDigest,
    baselineAdapter: environment.adapter, matchIndex: join(runDirectory, "match-index.json"),
    attemptedMatches: records.length, holdoutUsedForTuning: false, sourceIsolation: "detached_checkouts_own_lockfiles",
    actualCompletedMatches: records.filter((record) => record.status === "completed").length };
  result = { schemaVersion: 1, ...identity, status: verdict.status, calibration,
    scenarios: [{ scenarioId: "D-06", passed: verdict.status === "passed", failures: verdict.failures }],
    workCounts: { scenarios: 1, decisions: records.reduce((sum, record) => sum + record.decisions, 0),
      ticks: records.reduce((sum, record) => sum + record.tick, 0) } };
} catch (error) {
  result = { schemaVersion: 1, ...identity, status: "failed", scenarios: [{ scenarioId: "D-06", passed: false,
    failures: [String(error).slice(0, 500)] }], workCounts: { scenarios: 1,
      decisions: records.reduce((sum, record) => sum + record.decisions, 0), ticks: records.reduce((sum, record) => sum + record.tick, 0) },
    calibration: { status: "infrastructure_failure", runDirectory: runDirectory ?? null } };
} finally {
  if (environment) try { await closeCalibrationEnvironment(environment); }
  catch (error) { result.status = "failed"; result.scenarios[0].failures.push(`owned_cleanup_failed:${String(error).slice(0, 240)}`); }
}
if (!args.output) throw new Error("calibration_output_required");
const text = JSON.stringify(result);
if (Buffer.byteLength(text) > 8192) throw new Error("calibration_model_summary_byte_limit");
mkdirSync(dirname(resolve(args.output)), { recursive: true });
writeFileSync(resolve(args.output), text, { flag: "wx" });
process.stdout.write(`${text}\n`);
if (result.status !== "passed") process.exitCode = 1;
