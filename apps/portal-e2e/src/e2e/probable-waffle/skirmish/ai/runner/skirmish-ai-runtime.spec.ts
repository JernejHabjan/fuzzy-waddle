import { existsSync } from "node:fs";
import { expect, test } from "@playwright/test";
import type { RuntimeFixture } from "../contracts/skirmish-ai-runtime-fixture";
import type { RuntimeVariantResult } from "./skirmish-ai-runtime-variant-result";
import { evaluateScenario } from "../evaluation/controls/skirmish-ai-runtime-evaluation";
import { evaluateRuntimeVariant } from "../evaluation/controls/skirmish-ai-runtime-variant-evaluation";
import { parseRequest } from "./skirmish-ai-runtime-request-parser";
import { runRegisteredRuntimeVariant } from "../setup/skirmish-ai-runtime-registered-variant";
import { last } from "../contracts/skirmish-ai-runtime-value";
import { checkRuntimeProductionReportBridge } from "../production/evidence/skirmish-ai-runtime-production-report";
import { publishRuntimeResult } from "./skirmish-ai-runtime-result-output";
import { readRuntimeRequestText } from "@fuzzy-waddle/probable-waffle-skirmish-ai-tools/shared/transport/skirmish-ai-runtime-request-transport";
import { skirmishRuntimeTestTimeoutMs } from "@fuzzy-waddle/probable-waffle-skirmish-ai-tools/shared/transport/skirmish-ai-runtime-timeout";
import {
  assembleRuntimeParts,
  runtimePartPath,
  writeRuntimePart
} from "@fuzzy-waddle/probable-waffle-skirmish-ai-tools/shared/transport/skirmish-ai-runtime-parts";

const runtimeRequestText = readRuntimeRequestText(process.env);
const resultArtifactPath = process.env.AI_SKIRMISH_RUNTIME_RESULT_PATH;

if (!runtimeRequestText) {
  test.skip(true, "The skirmish AI runtime driver is invoked only by the matrix runner.");
  test("executes selected AI scenarios in real lobby-started Phaser matches", async () => {
    // Skipped when invoked outside the matrix runner.
  });
} else {
  const request = parseRequest(runtimeRequestText);
  const fixtureGroups = groupScenariosByFixture(request.scenarioIds, request.fixtures);
  const groupByTitle = new Map<string, { partIndex: number; scenarioIds: string[] }>();

  test.afterEach(({ browserName }, testInfo) => {
    void browserName;
    if (!resultArtifactPath) return;
    const entry = groupByTitle.get(testInfo.title);
    if (!entry || existsSync(runtimePartPath(resultArtifactPath, entry.partIndex))) return;
    const reason =
      testInfo.status === "timedOut"
        ? `runtime_test_timeout:${testInfo.timeout}ms`
        : `runtime_test_${testInfo.status}:${(testInfo.error?.message ?? "aborted").slice(0, 200)}`;
    const abortedResults = entry.scenarioIds.map((scenarioId) => ({
      scenarioId,
      passed: false,
      failures: [reason],
      variants: [] as RuntimeVariantResult[]
    }));
    writeRuntimePart(resultArtifactPath, entry.partIndex, buildPartReport(request, abortedResults, []));
  });

  test.afterAll(() => {
    if (!resultArtifactPath) return;
    assembleRuntimeParts(resultArtifactPath, {
      sourceRevision: request.sourceRevision,
      dirtySourceDigest: request.dirtySourceDigest,
      fixtureDigest: request.fixtureDigest,
      diagnosticSelection: request.diagnosticSelection ?? null
    });
  });

  for (const [partIndex, group] of fixtureGroups.entries()) {
    const title = `executes AI runtime [${group.scenarioIds.join(", ")}]`;
    groupByTitle.set(title, { partIndex, scenarioIds: group.scenarioIds });
    test(title, async ({ browser }) => {
      const { fixture, scenarioIds } = group;
      const applicableVariants = fixture.recipe.variants.filter(
        (variant) =>
          (variant.scenarioIds === undefined || variant.scenarioIds.some((id) => scenarioIds.includes(id))) &&
          (request.diagnosticSelection === undefined || variant.id === request.diagnosticSelection.variantId)
      );
      const variantRuns = applicableVariants.reduce(
        (count, variant) => count + (request.diagnosticSelection ? 1 : (variant.repetitions ?? 1)),
        0
      );
      const selectedVariantHorizons = applicableVariants.map((variant) => {
        const variantScenarioIds = scenarioIds.filter(
          (scenarioId) => variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId)
        );
        const checkpointTicks = variant.checkpointTicks ?? fixture.recipe.checkpointTicks;
        return Math.max(
          ...variantScenarioIds.map(
            (scenarioId) => fixture.assertions[scenarioId]?.maximumTick ?? checkpointTicks.at(-1) ?? 0
          )
        );
      });
      const maximumVariantTicks = Math.max(0, ...selectedVariantHorizons);
      test.setTimeout(skirmishRuntimeTestTimeoutMs(variantRuns, maximumVariantTicks));

      const executed: RuntimeVariantResult[] = [];
      const fixtureErrors: string[] = [];
      for (const variant of applicableVariants) {
        for (let repetition = 1; repetition <= (variant.repetitions ?? 1); repetition += 1) {
          if (request.diagnosticSelection && repetition !== request.diagnosticSelection.repetition) continue;
          try {
            executed.push({ ...(await runRegisteredRuntimeVariant(browser, fixture, variant, request)), repetition });
          } catch (error) {
            fixtureErrors.push(
              `runtime_variant_failed:${variant.id}:${repetition}:${(error instanceof Error
                ? error.message
                : String(error)
              ).slice(0, 1024)}`
            );
          }
        }
      }

      const scenarioResults = scenarioIds.map((scenarioId) => {
        const applicableVariantIds = new Set(
          fixture.recipe.variants
            .filter((variant) => variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId))
            .map((variant) => variant.id)
        );
        const scenarioVariants = executed.filter((variant) => applicableVariantIds.has(variant.variantId));
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
          failures = [
            `runtime_oracle_failed:${(error instanceof Error ? error.message : String(error)).slice(0, 1024)}`
          ];
        }
        failures.push(...bridgeFailures, ...fixtureErrors);
        return { scenarioId, passed: failures.length === 0, failures, variants: scenarioVariants };
      });

      const partReport = buildPartReport(request, scenarioResults, executed);
      for (const scenario of scenarioResults) {
        const detail = scenario.passed ? "" : ` -> ${(scenario.failures[0] ?? "failed").slice(0, 140)}`;
        process.stdout.write(`  [${scenario.passed ? "PASS" : "FAIL"}] ${scenario.scenarioId}${detail}\n`);
      }
      if (resultArtifactPath) {
        writeRuntimePart(resultArtifactPath, partIndex, partReport);
      } else {
        publishRuntimeResult(partReport, undefined);
      }
      expect(partReport.workCounts.decisions).toBeGreaterThan(0);
      expect(partReport.workCounts.ticks).toBeGreaterThan(0);
      expect(scenarioResults.flatMap((result) => result.failures)).toEqual([]);
    });
  }
}

function groupScenariosByFixture(
  scenarioIds: readonly string[],
  fixtures: readonly RuntimeFixture[]
): { fixture: RuntimeFixture; scenarioIds: string[] }[] {
  const groups: { fixture: RuntimeFixture; scenarioIds: string[] }[] = [];
  const byFixture = new Map<RuntimeFixture, { fixture: RuntimeFixture; scenarioIds: string[] }>();
  for (const scenarioId of scenarioIds) {
    const fixture = fixtures.find((candidate) => candidate.scenarioIds.includes(scenarioId));
    if (!fixture) throw new Error(`runtime_fixture_missing:${scenarioId}`);
    let group = byFixture.get(fixture);
    if (!group) {
      group = { fixture, scenarioIds: [] };
      byFixture.set(fixture, group);
      groups.push(group);
    }
    group.scenarioIds.push(scenarioId);
  }
  return groups;
}

function buildPartReport(
  request: ReturnType<typeof parseRequest>,
  scenarioResults: {
    scenarioId: string;
    passed: boolean;
    failures: string[];
    variants: RuntimeVariantResult[];
  }[],
  executed: readonly RuntimeVariantResult[]
) {
  const allPassed = scenarioResults.every((result) => result.passed);
  return {
    schemaVersion: 1 as const,
    sourceRevision: request.sourceRevision,
    dirtySourceDigest: request.dirtySourceDigest,
    fixtureDigest: request.fixtureDigest,
    status: request.diagnosticSelection
      ? allPassed
        ? ("diagnostic_passed" as const)
        : ("diagnostic_failed" as const)
      : allPassed
        ? ("passed" as const)
        : ("failed" as const),
    diagnosticSelection: request.diagnosticSelection ?? null,
    scenarios: scenarioResults,
    workCounts: {
      scenarios: scenarioResults.length,
      decisions: executed.reduce((sum, variant) => sum + last(variant.checkpoints).decisionSequence, 0),
      ticks: executed.reduce((sum, variant) => sum + last(variant.checkpoints).tick, 0)
    }
  };
}
