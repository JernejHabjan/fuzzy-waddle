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

test("accepts an explicit report option used by retained-tool workflows", () => {
  assert.deepEqual(parseSummaryArguments(["--report", "artifact.json", "--failures-only"]), {
    input: "artifact.json",
    scenario: null,
    details: false,
    failuresOnly: true
  });
});

test("summarizes runtime failures and final variant evidence", () => {
  const text = summarizeReport({
    status: "failed",
    suite: "selection",
    rows: ["SEQ-01"],
    candidate: "c8fba4964b76ba6b26f0d5e747c2445a56a1bbe7",
    workCounts: { scenarios: 1, testSuites: 1, tests: 1, decisions: 20, ticks: 300 },
    execution: { wallMs: 42910, processStarts: 1 },
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
              timing: {
                setupMs: 500,
                perturbationMs: 0,
                totalWallMsExcludingTeardown: 700,
                checkpointPhases: [{ targetTick: 300, advanceMs: 120, settleMs: 40, captureMs: 20 }],
                browserLongTasks: { count: 2, totalMs: 110, maximumMs: 60 }
              },
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
  assert.match(text, /EXECUTION wallMs=42910 processStarts=1/);
  assert.match(
    text,
    /timing setupMs=500 playMs=120 settleMs=40 captureMs=20 perturbationMs=0 playMsPer1kTicks=400 longTasks=2/
  );
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

test("classifies a missing runtime payload as infrastructure evidence", () => {
  const text = summarizeReport({
    status: "failed",
    workCounts: { scenarios: 1, testSuites: 0, tests: 0, decisions: 0, ticks: 0 },
    process: { stderr: "Test timeout exceeded" }
  });

  assert.match(text, /INFRASTRUCTURE no_runtime_payload/);
  assert.match(text, /PROCESS STDERR/);
});

test("does not classify an executed pure report as missing runtime infrastructure", () => {
  const text = summarizeReport({
    status: "passed",
    workCounts: { scenarios: 1, testSuites: 2, tests: 12, decisions: 0, ticks: 0 }
  });

  assert.doesNotMatch(text, /INFRASTRUCTURE/);
});

test("surfaces missing per-scenario pure assertions without dumping Jest output", () => {
  const text = summarizeReport({
    status: "failed",
    rows: ["ECO-01", "ECO-02"],
    workCounts: { scenarios: 2, testSuites: 2, tests: 10, decisions: 0, ticks: 0 },
    pureScenarioEvidence: {
      executed: [{ scenarioId: "ECO-01", passedTestCount: 1 }, { scenarioId: "ECO-02", passedTestCount: 0 }],
      missingScenarioIds: ["ECO-02"]
    }
  });
  assert.match(text, /PURE_COVERAGE executed=2 missing=1/);
  assert.match(text, /PURE_MISSING ECO-02/);
});
