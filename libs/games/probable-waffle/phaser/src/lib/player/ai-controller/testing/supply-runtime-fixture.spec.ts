import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AiRuntimePresetWorld } from "./ai-runtime-preset-world";
import { isAiRuntimeBrowserTestConfig } from "./validate-ai-runtime-browser-test-config";

describe("supply-loss native fixture inputs", () => {
  const fixture: {
    recipe: { variants: { id: string; seed: number; presetWorld: Omit<AiRuntimePresetWorld, "provenance"> }[] };
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
    expect(isAiRuntimeBrowserTestConfig(config)).toBe(true);
    expect(
      isAiRuntimeBrowserTestConfig({
        ...config,
        presetWorld: { ...config.presetWorld, resourceGrants: [{ playerNumber: 2, amounts: { food: 1000, wood: 0 } }] }
      })
    ).toBe(false);
  });
});
