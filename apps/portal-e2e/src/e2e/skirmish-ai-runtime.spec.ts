import { expect, test } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { evaluateScenario } from "./skirmish-ai-runtime-evaluation";
import { parseRequest } from "./skirmish-ai-runtime-request-parser";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { last } from "./skirmish-ai-runtime-value";

const runtimeRequestText = process.env.AI_SKIRMISH_RUNTIME_REQUEST;
const resultPrefix = "AI_SKIRMISH_RUNTIME_RESULT_V1:";

test.skip(!runtimeRequestText, "The skirmish AI runtime driver is invoked only by the matrix runner.");
test.setTimeout(1_200_000);

test("executes selected AI scenarios in real lobby-started Phaser matches", async ({ browser }) => {
  const request = parseRequest(runtimeRequestText);
  const fixtureRuns = new Map<RuntimeFixtureV1, readonly RuntimeVariantResultV1[]>();
  const scenarioResults: {
    scenarioId: string;
    passed: boolean;
    failures: string[];
    variants: readonly RuntimeVariantResultV1[];
  }[] = [];

  for (const scenarioId of request.scenarioIds) {
    const fixture = request.fixtures.find((candidate) => candidate.scenarioIds.includes(scenarioId));
    if (!fixture) throw new Error(`runtime_fixture_missing:${scenarioId}`);
    let variants = fixtureRuns.get(fixture);
    if (!variants) {
      const executed: RuntimeVariantResultV1[] = [];
      for (const variant of fixture.recipe.variants.filter(
        (candidate) =>
          candidate.scenarioIds === undefined || candidate.scenarioIds.some((id) => request.scenarioIds.includes(id))
      )) {
        executed.push(await runVariant(browser, fixture, variant, request.seed, request.scenarioIds));
      }
      variants = executed;
      fixtureRuns.set(fixture, variants);
    }
    const applicableVariantIds = new Set(
      fixture.recipe.variants
        .filter((variant) => variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId))
        .map((variant) => variant.id)
    );
    const scenarioVariants = variants.filter((variant) => applicableVariantIds.has(variant.variantId));
    const failures = evaluateScenario(scenarioId, fixture, scenarioVariants);
    scenarioResults.push({ scenarioId, passed: failures.length === 0, failures, variants: scenarioVariants });
  }

  const report = {
    schemaVersion: 1,
    sourceRevision: request.sourceRevision,
    dirtySourceDigest: request.dirtySourceDigest,
    fixtureDigest: request.fixtureDigest,
    status: scenarioResults.every((result) => result.passed) ? "passed" : "failed",
    scenarios: scenarioResults,
    workCounts: {
      scenarios: scenarioResults.length,
      decisions: [...fixtureRuns.values()].reduce(
        (sum, variants) =>
          sum + variants.reduce((variantSum, variant) => variantSum + last(variant.checkpoints).decisionSequence, 0),
        0
      ),
      ticks: [...fixtureRuns.values()].reduce(
        (sum, variants) =>
          sum + variants.reduce((variantSum, variant) => variantSum + last(variant.checkpoints).tick, 0),
        0
      )
    }
  } as const;
  console.log(`${resultPrefix}${JSON.stringify(report)}`);
  expect(report.workCounts.decisions).toBeGreaterThan(0);
  expect(report.workCounts.ticks).toBeGreaterThan(0);
  expect(scenarioResults.flatMap((result) => result.failures)).toEqual([]);
});
