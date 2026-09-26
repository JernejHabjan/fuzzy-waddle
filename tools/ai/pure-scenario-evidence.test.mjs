import { strict as assert } from "node:assert";
import { test } from "node:test";
import { summarizePureScenarioEvidence } from "./pure-scenario-evidence.mjs";

test("requires a passing executed assertion naming every requested pure scenario", () => {
  const report = {
    testResults: [{
      assertionResults: [
        { fullName: "production PRO-01: dated capacity", status: "passed" },
        { fullName: "production PRO-02: no speculative capacity", status: "pending" },
        { fullName: "production PRO-010: different case", status: "passed" }
      ]
    }]
  };
  assert.deepEqual(
    summarizePureScenarioEvidence(report, ["PRO-01", "PRO-02", "PRO-03"]).missingScenarioIds,
    ["PRO-02", "PRO-03"]
  );
  assert.equal(summarizePureScenarioEvidence(null, ["ECO-01"]).missingScenarioIds[0], "ECO-01");
});
