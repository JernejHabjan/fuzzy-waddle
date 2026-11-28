const aiCli = "tools/probable-waffle/skirmish/ai/cli";

/** Preflight full releases before E2E; forward E2E arguments only to Nx and preserve either child's failure code. */
export async function runE2eWithAi({ mode, forwardedArgs = [], run, resolveRelease }) {
  if (!["core", "full"].includes(mode)) throw new Error(`invalid_e2e_ai_mode:${mode}; expected core or full`);
  const release = mode === "full" ? resolveRelease() : null;
  const ordinaryExit = await run(["node_modules/nx/dist/bin/nx.js", "run", "portal-e2e:e2e", ...forwardedArgs]);
  if (ordinaryExit !== 0) return ordinaryExit;
  if (mode === "core") return run([`${aiCli}/run-ai-regression.ts`, "--profile", "core"]);

  const { candidate } = release;
  return run([`${aiCli}/run-skirmish-matrix.ts`, "--suite", "release", "--candidate", candidate]);
}
