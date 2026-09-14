import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { evaluateRuntimeVariant } from "./skirmish-ai-runtime-variant-evaluation";

export function evaluateScenario(
  scenarioId: string,
  fixture: RuntimeFixtureV1,
  variants: readonly RuntimeVariantResultV1[]
): string[] {
  const assertion = fixture.assertions[scenarioId];
  if (!assertion) return [`runtime_assertions_missing:${scenarioId}`];
  const applicableVariantIds = new Set(
    fixture.recipe.variants
      .filter((variant) => variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId))
      .map((variant) => variant.id)
  );
  const selectedVariants = variants.filter((variant) => applicableVariantIds.has(variant.variantId));
  if (selectedVariants.length === 0) return [`runtime_variants_missing:${scenarioId}`];
  const failures: string[] = [];
  const actualFactions = [...new Set(selectedVariants.map((variant) => variant.aiFaction))].sort();
  const requiredFactions = [...assertion.requiredAiFactions].sort();
  if (JSON.stringify(actualFactions) !== JSON.stringify(requiredFactions)) failures.push("required_ai_factions");
  if (assertion.requireNoInitialWorker && !selectedVariants.some((variant) => variant.initialWorkerCount === 0)) {
    failures.push("no_no_worker_variant");
  }
  for (const variant of selectedVariants) {
    failures.push(...evaluateRuntimeVariant(scenarioId, assertion, variant));
  }
  return failures;
}
