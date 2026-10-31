export function parseAiRegressionFlag(value) {
  if (value === undefined || value === "false") return false;
  if (value === "true") return true;
  throw new Error(`invalid_RUN_AI_REGRESSION:${value}; expected true or false`);
}

export async function runE2eWithAiRegression({ flag, runOrdinaryE2e, runRegression }) {
  const enabled = parseAiRegressionFlag(flag);
  const ordinaryExit = await runOrdinaryE2e();
  if (ordinaryExit !== 0 || !enabled) return ordinaryExit;
  return runRegression();
}
