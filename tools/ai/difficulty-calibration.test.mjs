import assert from "node:assert/strict";
import { test } from "node:test";
import { readFileSync } from "node:fs";
import { calibrationJobs, calibrationSeedRounds, calibrationSoakJobs } from "./difficulty-calibration-plan.mjs";
import { analyzeCalibration, calibrationVerdict } from "./difficulty-calibration-analysis.mjs";

const specification = JSON.parse(readFileSync(new URL("./fixtures/difficulty-calibration-v1.json", import.meta.url)));
test("frozen cells cover maps/factions/opponents, real side swaps and all policies without tuning on holdout", () => {
  const rounds = calibrationSeedRounds(specification);
  assert.deepEqual(rounds.map((round) => round.length), [20, 20, 20, 20, 20]);
  const jobs = calibrationJobs(specification, rounds[0], "calibration");
  assert.equal(jobs.length, 120);
  assert.equal(new Set(jobs.map((job) => `${job.faction}:${job.mapLabel}:${job.opponentArchetype}`)).size, 20);
  for (const seed of rounds[0]) assert.equal(jobs.filter((job) => job.seed === seed).length, 6);
  const holdout = calibrationJobs(specification, specification.pairedRuns.holdoutSeeds, "holdout");
  assert.equal(holdout.length, 30);
  assert.equal(new Set(holdout.map((job) => job.faction)).size, 2);
  assert.equal(new Set(holdout.map((job) => job.mapLabel)).size, 2);
  assert.equal(new Set(holdout.map((job) => job.opponentArchetype)).size, 5);
  assert.deepEqual(calibrationSoakJobs(specification).map((job) => job.maximumTick), [72000, 72000, 72000]);
  const overlap = structuredClone(specification); overlap.execution.uncertaintyExtension.firstSeed = rounds[0][0];
  assert.throws(() => calibrationSeedRounds(overlap), /seeds_overlap/);
});

const records = calibrationJobs(specification, specification.pairedRuns.seeds, "calibration").map((job) => ({ job,
  status: "completed", result: job.difficulty === "Easy" ? "loss" : "win",
  initialPhysicalDigest: `start:${job.seed}:${job.targetPlayerNumber}`,
  opponentArchetype: `opening:${job.opponentArchetype}`, opponentProfile: "normal", tick: 1000, decisions: 10, failures: [] }));
test("confidence counts independent paired seeds, exposes indistinguishable levels and refuses missing or changed starts", () => {
  const results = analyzeCalibration(records, specification.pairedRuns.difficultyPairs);
  assert.equal(results[0].completedPairCount, 20);
  assert.equal(results[0].trend, "higher_challenge");
  assert.equal(results[1].trend, "indistinguishable");
  assert.equal(analyzeCalibration(records.slice(1), specification.pairedRuns.difficultyPairs)[0].trend, "insufficient_evidence");
  const changed = structuredClone(records); changed[1].initialPhysicalDigest = "extra-resource-or-stat-start";
  assert.equal(analyzeCalibration(changed, specification.pairedRuns.difficultyPairs)[0].fairnessFailures.length, 1);
  const duplicate = [...records, records[1]];
  assert.equal(analyzeCalibration(duplicate, specification.pairedRuns.difficultyPairs)[0].trend, "insufficient_evidence");
});

test("short terminal samples, absent holdout and unsupported pinned policies can never become acceptance", () => {
  const verdict = calibrationVerdict(records, specification);
  assert.equal(verdict.status, "failed");
  assert.ok(verdict.failures.includes("three_complete_sixty_minute_soaks_missing"));
  assert.ok(verdict.failures.includes("holdout_not_confirmed"));
  assert.ok(verdict.failures.includes("pinned_baseline_difficulty_and_opening_comparison_unsupported"));
  assert.equal(verdict.baseline.comparisonStatus, "unsupported_legacy_difficulty_and_opening_policies");
});
