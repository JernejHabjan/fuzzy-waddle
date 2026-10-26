import { expect, test } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { evaluateScenario } from "./skirmish-ai-runtime-evaluation";
import { evaluateRuntimeVariant } from "./skirmish-ai-runtime-variant-evaluation";
import { parseRequest } from "./skirmish-ai-runtime-request-parser";
import { runRegisteredRuntimeVariant } from "./skirmish-ai-runtime-registered-variant";
import { last } from "./skirmish-ai-runtime-value";
import { checkRuntimeProductionReportBridge } from "./skirmish-ai-runtime-production-report";
import { publishRuntimeResult } from "./skirmish-ai-runtime-result-output";
import { readRuntimeRequestText } from "./skirmish-ai-runtime-request-transport.mjs";
import { skirmishRuntimeTestTimeoutMs } from "./skirmish-ai-runtime-timeout.mjs";

const runtimeRequestText = readRuntimeRequestText(process.env);

test.skip(!runtimeRequestText, "The skirmish AI runtime driver is invoked only by the matrix runner.");
test.setTimeout(600_000);

test("executes selected AI scenarios in real lobby-started Phaser matches", async ({ browser }) => {
  const request = parseRequest(runtimeRequestText);
  const selectedFixtures = [
    ...new Set(
      request.scenarioIds
        .map((scenarioId) => request.fixtures.find((fixture) => fixture.scenarioIds.includes(scenarioId)))
        .filter((fixture): fixture is RuntimeFixtureV1 => fixture !== undefined)
    )
  ];
  const variantRuns = selectedFixtures.reduce(
    (total, fixture) =>
      total +
      fixture.recipe.variants
        .filter(
          (variant) =>
            (variant.scenarioIds === undefined || variant.scenarioIds.some((id) => request.scenarioIds.includes(id))) &&
            (request.diagnosticSelection === undefined || variant.id === request.diagnosticSelection.variantId)
        )
        .reduce((count, variant) => count + (request.diagnosticSelection ? 1 : (variant.repetitions ?? 1)), 0),
    0
  );
  const selectedVariantHorizons = selectedFixtures.flatMap((fixture) =>
    fixture.recipe.variants
      .filter(
        (variant) =>
          (variant.scenarioIds === undefined || variant.scenarioIds.some((id) => request.scenarioIds.includes(id))) &&
          (request.diagnosticSelection === undefined || variant.id === request.diagnosticSelection.variantId)
      )
      .map((variant) => {
        const scenarioIds = request.scenarioIds.filter(
          (scenarioId) =>
            fixture.scenarioIds.includes(scenarioId) &&
            (variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId))
        );
        const checkpointTicks = variant.checkpointTicks ?? fixture.recipe.checkpointTicks;
        return Math.max(
          ...scenarioIds.map((scenarioId) => fixture.assertions[scenarioId]?.maximumTick ?? checkpointTicks.at(-1) ?? 0)
        );
      })
  );
  const maximumVariantTicks = Math.max(0, ...selectedVariantHorizons);
  // Budget each serial variant from its simulation horizon; selected Skaduwee matches exceed 30 minutes locally.
  test.setTimeout(skirmishRuntimeTestTimeoutMs(variantRuns, maximumVariantTicks));
  const fixtureRuns = new Map<RuntimeFixtureV1, readonly RuntimeVariantResultV1[]>();
  const fixtureErrors = new Map<RuntimeFixtureV1, string[]>();
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
          (candidate.scenarioIds === undefined ||
            candidate.scenarioIds.some((id) => request.scenarioIds.includes(id))) &&
          (!request.diagnosticSelection || candidate.id === request.diagnosticSelection.variantId)
      )) {
        for (let repetition = 1; repetition <= (variant.repetitions ?? 1); repetition += 1) {
          if (request.diagnosticSelection && repetition !== request.diagnosticSelection.repetition) continue;
          try {
            executed.push({ ...(await runRegisteredRuntimeVariant(browser, fixture, variant, request)), repetition });
          } catch (error) {
            // Preserve successful worlds and continue independent cases; an absent world is never a synthetic pass.
            const failures = fixtureErrors.get(fixture) ?? [];
            failures.push(
              `runtime_variant_failed:${variant.id}:${repetition}:${(error instanceof Error
                ? error.message
                : String(error)
              ).slice(0, 1024)}`
            );
            fixtureErrors.set(fixture, failures);
          }
        }
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
    // Retain raw native evidence in the emitted failed report so bridge failures can be diagnosed at the final gate.
    const bridgeFailures = scenarioVariants.flatMap((variant) =>
      checkRuntimeProductionReportBridge(scenarioId, variant)
    );
    const diagnosticVariant = scenarioVariants[0];
    const assertion = fixture.assertions[scenarioId];
    let failures: string[];
    try {
      failures = request.diagnosticSelection
        ? scenarioVariants.length === 1 && diagnosticVariant
          ? assertion
            ? evaluateRuntimeVariant(scenarioId, assertion, diagnosticVariant, fixture)
            : [`runtime_assertions_missing:${scenarioId}`]
          : ["diagnostic_variant_missing_or_ambiguous"]
        : evaluateScenario(scenarioId, fixture, scenarioVariants);
    } catch (error) {
      failures = [`runtime_oracle_failed:${(error instanceof Error ? error.message : String(error)).slice(0, 1024)}`];
    }
    failures.push(...bridgeFailures);
    failures.push(...(fixtureErrors.get(fixture) ?? []));
    scenarioResults.push({ scenarioId, passed: failures.length === 0, failures, variants: scenarioVariants });
  }

  const report = {
    schemaVersion: 1,
    sourceRevision: request.sourceRevision,
    dirtySourceDigest: request.dirtySourceDigest,
    fixtureDigest: request.fixtureDigest,
    status: request.diagnosticSelection
      ? scenarioResults.every((result) => result.passed)
        ? "diagnostic_passed"
        : "diagnostic_failed"
      : scenarioResults.every((result) => result.passed)
        ? "passed"
        : "failed",
    diagnosticSelection: request.diagnosticSelection ?? null,
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
  publishRuntimeResult(report, process.env.AI_SKIRMISH_RUNTIME_RESULT_PATH);
  expect(report.workCounts.decisions).toBeGreaterThan(0);
  expect(report.workCounts.ticks).toBeGreaterThan(0);
  expect(scenarioResults.flatMap((result) => result.failures)).toEqual([]);
});
