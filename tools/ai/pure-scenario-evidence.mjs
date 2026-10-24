import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

function namesScenario(fullName, scenarioId) {
  const escaped = scenarioId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^A-Z0-9])${escaped}(?:$|[^A-Z0-9])`).test(fullName);
}

export function summarizePureScenarioEvidence(jestReport, scenarioIds, cases = [], workspaceRoot = process.cwd()) {
  const assertions = (jestReport?.testResults ?? []).flatMap((suite) =>
    (suite.assertionResults ?? []).map((assertion) => ({ ...assertion, file: suite.name }))
  );
  const executed = scenarioIds.map((scenarioId) => {
    const bound = cases.find((entry) => entry.scenarioId === scenarioId);
    if (bound) {
      const bindings = bound.tests.map((test) => {
        const matches = assertions.filter(
          (assertion) => assertion.file === resolve(workspaceRoot, test.file) && assertion.title === test.title
        );
        return { ...test, passed: matches.length === 1 && matches[0].status === "passed" };
      });
      return {
        scenarioId,
        passedTestCount: bindings.filter((binding) => binding.passed).length,
        firstTest: bindings.find((binding) => binding.passed)?.title ?? null,
        coverage: bound.coverage,
        remaining: bound.remaining,
        bindings,
        bindingsComplete: bindings.every((binding) => binding.passed)
      };
    }
    const passing = assertions.filter(
      (assertion) => assertion.status === "passed" && namesScenario(assertion.fullName ?? "", scenarioId)
    );
    return { scenarioId, passedTestCount: passing.length, firstTest: passing[0]?.fullName ?? null };
  });
  return {
    executed,
    missingScenarioIds: executed
      .filter((item) => item.bindingsComplete === false || item.passedTestCount === 0)
      .map((item) => item.scenarioId)
  };
}

export function runPureJestWithScenarioEvidence({
  workspaceRoot,
  environment,
  testPathPattern,
  scenarioIds,
  cases = []
}) {
  const temporaryDirectory = mkdtempSync(join(tmpdir(), "fuzzy-waddle-ai-pure-"));
  try {
    const commands = [];
    const reports = [];
    for (const project of ["gameplay", "phaser"]) {
      const resultPath = join(temporaryDirectory, `${project}.json`);
      const configPath = `libs/games/probable-waffle/${project}/jest.config.cts`;
      const command = spawnSync(
        "pnpm",
        [
          "exec",
          "jest",
          `--config=${configPath}`,
          "--runInBand",
          `--testPathPatterns=${testPathPattern}`,
          "--json",
          `--outputFile=${resultPath}`
        ],
        { cwd: workspaceRoot, env: environment, encoding: "utf8", maxBuffer: 16 * 1024 * 1024 }
      );
      commands.push(command);
      try {
        reports.push(JSON.parse(readFileSync(resultPath, "utf8")));
      } catch {
        reports.push(null);
      }
    }
    const testResults = reports.flatMap((report) => report?.testResults ?? []);
    const command = {
      status: commands.every((item) => item.status === 0) ? 0 : 1,
      signal: commands.find((item) => item.signal)?.signal ?? null,
      stdout: commands.map((item) => item.stdout ?? "").join("\n"),
      stderr: commands.map((item) => item.stderr ?? "").join("\n"),
      error: commands.find((item) => item.error)?.error
    };
    return {
      command,
      evidence: summarizePureScenarioEvidence({ testResults }, scenarioIds, cases, workspaceRoot),
      counts: {
        testSuites: testResults.filter((suite) => suite.status === "passed").length,
        tests: reports.reduce((sum, report) => sum + (report?.numPassedTests ?? 0), 0)
      }
    };
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}
