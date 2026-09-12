import { isAbsolute, relative, resolve, sep } from "node:path";

export const DEFAULT_OUTPUT_BUDGET = Object.freeze({ maxBytes: 12_000, maxLines: 160 });

const COMMAND_IDS = new Set(["doctor", "context", "verify", "triage", "metrics", "scenario"]);
const RESULT_STATUSES = new Set(["passed", "failed"]);

export function validateCommandDefinition(command) {
  requireRecord(command, "command");
  requireSchemaVersion(command, "command");
  requireKnownCommand(command.id);
  requireString(command.description, "missing_command_description");
  requireRecord(command.selection, "missing_command_selection");
  if (typeof command.selection.requireConfiguredWork !== "boolean")
    throw new Error("missing_configured_work_requirement");
  if (!Array.isArray(command.selection.required) || command.selection.required.some((key) => typeof key !== "string"))
    throw new Error("invalid_required_selection");
  if (new Set(command.selection.required).size !== command.selection.required.length)
    throw new Error("duplicate_required_selection");
  validateOutputBudget(command.outputBudget ?? DEFAULT_OUTPUT_BUDGET);
  return command;
}

export function validateAdapterDefinition(adapter) {
  requireRecord(adapter, "adapter");
  requireString(adapter.id, "missing_adapter_id");
  requireSchemaVersion(adapter, "adapter");
  if (!Array.isArray(adapter.commands) || adapter.commands.length === 0)
    throw new Error(`missing_adapter_commands:${adapter.id}`);
  for (const commandId of adapter.commands) requireKnownCommand(commandId);
  if (new Set(adapter.commands).size !== adapter.commands.length)
    throw new Error(`duplicate_adapter_command:${adapter.id}`);
  return adapter;
}

export function validateCommandResult({ command, adapters, result, workspaceRoot }) {
  validateCommandDefinition(command);
  requireRecord(result, "result");
  requireSchemaVersion(result, "result");
  if (result.commandId !== command.id) throw new Error("result_command_mismatch");
  if (!RESULT_STATUSES.has(result.status)) throw new Error("invalid_result_status");
  validateProvenance(result.provenance);
  const adapter = adapterById(adapters, result.adapterId);
  if (!adapter.commands.includes(command.id)) throw new Error(`unsupported_adapter_command:${result.adapterId}`);
  validateSelection(result.selection, command.selection);
  validateOutput(result.output, command.outputBudget ?? DEFAULT_OUTPUT_BUDGET, workspaceRoot);
  return result;
}

export function compactOutput(value, budget = DEFAULT_OUTPUT_BUDGET) {
  validateOutputBudget(budget);
  if (typeof value !== "string") throw new Error("invalid_output_value");
  const totalBytes = Buffer.byteLength(value);
  const totalLines = lineCount(value);
  const lines = value.split("\n");
  const retained = [];
  let retainedBytes = 0;
  for (const line of lines) {
    const next = retained.length === 0 ? line : `\n${line}`;
    if (retained.length >= budget.maxLines || retainedBytes + Buffer.byteLength(next) > budget.maxBytes) break;
    retained.push(line);
    retainedBytes += Buffer.byteLength(next);
  }
  const text = retained.join("\n");
  return {
    text,
    totalBytes,
    totalLines,
    truncated: text !== value
  };
}

export function validateOutputBudget(budget) {
  requireRecord(budget, "output_budget");
  for (const key of ["maxBytes", "maxLines"]) {
    if (!Number.isInteger(budget[key]) || budget[key] <= 0) throw new Error(`invalid_output_budget:${key}`);
  }
  return budget;
}

function adapterById(adapters, id) {
  if (!Array.isArray(adapters)) throw new Error("invalid_adapters");
  const matching = adapters.filter((adapter) => adapter?.id === id);
  if (matching.length !== 1) throw new Error(`unknown_adapter_result:${id ?? "missing"}`);
  return validateAdapterDefinition(matching[0]);
}

function validateProvenance(provenance) {
  requireRecord(provenance, "missing_provenance");
  if (!/^[0-9a-f]{40}$/u.test(provenance.revision ?? "")) throw new Error("invalid_provenance_revision");
  if (!Array.isArray(provenance.worktreeStatus) || provenance.worktreeStatus.some((entry) => typeof entry !== "string"))
    throw new Error("invalid_provenance_worktree_status");
}

function validateSelection(selection, requirement) {
  requireRecord(selection, "missing_result_selection");
  if (typeof selection.configured !== "boolean") throw new Error("missing_configured_work");
  if (requirement.requireConfiguredWork && !selection.configured) throw new Error("missing_configured_work");
  for (const key of requirement.required) {
    if (!Array.isArray(selection[key])) throw new Error(`missing_required_selection:${key}`);
    if (selection[key].length === 0) throw new Error(`empty_required_selection:${key}`);
  }
  if (Array.isArray(selection.checks)) selection.checks.forEach(validateCheck);
}

function validateCheck(check) {
  requireRecord(check, "invalid_verification_check");
  requireString(check.id, "missing_verification_check_id");
  if (!Array.isArray(check.projects) || check.projects.some((project) => typeof project !== "string"))
    throw new Error(`invalid_verification_check_projects:${check.id}`);
  if (!Array.isArray(check.commands) || check.commands.length === 0)
    throw new Error(`missing_verification_check_commands:${check.id}`);
  check.commands.forEach((command) => validateReplayCommand(command, check.id));
}

function validateReplayCommand(command, checkId) {
  requireRecord(command, `invalid_replay_command:${checkId}`);
  requireString(command.executable, `missing_replay_executable:${checkId}`);
  if (!Array.isArray(command.arguments) || command.arguments.some((argument) => typeof argument !== "string"))
    throw new Error(`invalid_replay_arguments:${checkId}`);
  if (command.environment !== undefined) validateEnvironment(command.environment, checkId);
}

function validateEnvironment(environment, checkId) {
  requireRecord(environment, `invalid_replay_environment:${checkId}`);
  for (const [key, value] of Object.entries(environment)) {
    if (!/^[A-Z_][A-Z0-9_]*$/u.test(key) || typeof value !== "string")
      throw new Error(`invalid_replay_environment:${checkId}`);
  }
}

function validateOutput(output, budget, workspaceRoot) {
  requireRecord(output, "missing_result_output");
  if (typeof output.summary !== "string") throw new Error("invalid_output_summary");
  if (lineCount(output.summary) > budget.maxLines || Buffer.byteLength(output.summary) > budget.maxBytes)
    throw new Error("output_budget_exceeded");
  if (typeof output.truncated !== "boolean") throw new Error("missing_output_truncation_state");
  if (output.truncated) validateRetainedArtifact(output.retainedArtifact, workspaceRoot);
}

function validateRetainedArtifact(path, workspaceRoot) {
  requireString(path, "missing_retained_artifact");
  if (!workspaceRoot) return;
  if (isAbsolute(path)) throw new Error("absolute_retained_artifact");
  const root = resolve(workspaceRoot);
  const target = resolve(root, path);
  if (relative(root, target).startsWith(`..${sep}`) || target === root)
    throw new Error("retained_artifact_escapes_workspace");
}

function requireKnownCommand(id) {
  if (!COMMAND_IDS.has(id)) throw new Error(`unknown_command:${id ?? "missing"}`);
}

function requireSchemaVersion(value, kind) {
  if (!Number.isInteger(value.schemaVersion) || value.schemaVersion !== 1)
    throw new Error(`unsupported_${kind}_schema`);
}

function requireRecord(value, errorCode) {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(errorCode);
}

function requireString(value, errorCode) {
  if (typeof value !== "string" || !value) throw new Error(errorCode);
}

function lineCount(value) {
  return value ? value.split("\n").length : 0;
}
