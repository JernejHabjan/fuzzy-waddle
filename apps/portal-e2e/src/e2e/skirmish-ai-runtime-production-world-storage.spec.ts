import { expect, test } from "@playwright/test";
import type { RuntimeVariantResultV1 } from "./skirmish-ai-runtime-variant-result";
import { productionConsumedDecisionFixture } from "./skirmish-ai-runtime-production-consumed-decision-fixture";
import { buildRuntimeProductionReport } from "./skirmish-ai-runtime-production-report";
import {
  encodeRuntimeProductionWorld,
  decodeRuntimeProductionWorld
} from "./skirmish-ai-runtime-production-world-storage";

test("raw world storage avoids expanding joined views and reprojects exact native facts without dropping failures", () => {
  const f = productionConsumedDecisionFixture();
  const report = buildRuntimeProductionReport(f.capture);
  const tooLarge = {
    toJSON: () => {
      throw new Error("derived_view_expanded");
    }
  };
  const result = {
    presetFixtureId: null,
    ...report,
    productionCausality: tooLarge,
    productionEvidenceV2: tooLarge
  } as unknown as RuntimeVariantResultV1;
  const stored = JSON.parse(JSON.stringify(encodeRuntimeProductionWorld(result)));
  expect(stored.result.productionCausality).toBeUndefined();
  expect(stored.result.productionEvidenceV2).toBeUndefined();
  const restored = decodeRuntimeProductionWorld(stored);
  expect(restored.productionCapture).toEqual(f.capture);
  expect(restored.productionCausality).toEqual(report.productionCausality);
  expect(restored.productionEvidenceV2).toEqual(report.productionEvidenceV2);
  expect(restored.productionEvidenceV2?.gaps.length).toBeGreaterThan(0);
});

test("legacy views are preserved and missing raw/setup or foreign storage versions fail closed", () => {
  const legacy = { presetFixtureId: "native", productionEvidenceV2: { schemaVersion: 2 } } as RuntimeVariantResultV1;
  expect(decodeRuntimeProductionWorld({ result: legacy })).toBe(legacy);
  expect(() => decodeRuntimeProductionWorld({ result: legacy, productionWorldStorage: 9 })).toThrow("version_invalid");
  expect(() => decodeRuntimeProductionWorld({ result: legacy, productionWorldStorage: 1 })).toThrow("capture_missing");
  const f = productionConsumedDecisionFixture();
  expect(() =>
    decodeRuntimeProductionWorld({ productionWorldStorage: 1, result: { ...legacy, productionCapture: f.capture } })
  ).toThrow("preset_missing");
});
