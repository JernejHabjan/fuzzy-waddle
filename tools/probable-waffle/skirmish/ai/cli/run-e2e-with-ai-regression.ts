#!/usr/bin/env node
import { spawn } from "node:child_process";
import { join } from "node:path";
import { runE2eWithAiRegression } from "../regression/ai-regression-hook.ts";

import { workspaceRoot as root } from "../shared/workspace-paths.ts";
const nx = join(root, "node_modules/nx/dist/bin/nx.js");
const forwardedArgs = process.argv.slice(2);
if (forwardedArgs[0] === "--") forwardedArgs.shift();
process.exit(
  await runE2eWithAiRegression({
    flag: process.env.RUN_AI_REGRESSION,
    runOrdinaryE2e: () => run(process.execPath, [nx, "run", "portal-e2e:e2e", ...forwardedArgs]),
    runRegression: () =>
      run(process.execPath, [join(root, "tools/probable-waffle/skirmish/ai/cli/run-ai-regression.ts")])
  })
);

function run(command, args) {
  return new Promise((resolveExit, reject) => {
    const child = spawn(command, args, { cwd: root, stdio: "inherit", windowsHide: true });
    child.once("error", reject);
    child.once("close", (code, signal) => resolveExit(code ?? (signal ? 1 : 0)));
  });
}
