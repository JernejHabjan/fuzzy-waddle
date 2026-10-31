import { execFileSync, spawn, spawnSync } from "node:child_process";
import { openSync, closeSync, writeFileSync, readFileSync, statSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createServer } from "node:net";
import { installPinnedCalibrationAdapter, PINNED_CALIBRATION_BASELINE } from "./pinned-calibration-adapter.mjs";

/** Separate detached sources, lockfile installs and owned servers are created only when the later execution gate invokes this. */
export async function createCalibrationEnvironment(root, candidate, baseline, directory) {
  if (!/^[a-f0-9]{40}$/.test(candidate) || baseline !== PINNED_CALIBRATION_BASELINE || candidate === baseline)
    throw new Error("calibration_source_pins_invalid");
  const environment = { root, candidate, baseline, directory, sources: {}, servers: [], createdWorktrees: [], batch: 0 };
  try {
    for (const [lane, sha] of [["candidate", candidate], ["baseline", baseline]]) {
      const path = join(directory, `${lane}-source`);
      execFileSync("git", ["worktree", "add", "--detach", path, sha], { cwd: root, stdio: "ignore" });
      environment.createdWorktrees.push(path); environment.sources[lane] = path;
      runLogged("pnpm", ["install", "--frozen-lockfile"], path, join(directory, `${lane}-install.log`));
    }
    environment.adapter = installPinnedCalibrationAdapter(environment.sources.baseline);
    for (const lane of ["candidate", "baseline"]) {
      const port = await freePort(), log = openSync(join(directory, `${lane}-server.log`), "w");
      const child = spawn("pnpm", ["exec", "nx", "serve", "portal", "--configuration=development", "--host", "127.0.0.1",
        "--port", String(port)], { cwd: environment.sources[lane], detached: true,
        stdio: ["ignore", log, log], env: { ...process.env, NX_DAEMON: "false" } });
      child.on("error", (error) => { child.calibrationSpawnError = error; });
      closeSync(log); environment.servers.push({ lane, child, url: `http://127.0.0.1:${port}` });
      await ready(child, `http://127.0.0.1:${port}`);
    }
    mkdirSync(join(directory, "matches"));
    return environment;
  } catch (error) { await closeCalibrationEnvironment(environment); throw error; }
}

/** The candidate's frozen test adapter observes each source's own native browser build, never importing candidate AI into baseline. */
export function executeCalibrationBatch(environment, jobs, fixture, identity) {
  if (!jobs.length || jobs.length > 200 || new Set(jobs.map((job) => job.revision)).size !== 1)
    throw new Error("calibration_batch_shape_invalid");
  const lane = jobs[0].revision, sourceRevision = environment[lane];
  const requestPath = join(environment.directory, `batch-${environment.batch++}.json`);
  const output = join(environment.directory, "matches");
  writeFileSync(requestPath, JSON.stringify({ schemaVersion: 1, sourceRevision, ...identity, fixture, jobs, output,
    adapterDigest: lane === "baseline" ? environment.adapter.adapterDigest : null }));
  const runner = environment.sources.candidate;
  const server = environment.servers.find((entry) => entry.lane === lane);
  if (!server || server.child.exitCode !== null) throw new Error("calibration_owned_server_stopped");
  const log = openSync(`${requestPath}.log`, "w");
  const processResult = spawnSync("pnpm", ["exec", "playwright", "test", "apps/portal-e2e/src/e2e/skirmish-ai-calibration.spec.ts",
    "--config=apps/portal-e2e/playwright.calibration.config.ts", "--workers=1"], {
    cwd: runner, stdio: ["ignore", log, log], env: { ...process.env, NX_DAEMON: "false", AI_CALIBRATION_REQUEST: requestPath,
      AI_CALIBRATION_BASE_URL: server.url } });
  closeSync(log);
  return jobs.map((job) => {
    const path = join(output, `${job.id}.json`);
    if (!existsSync(path)) return { job, sourceRevision, ...identity, status: "capture_failed", tick: 0, decisions: 0,
      result: null, failures: [`native_match_output_missing:process=${processResult.status}`] };
    if (statSync(path).size > 128 * 1024) throw new Error("calibration_native_match_oversized");
    const record = JSON.parse(readFileSync(path, "utf8"));
    if (JSON.stringify(record.job) !== JSON.stringify(job) || record.sourceRevision !== sourceRevision ||
        record.fixtureDigest !== identity.fixtureDigest || record.manifestDigest !== identity.manifestDigest ||
        record.adapterDigest !== (lane === "baseline" ? environment.adapter.adapterDigest : null) ||
        !Number.isSafeInteger(record.tick) || record.tick < 0 || record.tick > job.maximumTick ||
        !Number.isSafeInteger(record.decisions) || record.decisions < 0 || !Array.isArray(record.failures))
      throw new Error("calibration_native_match_identity_or_shape_mismatch");
    const { timeline: _timeline, ...compact } = record;
    return { ...compact, artifact: path };
  });
}

export async function closeCalibrationEnvironment(environment) {
  for (const { child } of environment.servers) if (child.pid && child.exitCode === null) {
    try { process.kill(-child.pid, "SIGTERM"); } catch (error) { if (error.code !== "ESRCH") throw error; }
    await new Promise((resolve) => { const timer = setTimeout(resolve, 5000); child.once("exit", () => { clearTimeout(timer); resolve(); }); });
    if (child.exitCode === null) { try { process.kill(-child.pid, "SIGKILL"); } catch (error) { if (error.code !== "ESRCH") throw error; } }
  }
  for (const path of environment.createdWorktrees.reverse()) {
    // Only fresh task-owned detached checkouts are removed; source pins and adapter digests remain in the report.
    execFileSync("git", ["worktree", "remove", "--force", path], { cwd: environment.root, stdio: "ignore" });
  }
}

function runLogged(command, args, cwd, path) {
  const log = openSync(path, "w");
  try { execFileSync(command, args, { cwd, stdio: ["ignore", log, log], env: { ...process.env, NX_DAEMON: "false" } }); }
  finally { closeSync(log); }
}

async function freePort() {
  const server = createServer();
  await new Promise((resolve, reject) => { server.once("error", reject); server.listen(0, "127.0.0.1", resolve); });
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve)); return port;
}

async function ready(child, url) {
  for (let attempt = 0; attempt < 1200; attempt++) {
    if (child.exitCode !== null || child.calibrationSpawnError) throw new Error("calibration_owned_server_start_failed");
    try { const response = await fetch(url, { signal: AbortSignal.timeout(1000) }); if (response.ok) return; } catch { /* Startup only. */ }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("calibration_owned_server_start_timeout");
}
