import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { executeAiRegressionCases } from "../ai-regression-execution.ts";
import { resolveAiRegressionSelection } from "../ai-regression-selection.ts";
import { readNativeScenarioFixture } from "../../scenarios/registration/read-native-scenario-fixture.ts";

const fixtures = fileURLToPath(new URL("../../testing/fixtures/", import.meta.url));
const manifest = readJson("skirmish-scenario-manifest.json");
const pack = readJson("periodic-native-regression-profiles.json");
const readFixture = (reference) => readNativeScenarioFixture(fixtures, reference);

test("AI regression selection binds exact manifest variants and reports every omission", () => {
  const resolved = resolveAiRegressionSelection(pack, manifest, readFixture);
  assert.equal(resolved.selected.length, 7);
  assert.equal(
    resolved.selected.reduce((sum, entry) => sum + entry.estimatedWallMs, 0),
    1_347_418
  );
  assert.ok(resolved.omissions.some((entry) => entry.scenarioId === "H-32" && entry.reason.includes("#819")));
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
