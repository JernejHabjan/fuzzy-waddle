import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { executeAiRegressionCases } from "./ai-regression-execution.ts";
import { parseAiRegressionFlag, runE2eWithAiRegression } from "./ai-regression-hook.ts";
import { resolveAiRegressionSelection } from "./ai-regression-selection.ts";

const fixtures = fileURLToPath(new URL("../testing/fixtures/", import.meta.url));
const manifest = readJson("skirmish-scenario-manifest.json");
const pack = readJson("periodic-native-regression-profiles.json");
const readFixture = (reference) => readJson(reference);

test("AI regression selection binds exact manifest variants and reports every omission", () => {
  const resolved = resolveAiRegressionSelection(pack, manifest, readFixture);
  assert.equal(resolved.selected.length, 7);
  assert.equal(
    resolved.selected.reduce((sum, entry) => sum + entry.estimatedWallMs, 0),
    1_347_418
  );
  assert.ok(
    resolved.omissions.some((entry) => entry.scenarioId === "D-06" && entry.reason.includes("cancelled"))
  );
  assert.ok(
    resolved.omissions.some((entry) => entry.scenarioId === "H-32" && entry.reason.includes("#819"))
  );
  assert.ok(
    resolved.omissions.some((entry) => entry.scenarioId === "SCOUT-02" && entry.reason.includes("Not selected"))
  );
});

test("selection accounts for every unselected repetition", () => {
  const subject = pack.selection[0];
  const load = (reference) => {
    const fixture = structuredClone(readFixture(reference));
    const variant = fixture.recipe?.variants?.find((entry) => entry.id === subject.variantId);
    if (variant) variant.repetitions = 3;
    return fixture;
  };
  const resolved = resolveAiRegressionSelection(pack, manifest, load);
  assert.deepEqual(
    resolved.omissions
      .filter((entry) => entry.scenarioId === subject.scenarioId && entry.variantId === subject.variantId)
      .map((entry) => entry.repetition),
    [2, 3]
  );
});

test("AI regression selection fails closed for empty, stale or over-budget entries", () => {
  assert.throws(
    () => resolveAiRegressionSelection({ ...pack, selection: [] }, manifest, readFixture),
    /invalid_ai_regression_pack/
  );
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
    runCase: async (entry) => ({
      caseId: entry.caseId,
      status: entry.caseId === cases[0].caseId ? "diagnostic_failed" : "diagnostic_passed"
    })
  });
  assert.deepEqual(
    results.map((entry) => entry.status),
    ["diagnostic_failed", "diagnostic_passed", "diagnostic_passed"]
  );

  const timedOut = await executeAiRegressionCases({
    cases: cases.slice(0, 1),
    budgetMs: 30_000,
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
  assert.deepEqual(
    results.map((entry) => entry.status),
    ["diagnostic_passed", "diagnostic_passed", "not_run_budget_exhausted"]
  );
});

test("extended E2E hook is strict, opt-in and runs once only after ordinary E2E succeeds", async () => {
  assert.equal(parseAiRegressionFlag(undefined), false);
  assert.equal(parseAiRegressionFlag("false"), false);
  assert.equal(parseAiRegressionFlag("true"), true);
  for (const invalid of ["", "TRUE", "1", "yes"])
    assert.throws(() => parseAiRegressionFlag(invalid), /invalid_RUN_AI_REGRESSION/);

  const calls = [];
  assert.equal(
    await runE2eWithAiRegression({
      flag: "false",
      runOrdinaryE2e: async () => {
        calls.push("ordinary");
        return 0;
      },
      runRegression: async () => {
        calls.push("regression");
        return 0;
      }
    }),
    0
  );
  assert.deepEqual(calls, ["ordinary"]);
  calls.length = 0;
  assert.equal(
    await runE2eWithAiRegression({
      flag: "true",
      runOrdinaryE2e: async () => {
        calls.push("ordinary");
        return 0;
      },
      runRegression: async () => {
        calls.push("regression");
        return 0;
      }
    }),
    0
  );
  assert.deepEqual(calls, ["ordinary", "regression"]);
  calls.length = 0;
  assert.equal(
    await runE2eWithAiRegression({
      flag: "true",
      runOrdinaryE2e: async () => {
        calls.push("ordinary");
        return 7;
      },
      runRegression: async () => {
        calls.push("regression");
        return 0;
      }
    }),
    7
  );
  assert.deepEqual(calls, ["ordinary"]);
});

function readJson(name) {
  return JSON.parse(readFileSync(join(fixtures, name), "utf8"));
}

test("scout profile preserves a full family instead of diagnostic shards", () => {
  const selection = resolveAiRegressionSelection(pack, manifest, readFixture, "scout");
  assert.equal(selection.selected.length, 1);
  assert.equal(selection.selected[0].family, true);
  assert.equal(selection.selected[0].variants.length, 10);
  assert.equal(selection.runtimeBudgetMs, 1800000);
  assert.throws(
    () => resolveAiRegressionSelection(pack, manifest, readFixture, "unknown"),
    /invalid_ai_regression_profile/
  );
  assert.throws(() => resolveAiRegressionSelection(pack, manifest, () => ({}), "scout"), /scout_fixture_missing/);
});
