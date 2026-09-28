import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { runPureJestWithScenarioEvidence } from "./pure-scenario-evidence.mjs";
import { pureFixtureReference, runtimeFixtureReference } from "./skirmish-matrix-fixtures.mjs";
import { digestString, readHead, readJson, readWorkingTreeSource } from "./skirmish-matrix-io.mjs";

export function invokeSelectedHarness(input, context) {
  const { manifest, fixtureDirectory } = context;
  const requestedPure = input.mode !== "runtime";
  const requestedRuntime = input.mode !== "pure";
  const pureRows = requestedPure
    ? input.rows.filter((row) => row.drivers.includes("pure") && pureFixtureReference(row, fixtureDirectory))
    : [];
  const runtimeRows = requestedRuntime
    ? input.rows.filter((row) => row.drivers.includes("runtime") && runtimeFixtureReference(row))
    : [];
  const pure = pureRows.length > 0 ? invokeHarness({ ...input, rows: pureRows, mode: "pure" }, context) : null;
  const runtime =
    runtimeRows.length > 0 ? invokeRuntimeHarness({ ...input, rows: runtimeRows, mode: "runtime" }, context) : null;
  if (!pure) return runtime;
  if (!runtime) return pure;
  return {
    schemaVersion: 1,
    status: pure.status === "passed" && runtime.status === "passed" ? "passed" : "failed",
    suite: input.suite,
    manifestVersion: manifest.manifestVersion,
    candidate: input.candidate ?? readHead(),
    baseline: input.baseline ?? null,
    rows: input.rows.map((row) => row.id),
    workCounts: {
      scenarios: input.rows.length,
      testSuites: pure.workCounts.testSuites + runtime.workCounts.testSuites,
      tests: pure.workCounts.tests + runtime.workCounts.tests,
      decisions: pure.workCounts.decisions + runtime.workCounts.decisions,
      ticks: pure.workCounts.ticks + runtime.workCounts.ticks
    },
    pure,
    runtime
  };
}

export function invokeHarness(input, context) {
  const { manifest, workspaceRoot, fixtureDirectory } = context;
  const environment = {
    ...process.env,
    AI_SKIRMISH_MATRIX_REQUEST: JSON.stringify({
      schemaVersion: 1,
      manifestVersion: manifest.manifestVersion,
      suite: input.suite,
      stage: input.stage ?? null,
      candidate: input.candidate ?? null,
      baseline: input.baseline ?? null,
      seed: input.seed ?? null,
      mode: input.mode ?? "both",
      scenarioIds: input.rows.map((row) => row.id),
      replayArtifactPath: input.options?.artifactPath ?? null,
      untilTick: input.options?.untilTick ?? null,
      breakOn: input.options?.breakOn ?? null,
      baselineSupport: input.baselineSupport ?? null
    })
  };
  const workingTreeSource = input.suite === "stage-smoke" ? readWorkingTreeSource() : "";
  const workingTreeDigest = workingTreeSource.length > 0 ? digestString(workingTreeSource) : null;
  const fixtureDigest = digestString(
    JSON.stringify(
      input.rows.map((row) => {
        const reference = pureFixtureReference(row, fixtureDirectory);
        return { row, fixture: reference ? readJson(join(fixtureDirectory, reference), 1024 * 1024) : null };
      })
    )
  );
  const includesAuthoredTactics = input.rows.some((row) => row.authoredFixture === "stage-13-tactics.json");
  const includesAuthoredAdaptation = input.rows.some((row) => row.authoredFixture === "stage-14-adaptation.json");
  const includesAuthoredProduction = input.rows.some((row) => row.authoredFixture === "production-scenarios.json");
  const includesAuthoredEconomySupply = input.rows.some(
    (row) => row.authoredFixture === "economy-supply-scenarios.json"
  );
  const includesAuthoredEconomyForecast = input.rows.some(
    (row) => row.authoredFixture === "economy-forecast-scenarios.json"
  );
  const includesAuthoredOpeningBootstrap = input.rows.some(
    (row) => row.authoredFixture === "opening-bootstrap-scenarios.json"
  );
  const includesAuthoredResourceService = input.rows.some(
    (row) => row.authoredFixture === "resource-service-scenarios.json"
  );
  const includesAuthoredPressureStrategy = input.rows.some(
    (row) => row.authoredFixture === "pressure-strategy-scenarios.json"
  );
  const includesAuthoredVictoryRoute = input.rows.some((row) => row.authoredFixture === "victory-route-scenarios.json");
  const baseTestNames = [
    "ai-(scenario-harness|runtime-scenario|repro-cli)",
    "authoritative-state-projection",
    "actor-manager-ai-save"
  ];
  const authoredTestNames = [
    "ai-(brain|production-scenarios|housing-demand|economy-forecast-scenarios|opening-bootstrap-scenarios|" +
      "resource-forecast|resource-service-manager|pressure-strategy-scenarios|victory-route-scenarios|victory-pressure-scenarios)",
    "ai-(tactics-manager|adaptation-(manager|queue))",
    "validate-ai-runtime-browser-test-config-v1",
    "ai-profile-defaults",
    "player-ai-controller\\.agent\\.static"
  ];
  const includeAuthored =
    includesAuthoredTactics ||
    includesAuthoredAdaptation ||
    includesAuthoredProduction ||
    includesAuthoredEconomySupply ||
    includesAuthoredEconomyForecast ||
    includesAuthoredOpeningBootstrap ||
    includesAuthoredResourceService ||
    includesAuthoredPressureStrategy ||
    includesAuthoredVictoryRoute;
  const testPathPattern = `(${[...baseTestNames, ...(includeAuthored ? authoredTestNames : [])].join("|")})\\.spec\\.ts$`;
  const { command, evidence, counts } = runPureJestWithScenarioEvidence({
    workspaceRoot,
    environment,
    testPathPattern,
    scenarioIds: input.rows.map((row) => row.id)
  });
  const report = {
    schemaVersion: 1,
    status: command.status === 0 && evidence.missingScenarioIds.length === 0 ? "passed" : "failed",
    suite: input.suite,
    manifestVersion: manifest.manifestVersion,
    candidate: input.candidate ?? readHead(),
    dirtySourceDigest: workingTreeDigest,
    fixtureDigest,
    baseline: input.baseline ?? null,
    rows: input.rows.map((row) => row.id),
    pureScenarioEvidence: evidence,
    contexts: input.rows
      .filter((row) => pureFixtureReference(row, fixtureDirectory))
      .map((row) => ({
        scenarioId: row.id,
        ...readJson(join(fixtureDirectory, pureFixtureReference(row, fixtureDirectory)), 1024 * 1024).context
      })),
    workCounts: {
      scenarios: input.rows.length,
      testSuites: counts.testSuites,
      tests: counts.tests,
      decisions: 0,
      ticks: 0
    },
    process: { exitCode: command.status, signal: command.signal, stdout: command.stdout, stderr: command.stderr }
  };
  if (command.error) throw command.error;
  if (report.status !== "passed") process.exitCode = 1;
  return report;
}

function invokeRuntimeHarness(input, context) {
  const { manifest, workspaceRoot, fixtureDirectory } = context;
  const runId = input.options?.["run-id"] ?? process.env.AI_SKIRMISH_MATRIX_RUN_ID ?? null;
  if (runId !== null && (typeof runId !== "string" || !/^[A-Za-z0-9._-]{1,100}$/.test(runId))) {
    throw new Error("invalid_skirmish_matrix_run_id");
  }
  const startedAt = performance.now();
  const fixtures = [
    ...new Map(
      input.rows.map((row) => {
        const reference = runtimeFixtureReference(row);
        return [reference, readJson(join(fixtureDirectory, reference), 1024 * 1024)];
      })
    ).values()
  ];
  const workingTreeSource = readWorkingTreeSource();
  const workingTreeDigest = workingTreeSource.length > 0 ? digestString(workingTreeSource) : null;
  const fixtureDigest = digestString(JSON.stringify(fixtures));
  const fixtureIdentityDigests = [...new Map(input.rows.map((row) => {
    const reference = runtimeFixtureReference(row);
    const fixture = readJson(join(fixtureDirectory, reference), 1024 * 1024);
    return [reference, { reference, digest: `sha256:${createHash("sha256").update(JSON.stringify(fixture)).digest("hex")}` }];
  })).values()].sort((left, right) => left.reference.localeCompare(right.reference));
  const scenarioSources = input.rows.map((row) => {
    const reference = runtimeFixtureReference(row);
    const fixture = readJson(join(fixtureDirectory, reference), 1024 * 1024);
    return { scenarioId: row.id, group: row.group, reference, map: fixture.recipe.mapLabel };
  });
  const environment = {
    ...process.env,
    AI_SKIRMISH_RUNTIME_REQUEST: JSON.stringify({
      schemaVersion: 1,
      sourceRevision: input.candidate ?? readHead(),
      dirtySourceDigest: workingTreeDigest,
      fixtureDigest,
      seed: input.seed ?? null,
      scenarioIds: input.rows.map((row) => row.id),
      fixtures
    })
  };
  const command = spawnSync(
    "pnpm",
    [
      "exec",
      "playwright",
      "test",
      "apps/portal-e2e/src/e2e/skirmish-ai-runtime.spec.ts",
      "--config=apps/portal-e2e/playwright.config.ts",
      "--workers=1"
    ],
    { cwd: workspaceRoot, env: environment, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 }
  );
  const wallMs = Math.round(performance.now() - startedAt);
  if (command.error) throw command.error;
  const runtimeReport = parseRuntimeReport(`${command.stdout}\n${command.stderr}`);
  const report = {
    schemaVersion: 1,
    status: command.status === 0 && runtimeReport?.status === "passed" ? "passed" : "failed",
    suite: input.suite,
    manifestVersion: manifest.manifestVersion,
    candidate: input.candidate ?? readHead(),
    dirtySourceDigest: workingTreeDigest,
    fixtureDigest,
    fixtureIdentityDigests,
    scenarioSources,
    runId,
    seed: input.seed ?? null,
    baseline: input.baseline ?? null,
    rows: input.rows.map((row) => row.id),
    contexts: input.rows.map((row) => ({
      scenarioId: row.id,
      ...readJson(join(fixtureDirectory, runtimeFixtureReference(row)), 1024 * 1024).context
    })),
    workCounts: {
      scenarios: input.rows.length,
      testSuites: runtimeReport ? 1 : 0,
      tests: runtimeReport ? 1 : 0,
      decisions: runtimeReport?.workCounts?.decisions ?? 0,
      ticks: runtimeReport?.workCounts?.ticks ?? 0
    },
    execution: { wallMs, processStarts: 1 },
    runtime: runtimeReport,
    process: { exitCode: command.status, signal: command.signal, stdout: command.stdout, stderr: command.stderr }
  };
  if (report.workCounts.decisions <= 0 || report.workCounts.ticks <= 0) {
    report.status = "failed";
  }
  if (report.status !== "passed") process.exitCode = 1;
  return report;
}

function parseRuntimeReport(output) {
  const prefix = "AI_SKIRMISH_RUNTIME_RESULT_V1:";
  const start = output.lastIndexOf(prefix);
  if (start < 0) return null;
  const line = output
    .slice(start + prefix.length)
    .split("\n", 1)[0]
    ?.replace(/\u001b\[[0-9;]*m/g, "")
    .trim();
  if (!line) return null;
  try {
    const value = JSON.parse(line);
    return value?.schemaVersion === 1 ? value : null;
  } catch {
    return null;
  }
}
