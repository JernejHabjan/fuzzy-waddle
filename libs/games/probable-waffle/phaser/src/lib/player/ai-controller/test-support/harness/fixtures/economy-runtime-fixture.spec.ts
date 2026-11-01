import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { AiRuntimePresetWorld } from "../../presets/setup/ai-runtime-preset-world";
import { isAiRuntimeBrowserTestConfig } from "../../browser/validate-ai-runtime-browser-test-config";
import { validAiRuntimeSourceStocks } from "../../economy/setup/ai-runtime-source-stocks";

for (const name of ["native/economy/economy-delivery-native-gameplay", "native/economy/resource-recovery-native-gameplay"]) {
  const fixture: {
    recipe: { variants: { id: string; seed: number; presetWorld: Omit<AiRuntimePresetWorld, "provenance"> }[] };
  } = JSON.parse(readFileSync(resolve(process.cwd(), `tools/probable-waffle/skirmish/ai/testing/fixtures/${name}.json`), "utf8"));
  describe(`${name} native setup`, () => {
    it.each(fixture.recipe.variants)("admits $id through the actual browser gate", (variant) => {
      expect(
        isAiRuntimeBrowserTestConfig({
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
    });
  });
}

describe("nearly depleted source setup bounds", () => {
  it("rejects unknown, duplicate, negative, fractional and excess stocks", () => {
    const ids = new Set(["source"]);
    expect(validAiRuntimeSourceStocks([{ fixtureActorId: "source", amount: 3 }], ids)).toBe(true);
    for (const value of [
      [{ fixtureActorId: "missing", amount: 3 }],
      [{ fixtureActorId: "source", amount: -1 }],
      [{ fixtureActorId: "source", amount: 0.5 }],
      [{ fixtureActorId: "source", amount: 100001 }],
      [
        { fixtureActorId: "source", amount: 3 },
        { fixtureActorId: "source", amount: 3 }
      ]
    ]) {
      expect(validAiRuntimeSourceStocks(value, ids)).toBe(false);
    }
  });
});
