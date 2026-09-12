import { mkdirSync, writeFileSync } from "node:fs";
import { relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

/**
 * Runs an already validated verification selection and retains every command stream outside model context.
 * It deliberately starts no persistent processes; lifecycle ownership remains a separate tool responsibility.
 */
export function executeVerification(
  root,
  selection,
  provenance,
  { execute = runCommand, runId = defaultRunId() } = {}
) {
  const directory = createLogDirectory(root, provenance.revision, runId);
  const checks = selection.checks.map((check, checkIndex) => executeCheck(root, directory, check, checkIndex, execute));
  const report = {
    schemaVersion: 1,
    kind: "agent-verification-report",
    status: checks.every((check) => check.status === "passed") ? "passed" : "failed",
    provenance,
    selection: { mode: selection.mode, base: selection.base, targetBranch: selection.targetBranch },
    checks
  };
  const reportPath = writeJson(root, directory, "report.json", report);
  return { ...report, reportPath };
}

function executeCheck(root, directory, check, checkIndex, execute) {
  const commands = check.commands.map((command, commandIndex) =>
    executeCommand(root, directory, check, checkIndex, command, commandIndex, execute)
  );
  return {
    id: check.id,
    projects: check.projects,
    status: commands.every((command) => command.status === "passed") ? "passed" : "failed",
    commands
  };
}

function executeCommand(root, directory, check, checkIndex, command, commandIndex, execute) {
  const result = execute(command.executable, command.arguments, root, command.environment ?? {});
  const name = `${pad(checkIndex)}-${safeName(check.id)}-${pad(commandIndex)}`;
  const stdoutPath = writeLog(root, directory, `${name}.stdout.log`, result.stdout);
  const stderrPath = writeLog(root, directory, `${name}.stderr.log`, result.stderr);
  return {
    executable: command.executable,
    arguments: command.arguments,
    ...(command.environment ? { environment: command.environment } : {}),
    status: result.status === 0 ? "passed" : "failed",
    exitCode: Number.isInteger(result.status) ? result.status : null,
    stdoutPath,
    stderrPath
  };
}

function createLogDirectory(root, revision, runId) {
  if (!/^[0-9a-f]{40}$/u.test(revision)) throw new Error("invalid_execution_revision");
  if (!/^[a-z0-9-]+$/u.test(runId)) throw new Error("invalid_execution_run_id");
  const directory = resolve(root, "tmp", "agent-verification", revision, runId);
  if (!directory.startsWith(`${resolve(root)}/`)) throw new Error("invalid_execution_directory");
  mkdirSync(directory, { recursive: true });
  return directory;
}

function writeJson(root, directory, name, value) {
  return writeLog(root, directory, name, `${JSON.stringify(value, null, 2)}\n`);
}

function writeLog(root, directory, name, value) {
  const path = resolve(directory, name);
  if (!path.startsWith(`${directory}/`)) throw new Error("invalid_execution_log_path");
  writeFileSync(path, value ?? "");
  return relative(root, path);
}

function safeName(value) {
  return value.replace(/[^a-z0-9-]+/giu, "-");
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function defaultRunId() {
  return `${Date.now().toString(36)}-${process.pid}`;
}

function runCommand(executable, arguments_, cwd, environment) {
  const result = spawnSync(executable, arguments_, { cwd, encoding: "utf8", env: { ...process.env, ...environment } });
  return { status: result.status, stdout: result.stdout ?? "", stderr: result.stderr ?? "" };
}
