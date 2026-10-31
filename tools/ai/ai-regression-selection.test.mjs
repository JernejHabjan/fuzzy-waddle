import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { executeAiRegressionCases } from "./ai-regression-execution.mjs";
import { parseAiRegressionFlag, runE2eWithAiRegression } from "./ai-regression-hook.mjs";
import { resolveAiRegressionSelection } from "./ai-regression-selection.mjs";

const fixtures = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const manifest = readJson("skirmish-v1.json");
const pack = readJson("ai-regression-v1.json");
const readFixture = (reference) => readJson(reference);

test("AI regression selection binds exact manifest variants and reports every omission", () => {
  const resolved = resolveAiRegressionSelection(pack, manifest, readFixture);
  assert.equal(resolved.selected.length, 7);
  assert.equal(resolved.selected.reduce((sum, entry) => sum + entry.estimatedWallMs, 0), 1_347_418);
  assert.ok(resolved.omissions.some((entry) => entry.scenarioId === "D-06" && entry.reason.includes("outside this goal")));
  assert.ok(resolved.omissions.some((entry) => entry.scenarioId === "H-32" && entry.reason.includes("Peer/multiplayer")));
  assert.ok(resolved.omissions.some((entry) => entry.scenarioId === "SCOUT-02" && entry.reason.includes("Not selected")));
});

test("AI regression selection fails closed for empty, stale or over-budget entries", () => {
  assert.throws(() => resolveAiRegressionSelection({ ...pack, selection: [] }, manifest, readFixture), /invalid_ai_regression_pack/);
  const stale = structuredClone(pack);
  stale.selection[0].variantId = "deleted-variant";
  stale.selection[0].evidence[0].variantId = stale.selection[0].variantId;
  assert.throws(() => resolveAiRegressionSelection(stale, manifest, readFixture), /ai_regression_variant_missing/);
  const overBudget = { ...pack, runtimeBudgetMs: 1 };
  assert.throws(() => resolveAiRegressionSelection(overBudget, manifest, readFixture), /estimate_exceeds_budget/);
});

test("regression orchestration continues after a case failure and records timeouts", async () => {
  const cases = pack.selection.slice(0, 3);
  const results = await executeAiRegressionCases({
    cases,
    budgetMs: 30_000,
    runCase: async (entry) => ({ caseId: entry.caseId, status: entry.caseId === cases[0].caseId ? "diagnostic_failed" : "diagnostic_passed" })
  });
  assert.deepEqual(results.map((entry) => entry.status), ["diagnostic_failed", "diagnostic_passed", "diagnostic_passed"]);

  const timedOut = await executeAiRegressionCases({
    cases: cases.slice(0, 1), budgetMs: 30_000,
    runCase: async (entry) => ({ caseId: entry.caseId, status: "timeout" })
  });
  assert.equal(timedOut[0].status, "timeout");
});

test("regression orchestration accounts for budget exhaustion without dropping cases", async () => {
  const cases = pack.selection.slice(0, 3);
  let clock = 0;
  const results = await executeAiRegressionCases({
    cases,
    budgetMs: 10,
    now: () => clock,
    runCase: async (entry) => {
      clock += 6;
      return { caseId: entry.caseId, status: "diagnostic_passed" };
    }
  });
  assert.deepEqual(results.map((entry) => entry.status), ["diagnostic_passed", "diagnostic_passed", "not_run_budget_exhausted"]);
});

test("extended E2E hook is strict, opt-in and runs once only after ordinary E2E succeeds", async () => {
  assert.equal(parseAiRegressionFlag(undefined), false);
  assert.equal(parseAiRegressionFlag("false"), false);
  assert.equal(parseAiRegressionFlag("true"), true);
  for (const invalid of ["", "TRUE", "1", "yes"]) assert.throws(() => parseAiRegressionFlag(invalid), /invalid_RUN_AI_REGRESSION/);

  const calls = [];
  assert.equal(await runE2eWithAiRegression({
    flag: "false", runOrdinaryE2e: async () => { calls.push("ordinary"); return 0; },
    runRegression: async () => { calls.push("regression"); return 0; }
  }), 0);
  assert.deepEqual(calls, ["ordinary"]);
  calls.length = 0;
  assert.equal(await runE2eWithAiRegression({
    flag: "true", runOrdinaryE2e: async () => { calls.push("ordinary"); return 0; },
    runRegression: async () => { calls.push("regression"); return 0; }
  }), 0);
  assert.deepEqual(calls, ["ordinary", "regression"]);
  calls.length = 0;
  assert.equal(await runE2eWithAiRegression({
    flag: "true", runOrdinaryE2e: async () => { calls.push("ordinary"); return 7; },
    runRegression: async () => { calls.push("regression"); return 0; }
  }), 7);
  assert.deepEqual(calls, ["ordinary"]);
});

function readJson(name) {
  return JSON.parse(readFileSync(join(fixtures, name), "utf8"));
}
