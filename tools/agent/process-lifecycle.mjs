import { createHash } from "node:crypto";
import { closeSync, existsSync, mkdirSync, openSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { spawn } from "node:child_process";

const PROCESS_STATES = new Set(["started", "reused", "stopped", "not_running"]);

/** Starts, inspects, and stops only adapter-declared processes with a persisted ownership record. */
export async function manageProcess(root, definition, action, dependencies = {}) {
  validateDefinition(root, definition);
  if (!new Set(["start", "status", "stop"]).has(action)) throw new Error(`invalid_process_action:${action}`);
  const operations = createOperations(root, dependencies);
  operations.statePath = statePath(operations.directory, definition);
  const existing = readState(operations.statePath);
  if (!existing && existsSync(operations.statePath)) removeState(operations.statePath);
  if (action === "status") return status(definition, existing, operations);
  if (action === "stop") return stop(definition, existing, operations);
  return start(definition, existing, operations);
}

function createOperations(root, dependencies) {
  const directory = resolve(root, "tmp", "agent-processes");
  return {
    root: resolve(root),
    directory,
    now: dependencies.now ?? (() => new Date().toISOString()),
    spawn: dependencies.spawn ?? spawn,
    kill: dependencies.kill ?? process.kill,
    isLive: dependencies.isLive ?? isLive,
    readArguments: dependencies.readArguments ?? readProcessArguments,
    waitForReady: dependencies.waitForReady ?? waitForReady,
    sleep:
      dependencies.sleep ?? ((milliseconds) => new Promise((resolveSleep) => setTimeout(resolveSleep, milliseconds))),
    statePath: null
  };
}

async function start(definition, existing, operations) {
  operations.statePath = statePath(operations.directory, definition);
  if (existing && operations.isLive(existing.pid)) {
    if (isOwnedLiveProcess(definition, existing, operations)) return result("reused", definition, existing);
    throw new Error("managed_process_identity_mismatch");
  }
  if (existing) removeState(operations.statePath);
  mkdirSync(operations.directory, { recursive: true });
  const stdoutPath = join(operations.directory, `${definition.adapterId}-${definition.id}.stdout.log`);
  const stderrPath = join(operations.directory, `${definition.adapterId}-${definition.id}.stderr.log`);
  const stdoutDescriptor = openSync(stdoutPath, "a");
  const stderrDescriptor = openSync(stderrPath, "a");
  const child = operations.spawn(definition.executable, definition.arguments, {
    cwd: resolve(operations.root, definition.cwd),
    detached: true,
    stdio: ["ignore", stdoutDescriptor, stderrDescriptor]
  });
  closeSync(stdoutDescriptor);
  closeSync(stderrDescriptor);
  if (!Number.isInteger(child.pid) || child.pid <= 0) throw new Error("managed_process_start_failed");
  child.unref();
  const record = {
    schemaVersion: 1,
    adapterId: definition.adapterId,
    id: definition.id,
    pid: child.pid,
    definitionDigest: digestDefinition(definition),
    startedAt: operations.now(),
    stdoutPath: relative(operations.root, stdoutPath),
    stderrPath: relative(operations.root, stderrPath)
  };
  try {
    writeState(operations.statePath, record);
    await operations.waitForReady(definition.readyUrl, definition.timeoutMilliseconds, operations.sleep);
    return result("started", definition, record);
  } catch (error) {
    terminateOwnedProcess(definition, record, operations);
    removeState(operations.statePath);
    throw error;
  }
}

function status(definition, existing, operations) {
  operations.statePath = statePath(operations.directory, definition);
  if (!existing || !isOwnedLiveProcess(definition, existing, operations)) {
    if (existing) removeState(operations.statePath);
    return result("not_running", definition, null);
  }
  return result("reused", definition, existing);
}

async function stop(definition, existing, operations) {
  operations.statePath = statePath(operations.directory, definition);
  if (!existing || !operations.isLive(existing.pid)) {
    if (existing) removeState(operations.statePath);
    return result("not_running", definition, null);
  }
  if (!isOwnedLiveProcess(definition, existing, operations)) throw new Error("managed_process_identity_mismatch");
  terminateOwnedProcess(definition, existing, operations);
  const deadline = Date.now() + Math.min(definition.timeoutMilliseconds, 30_000);
  while (operations.isLive(existing.pid) && Date.now() < deadline) await operations.sleep(100);
  if (operations.isLive(existing.pid)) throw new Error("managed_process_stop_timeout");
  removeState(operations.statePath);
  return result("stopped", definition, existing);
}

function isOwnedLiveProcess(definition, record, operations) {
  if (!validState(record) || !operations.isLive(record.pid) || record.definitionDigest !== digestDefinition(definition))
    return false;
  const arguments_ = operations.readArguments(record.pid);
  return Array.isArray(arguments_) && hasExpectedCommand(arguments_, definition);
}

function terminateOwnedProcess(definition, record, operations) {
  if (!isOwnedLiveProcess(definition, record, operations)) throw new Error("managed_process_identity_mismatch");
  operations.kill(-record.pid, "SIGTERM");
}

function hasExpectedCommand(arguments_, definition) {
  return (
    typeof arguments_[0] === "string" &&
    (arguments_[0] === definition.executable || arguments_[0].endsWith(`/${definition.executable}`)) &&
    definition.arguments.every((argument, index) => arguments_[index + 1] === argument)
  );
}

async function waitForReady(url, timeoutMilliseconds, sleep) {
  const deadline = Date.now() + timeoutMilliseconds;
  let lastError = null;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(2_000) });
      if (response.ok) return;
      lastError = new Error(`managed_process_not_ready:${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await sleep(250);
  }
  throw new Error(`managed_process_readiness_timeout:${lastError instanceof Error ? lastError.message : "unknown"}`);
}

function validateDefinition(root, definition) {
  if (
    !definition ||
    typeof definition !== "object" ||
    !/^[a-z0-9-]+$/u.test(definition.adapterId ?? "") ||
    !/^[a-z0-9-]+$/u.test(definition.id ?? "") ||
    typeof definition.executable !== "string" ||
    !/^[a-z0-9._-]+$/u.test(definition.executable) ||
    !Array.isArray(definition.arguments) ||
    definition.arguments.some((argument) => typeof argument !== "string") ||
    typeof definition.cwd !== "string" ||
    isAbsolute(definition.cwd) ||
    typeof definition.readyUrl !== "string" ||
    !/^http:\/\/127\.0\.0\.1:\d{1,5}(?:\/|$)/u.test(definition.readyUrl) ||
    !Number.isInteger(definition.timeoutMilliseconds) ||
    definition.timeoutMilliseconds < 1_000 ||
    definition.timeoutMilliseconds > 300_000
  )
    throw new Error("invalid_managed_process_definition");
  const workspace = resolve(root);
  const cwd = resolve(workspace, definition.cwd);
  const relativeCwd = relative(workspace, cwd);
  if (relativeCwd === ".." || relativeCwd.startsWith(`..${sep}`) || (cwd === workspace && definition.cwd !== "."))
    throw new Error("managed_process_cwd_escapes_workspace");
}

function statePath(directory, definition) {
  return join(directory, `${definition.adapterId}-${definition.id}.json`);
}

function readState(path) {
  if (!existsSync(path)) return null;
  try {
    const record = JSON.parse(readFileSync(path, "utf8"));
    return validState(record) ? record : null;
  } catch {
    return null;
  }
}

function writeState(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`, { flag: "wx" });
}

function removeState(path) {
  rmSync(path, { force: true });
}

function validState(record) {
  return (
    record &&
    record.schemaVersion === 1 &&
    /^[a-z0-9-]+$/u.test(record.adapterId) &&
    /^[a-z0-9-]+$/u.test(record.id) &&
    Number.isInteger(record.pid) &&
    /^[0-9a-f]{64}$/u.test(record.definitionDigest) &&
    typeof record.startedAt === "string"
  );
}

function isLive(pid) {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function readProcessArguments(pid) {
  try {
    return readFileSync(`/proc/${pid}/cmdline`, "utf8").split("\0").filter(Boolean);
  } catch {
    return null;
  }
}

function digestDefinition(definition) {
  return createHash("sha256").update(JSON.stringify(definition)).digest("hex");
}

function result(state, definition, record) {
  if (!PROCESS_STATES.has(state)) throw new Error("invalid_managed_process_state");
  return {
    schemaVersion: 1,
    state,
    adapterId: definition.adapterId,
    processId: definition.id,
    pid: record?.pid ?? null,
    readyUrl: definition.readyUrl,
    ...(record ? { stdoutPath: record.stdoutPath, stderrPath: record.stderrPath } : {})
  };
}
