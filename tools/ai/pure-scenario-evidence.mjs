import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

function namesScenario(fullName, scenarioId) {
  const escaped = scenarioId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^A-Z0-9])${escaped}(?:$|[^A-Z0-9])`).test(fullName);
}

export function summarizePureScenarioEvidence(jestReport, scenarioIds) {
  const assertions = (jestReport?.testResults ?? []).flatMap((suite) => suite.assertionResults ?? []);
  const executed = scenarioIds.map((scenarioId) => {
    const passing = assertions.filter(
      (assertion) => assertion.status === "passed" && namesScenario(assertion.fullName ?? "", scenarioId)
    );
    return { scenarioId, passedTestCount: passing.length, firstTest: passing[0]?.fullName ?? null };
  });
  return {
    executed,
    missingScenarioIds: executed.filter((item) => item.passedTestCount === 0).map((item) => item.scenarioId)
  };
}

export function runPureJestWithScenarioEvidence({ workspaceRoot, environment, testPathPattern, scenarioIds }) {
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
          "exec", "jest", `--config=${configPath}`, "--runInBand",
          `--testPathPatterns=${testPathPattern}`, "--json", `--outputFile=${resultPath}`
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
      evidence: summarizePureScenarioEvidence({ testResults }, scenarioIds),
      counts: {
        testSuites: testResults.filter((suite) => suite.status === "passed").length,
        tests: reports.reduce((sum, report) => sum + (report?.numPassedTests ?? 0), 0)
      }
    };
  } finally {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  }
}
