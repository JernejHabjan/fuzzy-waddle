export async function executeAiRegressionCases({ cases, budgetMs, runCase, now = Date.now, onResult = () => undefined }) {
  if (!Array.isArray(cases) || cases.length === 0) throw new Error("ai_regression_empty_selection");
  if (!Number.isSafeInteger(budgetMs) || budgetMs < 1 || typeof runCase !== "function")
    throw new Error("invalid_ai_regression_execution");
  const started = now();
  const results = [];
  for (const entry of cases) {
    if (now() - started >= budgetMs) {
      const skipped = { caseId: entry.caseId, scenarioId: entry.scenarioId, variantId: entry.variantId,
        status: "not_run_budget_exhausted" };
      results.push(skipped);
      onResult(skipped);
      continue;
    }
    let result;
    try { result = await runCase(entry, budgetMs - (now() - started)); }
    catch (error) {
      result = { caseId: entry.caseId, scenarioId: entry.scenarioId, variantId: entry.variantId,
        status: "runner_error", error: error instanceof Error ? error.message : String(error) };
    }
    if (!result || result.caseId !== entry.caseId || typeof result.status !== "string")
      result = { caseId: entry.caseId, scenarioId: entry.scenarioId, variantId: entry.variantId, status: "invalid_runner_result" };
    results.push(result);
    onResult(result);
  }
  return results;
}
