import { expect, test } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { evaluateScenario } from "./skirmish-ai-runtime-evaluation";
import { evaluateRuntimeVariant } from "./skirmish-ai-runtime-variant-evaluation";
import { parseRequest } from "./skirmish-ai-runtime-request-parser";
import { runVariant } from "./skirmish-ai-runtime-variant-runner";
import { last } from "./skirmish-ai-runtime-value";
import { checkRuntimeProductionReportBridge } from "./skirmish-ai-runtime-production-report";
import { publishRuntimeResult } from "./skirmish-ai-runtime-result-output";

const runtimeRequestText = process.env.AI_SKIRMISH_RUNTIME_REQUEST;

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
          (candidate.scenarioIds === undefined ||
            candidate.scenarioIds.some((id) => request.scenarioIds.includes(id))) &&
          (!request.diagnosticSelection || candidate.id === request.diagnosticSelection.variantId)
      )) {
        for (let repetition = 1; repetition <= (variant.repetitions ?? 1); repetition += 1) {
          if (request.diagnosticSelection && repetition !== request.diagnosticSelection.repetition) continue;
          executed.push({
            ...(await runVariant(
              browser,
              fixture,
              variant,
              request.seed,
              request.scenarioIds,
              request.sourceRevision,
              request.fixtureDigest
            )),
            repetition
          });
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
    const failures = request.diagnosticSelection
      ? scenarioVariants.length === 1 && diagnosticVariant
        ? assertion
          ? evaluateRuntimeVariant(scenarioId, assertion, diagnosticVariant)
          : [`runtime_assertions_missing:${scenarioId}`]
        : ["diagnostic_variant_missing_or_ambiguous"]
      : evaluateScenario(scenarioId, fixture, scenarioVariants);
    failures.push(...bridgeFailures);
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
