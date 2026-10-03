import { requireInteger } from "./skirmish-matrix-io.mjs";

export function selectDiagnosticVariant(options, scenarioId, mode, fixture) {
  if (mode !== "runtime" || typeof options.variant !== "string" ||
      !/^[A-Za-z0-9._-]{1,100}$/.test(options.variant)) throw new Error("invalid_diagnostic_variant");
  const repetition = requireInteger(options.repetition, "repetition", 1, 1000);
  const variants = fixture.recipe?.variants?.filter((variant) => variant.id === options.variant &&
    (variant.scenarioIds === undefined || variant.scenarioIds.includes(scenarioId))) ?? [];
  if (variants.length !== 1) throw new Error(`diagnostic_variant_missing_or_ambiguous:${options.variant}`);
  if (repetition > (variants[0].repetitions ?? 1)) throw new Error("diagnostic_repetition_out_of_range");
  return { scenarioId, variantId: options.variant, repetition };
}
