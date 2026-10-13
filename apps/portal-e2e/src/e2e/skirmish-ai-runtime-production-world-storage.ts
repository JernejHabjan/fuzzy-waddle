import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { buildRuntimeProductionReport } from "./skirmish-ai-runtime-production-report";

/** Store native records once; reproducible joined views can exceed V8's single-string limit. */
export function encodeRuntimeProductionWorld(result: RuntimeVariantResultV1) {
  return {
    productionWorldStorage: 1,
    result: {
      ...result,
      productionCausality: undefined,
      productionEvidenceV2: undefined
    }
  };
}

/** Legacy views remain untouched. Raw storage reuses the retained actual setup and the current pure readers. */
export function decodeRuntimeProductionWorld(artifact: {
  readonly result: RuntimeVariantResultV1;
  readonly productionWorldStorage?: number;
}): RuntimeVariantResultV1 {
  if (!artifact?.result || typeof artifact.result !== "object")
    throw new Error("production_world_storage_shape_invalid");
  if (artifact.productionWorldStorage === undefined) return artifact.result;
  if (artifact.productionWorldStorage !== 1) throw new Error("production_world_storage_version_invalid");
  const result = artifact.result;
  if (!result.productionCapture) throw new Error("production_world_storage_capture_missing");
  if (result.presetFixtureId && !result.productionPreset) throw new Error("production_world_storage_preset_missing");
  return { ...result, ...buildRuntimeProductionReport(result.productionCapture, result.productionPreset) };
}
