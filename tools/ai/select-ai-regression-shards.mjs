#!/usr/bin/env node
import { appendFileSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { resolveAiRegressionSelection } from "./ai-regression-selection.mjs";

const directory = join(dirname(fileURLToPath(import.meta.url)), "fixtures");
const pack = readJson("ai-regression-v1.json");
const manifest = readJson("skirmish-v1.json");
const selection = resolveAiRegressionSelection(pack, manifest, readJson);
const matrix = JSON.stringify({ include: selection.selected.map(({ caseId, scenarioId, variantId }) => ({
  id: caseId,
  caseId,
  scenarioId,
  variantId
})) });
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `matrix=${matrix}\n`);
process.stdout.write(`${JSON.stringify({ matrix: JSON.parse(matrix), omittedVariantCount: selection.omissions.length,
  estimatedWallMs: selection.estimatedWallMs, runtimeBudgetMs: selection.runtimeBudgetMs })}\n`);

function readJson(reference) {
  return JSON.parse(readFileSync(join(directory, reference), "utf8"));
}
