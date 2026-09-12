#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compactOutput, validateCommandResult } from "./command-contracts.mjs";
import { findIssuePlan, inspectRepository } from "./repository-inspection.mjs";
import { selectVerification } from "./verification-selection.mjs";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const workspaceRoot = resolve(scriptDirectory, "../..");
const commands = {
  doctor: {
    schemaVersion: 1,
    id: "doctor",
    description: "Inspect repository prerequisites before expensive work.",
    selection: { requireConfiguredWork: false, required: ["indexes", "projects", "adapters"] }
  },
  context: {
    schemaVersion: 1,
    id: "context",
    description: "Emit a bounded cold-start packet for one configured issue.",
    selection: { requireConfiguredWork: true, required: ["plans", "indexes", "adapters"] }
  },
  verify: {
    schemaVersion: 1,
    id: "verify",
    description: "Select project-aware focused or delivery verification without running it.",
    selection: { requireConfiguredWork: true, required: ["changedFiles", "checks"] }
  }
};

export function parseArguments(tokens) {
  const options = {
    adapter: "generic",
    base: null,
    command: null,
    issue: null,
    output: null,
    targetBranch: null,
    verificationMode: null
  };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--") continue;
    if (token === "--help") options.help = true;
    else if (token === "--adapter") options.adapter = requiredValue(tokens[++index], "adapter");
    else if (token === "--base") options.base = requiredValue(tokens[++index], "base");
    else if (token === "--changed")
      options.verificationMode = selectVerificationMode(options.verificationMode, "changed");
    else if (token === "--issue") options.issue = requiredValue(tokens[++index], "issue");
    else if (token === "--output") options.output = requiredValue(tokens[++index], "output");
    else if (token === "--required")
      options.verificationMode = selectVerificationMode(options.verificationMode, "required");
    else if (token === "--target-branch") options.targetBranch = requiredValue(tokens[++index], "target_branch");
    else if (!options.command) options.command = token;
    else throw new Error(`unexpected_argument:${token}`);
  }
  if (!options.help && !commands[options.command]) throw new Error(`unknown_command:${options.command ?? "missing"}`);
  if (options.command === "context" && !/^\d+$/u.test(options.issue ?? "")) throw new Error("missing_issue");
  if (options.command !== "context" && options.issue !== null) throw new Error("unexpected_issue");
  if (
    options.command !== "verify" &&
    (options.base !== null || options.targetBranch !== null || options.verificationMode !== null)
  )
    throw new Error("unexpected_verification_option");
  if (options.command === "verify" && !options.verificationMode) throw new Error("missing_verification_mode");
  if (options.command !== "verify" && options.adapter !== "generic") throw new Error("unexpected_adapter");
  return options;
}

export function runAgentCommand(
  root,
  options,
  { inspect = inspectRepository, resolvePlan = findIssuePlan, select = selectVerification } = {}
) {
  const inspection = inspect(root);
  const plan = options.command === "context" ? resolvePlan(root, Number(options.issue)) : null;
  const selection =
    options.command === "verify"
      ? select(root, {
          adapterId: options.adapter,
          base: options.base,
          inspection,
          mode: options.verificationMode,
          targetBranch: options.targetBranch
        })
      : standardSelection(inspection, plan, options);
  const summary = summarize(options, inspection, plan, selection);
  const output = compactOutput(summary);
  const result = {
    schemaVersion: 1,
    commandId: options.command,
    adapterId: options.adapter,
    status: "passed",
    provenance: inspection.provenance,
    selection,
    output: { summary: output.text, truncated: output.truncated }
  };
  validateCommandResult({
    command: commands[options.command],
    adapters: inspection.adapters,
    result,
    workspaceRoot: root
  });
  return { result, inspection, plan };
}

export function writePacket(root, packet, output) {
  const path = output ? resolve(root, output) : null;
  if (!path || !path.startsWith(`${resolve(root)}/`)) throw new Error("invalid_packet_output");
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(packet, null, 2)}\n`);
  return relative(root, path);
}

function standardSelection(inspection, plan, options) {
  return {
    configured: options.command === "context",
    indexes: inspection.indexes,
    projects: inspection.projects.map((project) => project.name),
    adapters: inspection.adapters.map((adapter) => adapter.id),
    ...(plan ? { plans: [plan] } : {})
  };
}

function summarize(options, inspection, plan, selection) {
  const command = options.command;
  const adapterSummary = inspection.adapters.map((adapter) => adapter.id).join(",");
  const sourceStructure = inspection.sourceStructure;
  const structureSummary = [
    `baseline=${sourceStructure.baseline}`,
    `legacyEntries=${sourceStructure.legacyEntries}`,
    `changed=${sourceStructure.changedBaselinedFiles.length}`
  ].join(" ");
  const lines = [
    `AGENT ${command} status=passed revision=${inspection.provenance.revision}`,
    `RUNTIME node=${inspection.runtime.node} package=${inspection.runtime.packageManager} nxProjects=${inspection.runtime.nxProjectCount}`,
    `OWNERS projects=${inspection.projects.length} indexes=${inspection.indexes.length} adapters=${adapterSummary}`,
    `STRUCTURE ${structureSummary}`
  ];
  if (command === "verify") {
    lines.push(
      `VERIFY mode=${selection.mode} base=${selection.base} target=${selection.targetBranch} changedFiles=${selection.changedFiles.length}`
    );
    lines.push(
      `VERIFY projects=${selection.projects.length} checks=${selection.checks.map((check) => check.id).join(",")}`
    );
    lines.push(
      selection.mode === "changed"
        ? `NEXT pnpm agent:verify -- --required --base ${selection.base}`
        : "NEXT execute selected checks with retained logs"
    );
  } else if (plan)
    lines.push(`ISSUE plan=${plan}`, `NEXT pnpm agent:doctor && pnpm agent:context -- --issue ${options.issue}`);
  else lines.push("NEXT pnpm agent:context -- --issue <number>");
  return lines.join("\n");
}

function requiredValue(value, name) {
  if (!value || value.startsWith("--")) throw new Error(`missing_${name}`);
  return value;
}

function selectVerificationMode(existing, next) {
  if (existing) throw new Error("duplicate_verification_mode");
  return next;
}

function helpText() {
  return [
    "Run bounded repository doctor/context/verify commands.",
    "",
    "Usage:",
    "  node tools/agent/run-agent-command.mjs doctor [--output PATH]",
    "  node tools/agent/run-agent-command.mjs context --issue NUMBER [--output PATH]",
    "  node tools/agent/run-agent-command.mjs verify --changed|--required [--base BRANCH]",
    "    [--target-branch BRANCH] [--adapter ID] [--output PATH]",
    ""
  ].join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(helpText());
    else {
      const packet = runAgentCommand(workspaceRoot, options);
      if (options.output) writePacket(workspaceRoot, packet, options.output);
      process.stdout.write(`${packet.result.output.summary}\n`);
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}
