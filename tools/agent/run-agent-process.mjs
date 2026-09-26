#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { manageProcess } from "./process-lifecycle.mjs";

const workspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

function parseArguments(tokens) {
  const options = { adapter: null, action: null };
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token === "--") continue;
    if (token === "--help") options.help = true;
    else if (token === "--adapter") options.adapter = required(tokens[++index], "adapter");
    else if (token === "--action") options.action = required(tokens[++index], "action");
    else throw new Error(`unknown_argument:${token}`);
  }
  if (!options.help && (!options.adapter || !options.action)) throw new Error("missing_process_options");
  return options;
}

function processDefinition(root, adapterId) {
  const registry = JSON.parse(readFileSync(resolve(root, "tools/agent/adapters.json"), "utf8"));
  const adapter = registry.adapters?.find((candidate) => candidate.id === adapterId);
  if (!adapter?.metadata?.persistentProcess) throw new Error(`missing_adapter_process:${adapterId}`);
  return { adapterId, ...adapter.metadata.persistentProcess };
}

function required(value, name) {
  if (!value || value.startsWith("--")) throw new Error(`missing_${name}`);
  return value;
}

function helpText() {
  return [
    "Manage an adapter-declared local process with retained ownership state.",
    "",
    "Usage:",
    "  node tools/agent/run-agent-process.mjs --adapter skirmish-ai --action start|status|stop",
    ""
  ].join("\n");
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const options = parseArguments(process.argv.slice(2));
    if (options.help) process.stdout.write(helpText());
    else {
      const result = await manageProcess(
        workspaceRoot,
        processDefinition(workspaceRoot, options.adapter),
        options.action
      );
      process.stdout.write(`PROCESS state=${result.state} adapter=${result.adapterId} pid=${result.pid ?? "none"}\n`);
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

export { parseArguments };
