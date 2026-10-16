import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { isAiRuntimeBrowserTestConfigV1 } from "./validate-ai-runtime-browser-test-config-v1";

describe("supply-loss native fixture inputs", () => {
  const fixture: {
    recipe: { variants: { id: string; seed: number; presetWorld: Omit<AiRuntimePresetWorldV1, "provenance"> }[] };
  } = JSON.parse(readFileSync(resolve(process.cwd(), "tools/ai/fixtures/supply-loss-runtime.json"), "utf8"));
  it.each(fixture.recipe.variants)("admits $id through the real browser configuration gate", (variant) => {
    const config = {
      schemaVersion: 1,
      enabled: true,
      seed: variant.seed,
      startPaused: true,
      captureProduction: true,
      presetWorld: {
        ...variant.presetWorld,
        provenance: {
          sourceRevision: "a".repeat(40),
          fixtureDigest: "fnv1a32:12345678"
        }
      }
    };
    expect(isAiRuntimeBrowserTestConfigV1(config)).toBe(true);
    expect(
      isAiRuntimeBrowserTestConfigV1({
        ...config,
        presetWorld: { ...config.presetWorld, resourceGrants: [{ playerNumber: 2, amounts: { food: 1000, wood: 0 } }] }
      })
    ).toBe(false);
  });
});
