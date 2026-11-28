#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runE2eWithAi } from "./e2e-ai-runner.mjs";
import { readWorkingTreeSource } from "../probable-waffle/skirmish/ai/matrix/skirmish-matrix-io.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const [mode, ...forwardedArgs] = process.argv.slice(2);
if (forwardedArgs[0] === "--") forwardedArgs.shift();

try {
  process.exitCode = await runE2eWithAi({ mode, forwardedArgs, run, resolveRelease });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

/** Reuse the matrix's clean-source authority before spending time on ordinary E2E, then pin candidate provenance. */
function resolveRelease() {
  if (readWorkingTreeSource().length > 0) {
    throw new Error(
      "candidate_source_is_dirty: full AI preflight stopped before E2E. " +
        "Commit tracked changes and move or commit untracked files; inspect git status --short."
    );
  }
  const candidate = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  console.log("Full AI release matrix: deferred content is not executed.");
  return { candidate };
}

function run(args) {
  return new Promise((resolveExit, reject) => {
    const child = spawn(process.execPath, [join(root, args[0]), ...args.slice(1)], {
      cwd: root,
      stdio: "inherit",
      windowsHide: true
    });
    child.once("error", reject);
    child.once("close", (code, signal) => resolveExit(code ?? (signal ? 1 : 0)));
  });
}
