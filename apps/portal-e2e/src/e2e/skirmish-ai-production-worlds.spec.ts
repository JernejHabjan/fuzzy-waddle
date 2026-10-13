import { test, expect } from "@playwright/test";
import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { digestRuntimeValue } from "./skirmish-ai-runtime-digest";
import { evaluateRuntimeVariant } from "./skirmish-ai-runtime-variant-evaluation";
import { evaluateRuntimeProductionPairs } from "./skirmish-ai-runtime-production-pair-evaluation";
import { encodeRuntimeArtifact } from "./skirmish-ai-runtime-artifact-codec.mjs";
import type { RuntimeProductionPairInput } from "./skirmish-ai-runtime-production-pair-input";

const root = resolve(__dirname, "../../../..");
const source = JSON.parse(
  readFileSync(resolve(root, "tools/ai/fixtures/production-authority-runtime.json"), "utf8")
) as RuntimeFixtureV1;
const requested = process.env.AI_PRODUCTION_WORLD_HORIZON;
test.skip(
  !requested,
  "Explicit physical-world integration run. Shortened runs are diagnostics, never full certification."
);
test.setTimeout(240_000);
const horizon = requested ? Number(requested) : 2000;
const outputDirectory = resolve(
  root,
  process.env.AI_PRODUCTION_WORLD_OUTPUT ?? `tmp/ai-plans/759-validation/production-worlds/${horizon}`
);

for (const authored of source.recipe.variants) {
  test(authored.id, async ({ browser }, testInfo) => {
    expect(Number.isSafeInteger(horizon) && horizon > 20 && horizon <= 2000).toBe(true);
    const scenarioId = authored.scenarioIds?.[0];
    if (!scenarioId) throw new Error("physical_world_scenario_missing");
    const assertion = source.assertions[scenarioId];
    const contract = assertion?.requiredProductionContracts?.[authored.id];
    if (!assertion || !contract) throw new Error("physical_world_contract_missing");
    const variant = {
      ...authored,
      checkpointTicks: [20, ...source.recipe.checkpointTicks.filter((tick) => tick > 20 && tick < horizon), horizon],
      presetWorld: authored.presetWorld
        ? { ...authored.presetWorld, events: authored.presetWorld.events?.filter((event) => event.tick <= horizon) }
        : undefined
    };
    const fixture: RuntimeFixtureV1 = {
      ...source,
      recipe: { ...source.recipe, variants: [variant] },
      assertions: {
        [scenarioId]: {
          ...assertion,
          maximumTick: horizon,
          requiredProductionContracts: {
            [variant.id]: { ...contract, latestTick: horizon }
          }
        }
      }
    };
    const revision = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
    const result = await runVariant(
      browser,
      fixture,
      variant,
      null,
      [scenarioId],
      revision,
      digestRuntimeValue(fixture)
    );

    mkdirSync(outputDirectory, { recursive: true });
    const failures = evaluateRuntimeVariant(scenarioId, assertion, result);
    const evidence = result.productionEvidenceV2;
    const pairInput: RuntimeProductionPairInput = {
      variantId: result.variantId,
      aiFaction: result.aiFaction,
      seed: result.seed,
      mapLabel: result.mapLabel,
      presetFixtureId: result.presetFixtureId,
      presetInitialResourceBalances: result.presetInitialResourceBalances,
      productionEvidenceV2: evidence
        ? {
            setup: evidence.setup,
            decisions: evidence.decisions
              .filter((entry) => entry.result.economyProduction.transition?.status === "committed")
              .slice(0, 1)
          }
        : undefined
    };
    writeFileSync(resolve(outputDirectory, `${variant.id}-pair.json`), JSON.stringify(pairInput));
    const summary = {
      variant: variant.id,
      scenarioId,
      horizon,
      revision,
      fixtureDigest: digestRuntimeValue(fixture),
      finalTick: result.checkpoints.at(-1)?.tick,
      decisions: evidence?.decisions.length,
      nativeDecisions: result.productionCapture?.facts.filter((fact) => fact.kind === "decision_selected").length,
      setupActors: result.productionCapture?.setup?.actors.length,
      closedThrough: evidence?.coverage?.closedThroughTick,
      droppedFacts: result.productionCapture?.droppedFactCount,
      transitions: [
        ...new Set(
          evidence?.decisions.map((entry) => entry.result.economyProduction.transition?.status).filter(Boolean)
        )
      ],
      controlledRefunds: evidence?.lifecycle.controlledRefunds?.map((entry) => ({
        itemId: entry.request.control.setupItemId,
        requestTick: entry.request.tick,
        refundTick: entry.refund?.tick,
        failures: entry.failures
      })),
      failures: [...new Set(failures)],
      aiErrors: result.aiErrors,
      omittedCases: 0
    };
    writeFileSync(resolve(outputDirectory, `${variant.id}.json`), JSON.stringify(encodeRuntimeArtifact({ result })));
    writeFileSync(resolve(outputDirectory, `${variant.id}-summary.json`), JSON.stringify(summary, null, 2));
    console.log(`AI_PRODUCTION_WORLD:${JSON.stringify(summary)}`);
    await testInfo.attach("physical-world-summary", { body: JSON.stringify(summary), contentType: "application/json" });
    expect(result.aiErrors).toEqual([]);
    expect(result.productionCapture?.droppedFactCount).toBe(0);
    if (horizon === 2000) {
      expect(evidence?.coverage?.closedThroughTick).toBe(horizon);
      expect(failures).toEqual([]);
    }
  });
}

test.afterAll(() => {
  if (!requested) return;
  mkdirSync(outputDirectory, { recursive: true });
  const results: RuntimeProductionPairInput[] = source.recipe.variants.flatMap((variant) => {
    const path = resolve(outputDirectory, `${variant.id}-pair.json`);
    return existsSync(path) ? [JSON.parse(readFileSync(path, "utf8")) as RuntimeProductionPairInput] : [];
  });
  const pairs = source.scenarioIds.flatMap((id) => {
    const assertion = source.assertions[id];
    return assertion ? evaluateRuntimeProductionPairs(id, assertion, results) : [`assertion_missing:${id}`];
  });
  writeFileSync(
    resolve(outputDirectory, "pairs.json"),
    JSON.stringify({ selected: results.length, expected: 16, diagnostic: horizon !== 2000, failures: pairs }, null, 2)
  );
  if (horizon === 2000 && results.length === source.recipe.variants.length) expect(pairs).toEqual([]);
});
