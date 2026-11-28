import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isAiRuntimeBrowserTestConfig } from "../../../browser/validate-ai-runtime-browser-test-config";

/** Check checked-in native configs at the browser boundary; generated markers are expanded by the native registration tests. */
it("admits every checked-in native world's complete opt-in config before launching a browser", () => {
  const directory = resolve(process.cwd(), "tools/probable-waffle/skirmish/ai/testing/fixtures");
  const manifest = JSON.parse(readFileSync(resolve(directory, "skirmish-scenario-manifest.json"), "utf8")) as {
    rows: { id: string; fixture?: string }[];
  };
  const rejected: string[] = [];
  const nonPreset: string[] = [];
  let checked = 0;
  for (const row of manifest.rows.filter(
    (row) => row.fixture?.startsWith("native/") && /\/[a-z]+-\d{2}-/.test(row.fixture)
  )) {
    if (!row.fixture) throw new Error("native_fixture_reference_missing");
    const fixture = JSON.parse(readFileSync(resolve(directory, row.fixture), "utf8")) as {
      generatedScenarioId?: string;
      recipe?: {
        variants: {
          id: string;
          seed: number;
          captureConstruction?: true;
          captureCombat?: true;
          presetWorld?: object;
        }[];
      };
    };
    if (fixture.generatedScenarioId) continue;
    if (!fixture.recipe) throw new Error(`native_fixture_recipe_missing:${row.fixture}`);
    for (const variant of fixture.recipe.variants) {
      if (!variant.presetWorld) {
        nonPreset.push(variant.id);
        continue;
      }
      checked++;
      const config = {
        schemaVersion: 1,
        enabled: true,
        startPaused: true,
        seed: variant.seed,
        presetWorld: {
          ...variant.presetWorld,
          provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678" }
        },
        ...(variant.captureConstruction ? { captureProduction: true } : {}),
        ...(variant.captureCombat ? { captureCombat: true } : {})
      };
      if (!isAiRuntimeBrowserTestConfig(config)) rejected.push(`${row.id}:${variant.id}`);
    }
  }
  expect({ count: rejected.length, first: rejected.slice(0, 40) }).toEqual({ count: 0, first: [] });
  expect(checked).toBe(338);
  expect(nonPreset.sort()).toEqual(["h-32-skaduwee-host-replacement", "h-32-tivara-host-replacement"]);
});
