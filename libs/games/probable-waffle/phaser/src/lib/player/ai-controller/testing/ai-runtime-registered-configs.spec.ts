import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { isAiRuntimeBrowserTestConfigV1 } from "./validate-ai-runtime-browser-test-config-v1";

/** Check the actual browser boundary, independently of the Node fixture factory's expected-shape comparison. */
it("admits every registered native world's complete opt-in config before launching a browser", () => {
  const directory = resolve(process.cwd(), "tools/ai/fixtures");
  const manifest = JSON.parse(readFileSync(resolve(directory, "skirmish-v1.json"), "utf8")) as {
    rows: { id: string; fixture?: string }[];
  };
  const rejected: string[] = [];
  const nonPreset: string[] = [];
  let checked = 0;
  for (const row of manifest.rows.filter((row) => row.fixture?.endsWith("-native-runtime.json"))) {
    if (!row.fixture) throw new Error("native_fixture_reference_missing");
    const fixture = JSON.parse(readFileSync(resolve(directory, row.fixture), "utf8")) as {
      recipe: { variants: { id: string; seed: number; captureConstruction?: true; captureCombat?: true; presetWorld?: object }[] };
    };
    for (const variant of fixture.recipe.variants) {
      if (!variant.presetWorld) {
        nonPreset.push(variant.id);
        continue;
      }
      checked++;
      const config = { schemaVersion: 1, enabled: true, startPaused: true, seed: variant.seed,
        presetWorld: { ...variant.presetWorld, provenance: { sourceRevision: "a".repeat(40), fixtureDigest: "fnv1a32:12345678" } },
        ...(variant.captureConstruction ? { captureProduction: true } : {}),
        ...(variant.captureCombat ? { captureCombat: true } : {}) };
      if (!isAiRuntimeBrowserTestConfigV1(config)) rejected.push(`${row.id}:${variant.id}`);
    }
  }
  expect({ count: rejected.length, first: rejected.slice(0, 40) }).toEqual({ count: 0, first: [] });
  expect(checked).toBe(580);
  expect(nonPreset.sort()).toEqual([
    "d-06-skaduwee-holdout", "d-06-skaduwee-long-soaks", "d-06-skaduwee-paired-calibration",
    "d-06-tivara-holdout", "d-06-tivara-long-soaks", "d-06-tivara-paired-calibration",
    "h-32-skaduwee-host-replacement", "h-32-tivara-host-replacement"
  ]);
});
