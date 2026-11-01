#!/usr/bin/env node
import { appendFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAiRegressionSelection } from "../regression/ai-regression-selection.ts";

const directory = fileURLToPath(new URL("../testing/fixtures/", import.meta.url));
const pack = readJson("periodic-native-regression-profiles.json");
const manifest = readJson("skirmish-scenario-manifest.json");
const selection = resolveAiRegressionSelection(pack, manifest, readJson, process.env.AI_REGRESSION_PROFILE ?? "core");
const matrix = JSON.stringify({
  include: selection.selected.map(({ caseId, scenarioId, variantId }) => ({
    id: caseId,
    caseId,
    scenarioId,
    variantId
  }))
});
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${matrix}\n`);
process.stdout.write(
  `${JSON.stringify({
    matrix: JSON.parse(matrix),
    omittedVariantCount: selection.omissions.length,
    estimatedWallMs: selection.estimatedWallMs,
    runtimeBudgetMs: selection.runtimeBudgetMs
  })}\n`
);

function readJson(reference) {
  return JSON.parse(readFileSync(join(directory, reference), "utf8"));
}
