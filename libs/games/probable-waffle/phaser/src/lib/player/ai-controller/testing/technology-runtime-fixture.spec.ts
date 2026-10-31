import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isAiRuntimeBrowserTestConfigV1 } from "./validate-ai-runtime-browser-test-config-v1";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";

describe("technology native fixture inputs", () => {
  const fixture: {
    recipe: {
      variants: {
        id: string;
        seed: number;
        scenarioIds: string[];
        presetWorld: Omit<AiRuntimePresetWorldV1, "provenance">;
      }[];
    };
    assertions: Record<string, { requiredTechnologyContracts: Record<string, unknown> }>;
  } = JSON.parse(readFileSync(resolve(process.cwd(), "tools/ai/fixtures/technology-runtime.json"), "utf8"));
  it.each(fixture.recipe.variants)("validates $id through the actual browser configuration gate", (variant) => {
    expect(
      isAiRuntimeBrowserTestConfigV1({
        schemaVersion: 1,
        enabled: true,
        seed: variant.seed,
        startPaused: true,
        captureProduction: true,
        presetWorld: {
          ...variant.presetWorld,
          provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678" }
        }
      })
    ).toBe(true);
    for (const scenarioId of variant.scenarioIds) {
      expect(fixture.assertions[scenarioId]?.requiredTechnologyContracts[variant.id]).toBeDefined();
    }
  });
});
