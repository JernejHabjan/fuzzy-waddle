import { strict as assert } from "node:assert";
import { test } from "node:test";
import { pureJestInvocation, summarizePureScenarioEvidence } from "./pure-scenario-evidence.mjs";
import { readPureFixtureCase } from "./pure-fixture-cases.mjs";

test("requires a passing executed assertion naming every requested pure scenario", () => {
  const report = {
    testResults: [
      {
        assertionResults: [
          { fullName: "production PRO-01: dated capacity", status: "passed" },
          { fullName: "production PRO-02: no speculative capacity", status: "pending" },
          { fullName: "production PRO-010: different case", status: "passed" }
        ]
      }
    ]
  };
  assert.deepEqual(summarizePureScenarioEvidence(report, ["PRO-01", "PRO-02", "PRO-03"]).missingScenarioIds, [
    "PRO-02",
    "PRO-03"
  ]);
  assert.equal(summarizePureScenarioEvidence(null, ["ECO-01"]).missingScenarioIds[0], "ECO-01");
});

test("pure Jest execution invokes the JavaScript entry point without a shell", () => {
  assert.deepEqual(pureJestInvocation(["exec", "jest", "spec.ts"], "node.exe"), {
    command: "node.exe",
    args: ["node_modules/jest/bin/jest.js", "spec.ts"]
  });
  assert.deepEqual(pureJestInvocation(["exec", "jest", "--testPathPatterns=(a|b)\\.spec.ts$"], "node.exe"), {
    command: "node.exe",
    args: ["node_modules/jest/bin/jest.js", "--testPathPatterns=(a|b)\\.spec.ts$"]
  });
});

const file = "libs/games/probable-waffle/gameplay/src/lib/player/ai-controller/example.spec.ts";
const bound = {
  scenarioId: "H-12",
  coverage: "owner_contract",
  setup: "two waiting projects",
  expected: "one reversible claim released",
  remaining: ["world reassignment"],
  tests: [
    { file, title: "releases a cycle" },
    { file, title: "retains paid work" }
  ]
};
const reportFor = (assertionResults, name = `/workspace/${file}`) => ({ testResults: [{ name, assertionResults }] });

test("exact fixture bindings require every declared assertion in its real file", () => {
  const entries = bound.tests.map((entry) => ({ title: entry.title, fullName: entry.title, status: "passed" }));
  const result = summarizePureScenarioEvidence(reportFor(entries), ["H-12"], [bound], "/workspace");
  assert.deepEqual(result.missingScenarioIds, []);
  assert.equal(result.executed[0].passedTestCount, 2);
  assert.deepEqual(result.executed[0].remaining, ["world reassignment"]);
  for (const report of [
    reportFor(entries.slice(0, 1)),
    reportFor(entries, "/wrong/example.spec.ts"),
    reportFor([...entries, entries[0]]),
    reportFor([{ ...entries[0], status: "pending" }, entries[1]]),
    reportFor([{ ...entries[0], status: "failed" }, entries[1]])
  ]) {
    assert.deepEqual(summarizePureScenarioEvidence(report, ["H-12"], [bound], "/workspace").missingScenarioIds, [
      "H-12"
    ]);
  }
});

test("an incidental ID-named passing test cannot bypass a missing fixture-bound assertion", () => {
  const report = reportFor([{ title: "H-12 unrelated", fullName: "H-12 unrelated", status: "passed" }]);
  assert.deepEqual(summarizePureScenarioEvidence(report, ["H-12"], [bound], "/workspace").missingScenarioIds, ["H-12"]);
});

test("fixture case parsing rejects unsafe, ambiguous and empty coverage declarations", () => {
  const fixture = { scenarioIds: ["H-12"], pureCases: [bound] };
  assert.deepEqual(readPureFixtureCase(fixture, "H-12"), bound);
  assert.equal(readPureFixtureCase({}, "H-12"), null);
  assert.throws(() => readPureFixtureCase(fixture, "H-13"), /missing_pure_fixture_case/);
  for (const entry of [
    { ...bound, tests: [] },
    { ...bound, tests: [bound.tests[0], bound.tests[0]] },
    { ...bound, remaining: [] },
    { ...bound, setup: "" },
    { ...bound, coverage: "passed" },
    { ...bound, tests: [{ file: `${file}/../escape.spec.ts`, title: "x" }] },
    { ...bound, tests: [{ file: "/absolute.spec.ts", title: "x" }] }
  ]) {
    assert.throws(() => readPureFixtureCase({ ...fixture, pureCases: [entry] }, "H-12"), /invalid_pure_fixture_case/);
  }
  assert.throws(
    () => readPureFixtureCase({ ...fixture, pureCases: [bound, bound] }, "H-12"),
    /invalid_pure_fixture_cases/
  );
});
