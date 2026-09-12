import { readFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

/** Reduces a retained verification report to a replayable first actionable failure. */
export function triageVerification(root, reportPath) {
  const path = resolveReportPath(root, reportPath);
  const report = readReport(root, path);
  const failedCommand = report.checks
    .flatMap((check) => check.commands.map((command) => ({ check, command })))
    .find(({ command }) => command.status === "failed");
  return {
    configured: true,
    reports: [reportPath],
    executionStatus: report.status,
    reportProvenance: report.provenance,
    ...(failedCommand ? failureSummary(failedCommand) : {})
  };
}

function resolveReportPath(root, reportPath) {
  if (typeof reportPath !== "string" || !reportPath || isAbsolute(reportPath))
    throw new Error("invalid_triage_report_path");
  const workspace = resolve(root);
  const target = resolve(workspace, reportPath);
  if (relative(workspace, target).startsWith(`..${sep}`) || target === workspace)
    throw new Error("triage_report_escapes_workspace");
  return target;
}

function readReport(root, path) {
  let report;
  try {
    report = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error("unreadable_triage_report");
  }
  validateReport(root, report);
  return report;
}

function validateReport(root, report) {
  if (
    report?.schemaVersion !== 1 ||
    report.kind !== "agent-verification-report" ||
    !["passed", "failed"].includes(report.status) ||
    !Array.isArray(report.checks) ||
    report.checks.length === 0
  )
    throw new Error("invalid_triage_report");
  validateProvenance(report.provenance);
  const commands = report.checks.flatMap((check) => validateCheck(root, check));
  const hasFailure = commands.some((command) => command.status === "failed");
  if ((report.status === "failed") !== hasFailure) throw new Error("inconsistent_triage_report");
}

function validateCheck(root, check) {
  if (
    !check ||
    typeof check !== "object" ||
    typeof check.id !== "string" ||
    !["passed", "failed"].includes(check.status) ||
    !Array.isArray(check.commands) ||
    check.commands.length === 0
  )
    throw new Error("invalid_triage_report");
  const commands = check.commands.map((command) => validateCommand(root, command));
  if ((check.status === "failed") !== commands.some((command) => command.status === "failed"))
    throw new Error("inconsistent_triage_report");
  return commands;
}

function validateProvenance(provenance) {
  if (
    !provenance ||
    typeof provenance !== "object" ||
    !/^[0-9a-f]{40}$/u.test(provenance.revision) ||
    !Array.isArray(provenance.worktreeStatus) ||
    provenance.worktreeStatus.some((entry) => typeof entry !== "string")
  )
    throw new Error("invalid_triage_report");
}

function validateCommand(root, command) {
  if (
    !command ||
    typeof command !== "object" ||
    !["passed", "failed"].includes(command.status) ||
    typeof command.executable !== "string" ||
    !Array.isArray(command.arguments) ||
    command.arguments.some((argument) => typeof argument !== "string") ||
    !(Number.isInteger(command.exitCode) || command.exitCode === null)
  )
    throw new Error("invalid_triage_report");
  validateArtifactPath(root, command.stdoutPath);
  validateArtifactPath(root, command.stderrPath);
  return command;
}

function validateArtifactPath(root, artifactPath) {
  if (typeof artifactPath !== "string" || !artifactPath || isAbsolute(artifactPath))
    throw new Error("invalid_triage_artifact_path");
  const workspace = resolve(root);
  const target = resolve(workspace, artifactPath);
  if (relative(workspace, target).startsWith(`..${sep}`) || target === workspace)
    throw new Error("triage_artifact_escapes_workspace");
}

function failureSummary({ check, command }) {
  return {
    failedCheck: check.id,
    replay: [command.executable, ...command.arguments].join(" "),
    stdoutPath: command.stdoutPath,
    stderrPath: command.stderrPath,
    exitCode: command.exitCode
  };
}
