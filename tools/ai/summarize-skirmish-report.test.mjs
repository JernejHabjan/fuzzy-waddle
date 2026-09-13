import assert from "node:assert/strict";
import test from "node:test";
import { parseSummaryArguments, summarizeReport } from "./summarize-skirmish-report.mjs";

test("parses compact triage flags", () => {
  assert.deepEqual(parseSummaryArguments(["--", "artifact.json", "--scenario", "SEQ-01", "--details"]), {
    input: "artifact.json",
    scenario: "SEQ-01",
    details: true,
    failuresOnly: false
  });
});

test("summarizes runtime failures and final variant evidence", () => {
  const text = summarizeReport({
    status: "failed",
    suite: "selection",
    rows: ["SEQ-01"],
    candidate: "c8fba4964b76ba6b26f0d5e747c2445a56a1bbe7",
    workCounts: { scenarios: 1, testSuites: 1, tests: 1, decisions: 20, ticks: 300 },
    runtime: {
      scenarios: [
        {
          scenarioId: "SEQ-01",
          passed: false,
          failures: ["variant:terminal_result_missing"],
          variants: [
            {
              variantId: "variant",
              seed: 759,
              aiErrors: [],
              checkpoints: [
                {
                  tick: 300,
                  gameResult: "quit",
                  workerCount: 6,
                  deliveredIncome: 4.125,
                  militaryActorNames: ["Guard"],
                  scoreMetrics: { units_produced: 2, damage_dealt: 10, units_killed: 1 }
                }
              ],
              perturbations: []
            }
          ]
        }
      ]
    }
  });

  assert.match(text, /SCENARIO SEQ-01 FAIL failures=variant:terminal_result_missing/);
  assert.match(
    text,
    /VARIANT variant seed=759 tick=300 result=quit workers=6 army=1 income=4.13 produced=2 damage=10 enemyLosses=1/
  );
});

test("failure-only output omits unrelated variants from shared fixture reports", () => {
  const text = summarizeReport(
    {
      status: "failed",
      runtime: {
        scenarios: [
          {
            scenarioId: "SEQ-01",
            passed: false,
            failures: ["failing:terminal_result_missing"],
            variants: [
              { variantId: "failing", seed: 1, checkpoints: [{}], perturbations: [], aiErrors: [] },
              { variantId: "unrelated", seed: 2, checkpoints: [{}], perturbations: [], aiErrors: [] }
            ]
          }
        ]
      }
    },
    { failuresOnly: true }
  );

  assert.match(text, /VARIANT failing/);
  assert.doesNotMatch(text, /VARIANT unrelated/);
});
