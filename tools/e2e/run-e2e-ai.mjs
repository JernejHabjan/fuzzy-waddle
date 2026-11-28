#!/usr/bin/env node
import { execFileSync, spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { runE2eWithAi } from "./e2e-ai-runner.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));
const [mode, ...forwardedArgs] = process.argv.slice(2);
if (forwardedArgs[0] === "--") forwardedArgs.shift();

try {
  process.exitCode = await runE2eWithAi({ mode, forwardedArgs, run, resolveRelease });
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}

/** Resolve release provenance from the checked-out revision and the matrix's pinned baseline authority. */
function resolveRelease() {
  const candidate = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
  const fixtures = join(root, "tools/probable-waffle/skirmish/ai/testing/fixtures");
  const manifest = JSON.parse(readFileSync(join(fixtures, "skirmish-scenario-manifest.json"), "utf8"));
  const baseline = JSON.parse(readFileSync(join(fixtures, manifest.baseline), "utf8")).baselineSourceSha;
  console.log(
    "Full AI release matrix: deferred content is not executed; pinned-baseline limitations may block certification."
  );
  return { candidate, baseline };
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
