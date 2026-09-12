#!/usr/bin/env node
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { compactOutput, validateCommandResult } from "./command-contracts.mjs";
import { findIssuePlan, inspectRepository } from "./repository-inspection.mjs";

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
  }
};

export function parseArguments(tokens) {
  const options = { command: null, issue: null, output: null };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--") continue;
    if (token === "--help") options.help = true;
    else if (token === "--issue") options.issue = requiredValue(tokens[++index], "issue");
    else if (token === "--output") options.output = requiredValue(tokens[++index], "output");
    else if (!options.command) options.command = token;
    else throw new Error(`unexpected_argument:${token}`);
  }
  if (!options.help && !commands[options.command]) throw new Error(`unknown_command:${options.command ?? "missing"}`);
  if (options.command === "context" && !/^\d+$/u.test(options.issue ?? "")) throw new Error("missing_issue");
  if (options.command === "doctor" && options.issue !== null) throw new Error("unexpected_issue");
  return options;
}

export function runAgentCommand(root, options, { inspect = inspectRepository, resolvePlan = findIssuePlan } = {}) {
  const inspection = inspect(root);
  const plan = options.command === "context" ? resolvePlan(root, Number(options.issue)) : null;
  const selection = {
    configured: options.command === "context",
    indexes: inspection.indexes,
    projects: inspection.projects.map((project) => project.name),
    adapters: inspection.adapters.map((adapter) => adapter.id),
    ...(plan ? { plans: [plan] } : {})
  };
  const summary = summarize(options.command, inspection, plan, options.issue);
  const output = compactOutput(summary);
  const result = {
    schemaVersion: 1,
    commandId: options.command,
    adapterId: "generic",
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

function summarize(command, inspection, plan, issue) {
  const adapterSummary = inspection.adapters.map((adapter) => adapter.id).join(",");
  const sourceStructure = inspection.sourceStructure;
  const lines = [
    `AGENT ${command} status=passed revision=${inspection.provenance.revision}`,
    `RUNTIME node=${inspection.runtime.node} package=${inspection.runtime.packageManager} nxProjects=${inspection.runtime.nxProjectCount}`,
    `OWNERS projects=${inspection.projects.length} indexes=${inspection.indexes.length} adapters=${adapterSummary}`,
    `STRUCTURE baseline=${sourceStructure.baseline} legacyEntries=${sourceStructure.legacyEntries} changed=${sourceStructure.changedBaselinedFiles.length}`
  ];
  if (plan) lines.push(`ISSUE plan=${plan}`, `NEXT pnpm agent:doctor && pnpm agent:context -- --issue ${issue}`);
  else lines.push("NEXT pnpm agent:context -- --issue <number>");
  return lines.join("\n");
}

function requiredValue(value, name) {
  if (!value || value.startsWith("--")) throw new Error(`missing_${name}`);
  return value;
}

function helpText() {
  return [
    "Run bounded repository doctor/context commands.",
    "",
    "Usage:",
    "  node tools/agent/run-agent-command.mjs doctor [--output PATH]",
    "  node tools/agent/run-agent-command.mjs context --issue NUMBER [--output PATH]",
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
