import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { join } from "node:path";
import { readNativeScenarioFixture } from "../scenarios/registration/read-native-scenario-fixture.ts";
import { runtimeFixtureReference } from "../scenarios/validation/skirmish-matrix-fixtures.ts";
import { digestString, readHead } from "./skirmish-matrix-io.ts";
import { createRuntimeResultPath, readRuntimeResultOutcome } from "./skirmish-runtime-result.ts";
import { mergeEncodedRuntimeReports } from "../shared/transport/skirmish-ai-runtime-parts.ts";

/** Split runtime rows by multiplayer requirement first, then by manifest group, keeping single-player shards first. */
export function planRuntimeExecutionShards(rows, fixtureDirectory, diagnosticSelection = null) {
  const buckets = new Map();
  for (const row of rows) {
    const reference = runtimeFixtureReference(row);
    const fixture = readNativeScenarioFixture(fixtureDirectory, reference);
    const requiresMultiplayer = diagnosticSelection?.requiresMultiplayer ?? fixture.recipe.requiresMultiplayer === true;
    const group = row.group ?? "default";
    const key = `${requiresMultiplayer ? "multiplayer" : "singleplayer"}:${group}`;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { id: key, group, requiresMultiplayer, rows: [] };
      buckets.set(key, bucket);
    }
    bucket.rows.push(row);
  }
  const all = [...buckets.values()];
  return [...all.filter((shard) => !shard.requiresMultiplayer), ...all.filter((shard) => shard.requiresMultiplayer)];
}

/** Merge independently executed runtime shard reports into one matrix runtime report with combined artifacts. */
export function mergeRuntimeShardReports(shardEntries, input, context, runId, workingTreeDigest, wallMs) {
  const { manifest, workspaceRoot, fixtureDirectory } = context;
  const sourceRevision = input.candidate ?? readHead();
  const fixtures = [
    ...new Map(
      input.rows.map((row) => {
        const reference = runtimeFixtureReference(row);
        return [reference, readNativeScenarioFixture(fixtureDirectory, reference)];
      })
    ).values()
  ];
  const fixtureDigest = digestString(JSON.stringify(fixtures));
  const fixtureIdentityDigests = [
    ...new Map<string, { reference: string; digest: string }>(
      input.rows.map((row) => {
        const reference = runtimeFixtureReference(row);
        const fixture = readNativeScenarioFixture(fixtureDirectory, reference);
        return [
          reference,
          { reference, digest: `sha256:${createHash("sha256").update(JSON.stringify(fixture)).digest("hex")}` }
        ];
      })
    ).values()
  ].sort((left, right) => left.reference.localeCompare(right.reference));

  const scenarioSources = input.rows.map((row) => {
    const reference = runtimeFixtureReference(row);
    const fixture = readNativeScenarioFixture(fixtureDirectory, reference);
    return { scenarioId: row.id, group: row.group, reference, map: fixture.recipe.mapLabel };
  });

  const combinedArtifact = createRuntimeResultPath(
    workspaceRoot,
    process.env.AI_SKIRMISH_RUNTIME_RESULTS_DIRECTORY || join(workspaceRoot, "tmp/ai-skirmish-runtime-results")
  );
  const availableSources = shardEntries
    .filter(({ report }) => report.runtime !== null)
    .map(({ report }) => ({ path: report.execution.resultArtifact, report: report.runtime }));

  let mergedRuntime = null;
  let mergeReason;
  if (availableSources.length > 0) {
    mergeEncodedRuntimeReports(combinedArtifact, availableSources, {
      sourceRevision,
      dirtySourceDigest: workingTreeDigest,
      fixtureDigest,
      diagnosticSelection: input.diagnosticSelection ?? null
    });
    const readBack = readRuntimeResultOutcome(
      combinedArtifact,
      { sourceRevision, dirtySourceDigest: workingTreeDigest, fixtureDigest },
      { expandExternalVariants: false }
    );
    mergedRuntime = readBack.report;
    mergeReason = readBack.reason;
  }

  const shardSummaries = shardEntries.map(({ shard, report }) => {
    const scenarios = report.runtime?.scenarios ?? [];
    const passed = scenarios.filter((entry) => entry.passed).length;
    const failed = scenarios.filter((entry) => !entry.passed).length;
    return {
      id: shard.id,
      group: shard.group,
      requiresMultiplayer: shard.requiresMultiplayer,
      rows: shard.rows.map((row) => row.id),
      status: report.status,
      wallMs: report.execution.wallMs,
      exitCode: report.process.exitCode,
      passed,
      failed,
      unexecuted: Math.max(0, shard.rows.length - scenarios.length),
      reason: report.reason ?? null
    };
  });

  const allShardsPassed = shardEntries.every(({ report }) => report.status === "passed");
  const totalDecisions = shardEntries.reduce((sum, { report }) => sum + (report.workCounts.decisions ?? 0), 0);
  const totalTicks = shardEntries.reduce((sum, { report }) => sum + (report.workCounts.ticks ?? 0), 0);
  const firstReason = mergeReason ?? shardEntries.find(({ report }) => report.reason)?.report.reason;
  const anyNonZeroExit = shardEntries.some(({ report }) => report.process.exitCode !== 0);

  return {
    schemaVersion: 1,
    ...(firstReason ? { reason: firstReason } : {}),
    status: allShardsPassed && totalDecisions > 0 && totalTicks > 0 ? "passed" : "failed",
    suite: input.suite,
    manifestVersion: manifest.manifestVersion,
    candidate: sourceRevision,
    dirtySourceDigest: workingTreeDigest,
    fixtureDigest,
    fixtureIdentityDigests,
    scenarioSources,
    runId,
    seed: input.seed ?? null,
    diagnosticSelection: input.diagnosticSelection ?? null,
    baseline: input.baseline ?? null,
    rows: input.rows.map((row) => row.id),
    contexts: input.rows.map((row) => ({
      scenarioId: row.id,
      ...readNativeScenarioFixture(fixtureDirectory, runtimeFixtureReference(row)).context
    })),
    workCounts: {
      scenarios: input.rows.length,
      testSuites: shardEntries.filter(({ report }) => report.runtime !== null).length,
      tests: mergedRuntime?.scenarios?.length ?? 0,
      decisions: totalDecisions,
      ticks: totalTicks
    },
    execution: { wallMs, processStarts: shardEntries.length, resultArtifact: combinedArtifact },
    shards: shardSummaries,
    runtime: mergedRuntime,
    process: {
      exitCode: anyNonZeroExit ? 1 : 0,
      signal: shardEntries.find(({ report }) => report.process.signal)?.report.process.signal ?? null,
      stdout: shardEntries.map(({ shard, report }) => `[${shard.id}]\n${report.process.stdout ?? ""}`).join("\n"),
      stderr: shardEntries
        .filter(({ report }) => report.process.stderr)
        .map(({ shard, report }) => `[${shard.id}]\n${report.process.stderr}`)
        .join("\n")
    }
  };
}

/** Stream Playwright per-test lines live while capturing bounded stdout/stderr for the retained report. */
export function spawnStreamingRuntime(command, args, options) {
  return new Promise<{
    status: number | null;
    signal: NodeJS.Signals | null;
    stdout: string;
    stderr: string;
    error?: Error;
  }>((resolveResult) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: options.env,
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true
    });
    let stdout = "";
    let stderr = "";
    let lineBuffer = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      if (process.platform === "win32" && child.pid) {
        spawn("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], { stdio: "ignore", windowsHide: true });
      } else {
        child.kill("SIGTERM");
      }
    }, options.timeout);
    const appendBounded = (current, chunk) =>
      current.length >= options.maxBuffer ? current : current + chunk.slice(0, options.maxBuffer - current.length);
    child.stdout.on("data", (chunk) => {
      const text = chunk.toString("utf8");
      stdout = appendBounded(stdout, text);
      lineBuffer += text;
      const lines = lineBuffer.split(/\r?\n/);
      lineBuffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("[WebServer]")) process.stdout.write(`${line}\n`);
      }
    });
    child.stderr.on("data", (chunk) => {
      const text = chunk.toString("utf8");
      stderr = appendBounded(stderr, text);
    });
    child.once("error", (error) => {
      clearTimeout(timer);
      resolveResult({ status: null, signal: null, stdout, stderr, error });
    });
    child.once("close", (status, signal) => {
      clearTimeout(timer);
      if (lineBuffer && !lineBuffer.startsWith("[WebServer]")) process.stdout.write(`${lineBuffer}\n`);
      resolveResult({
        status,
        signal,
        stdout,
        stderr,
        ...(timedOut ? { error: new Error(`runtime_shard_timeout:${options.timeout}ms`) } : {})
      });
    });
  });
}
