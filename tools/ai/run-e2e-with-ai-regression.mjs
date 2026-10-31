#!/usr/bin/env node
import { spawn } from "node:child_process";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { runE2eWithAiRegression } from "./ai-regression-hook.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const nx = join(root, "node_modules/nx/dist/bin/nx.js");
const forwardedArgs = process.argv.slice(2);
if (forwardedArgs[0] === "--") forwardedArgs.shift();
process.exit(await runE2eWithAiRegression({
  flag: process.env.RUN_AI_REGRESSION,
  runOrdinaryE2e: () => run(process.execPath, [nx, "run", "portal-e2e:e2e", ...forwardedArgs]),
  runRegression: () => run(process.execPath, [join(root, "tools/ai/run-ai-regression.mjs")])
}));

function run(command, args) {
  return new Promise((resolveExit, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit", windowsHide: true });
    child.once("error", reject);
    child.once("close", (code, signal) => resolveExit(code ?? (signal ? 1 : 0)));
  });
}
