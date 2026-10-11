import { expect, test } from "@playwright/test";
import type { RuntimeFixtureV1 } from "./skirmish-ai-runtime-fixture";
import type { RuntimeVariantV1 } from "./skirmish-ai-runtime-variant";
import { prepareRuntimeVariant } from "./skirmish-ai-runtime-variant-setup";

const enabled = process.env.AI_SKIRMISH_MAP_PREFLIGHT === "1";
const mapLabel = "AI Open Economy (test only)";
const variant: RuntimeVariantV1 = {
  id: "open-economy-map-preflight",
  executionKind: "focused_natural",
  role: "standalone",
  setupRationale: "Probe the frozen map before scenario shards; this is not scenario coverage.",
  seed: 816001,
  aiFaction: "Tivara",
  humanFaction: "Skaduwee",
  difficulty: "Normal"
};
const fixture: RuntimeFixtureV1 = {
  schemaVersion: 1,
  evidenceKind: "runtime",
  scenarioIds: [],
  recipe: {
    mapLabel,
    aiPlayerNumber: 2,
    simulationTimeScale: 1,
    checkpointTicks: [],
    variants: [variant]
  },
  assertions: {}
};

test.skip(!enabled, "Run explicitly before the skirmish AI scenario matrix.");
test.setTimeout(150_000);

test("starts the frozen AI economy map with indexed resources and an open ground route", async ({ page }) => {
  const aiErrors: string[] = [];
  await prepareRuntimeVariant(page, fixture, variant, variant.seed, "0".repeat(40), "map-preflight", false, aiErrors);

  const result = await page.evaluate(async () => {
    type Tile = { x: number; y: number };
    type IndexedActor = { name: string };
    type ActorIndex = { getResourceSourcesFiltered(): IndexedActor[] };
    type Navigation = {
      isTileNavigable(tile: Tile): boolean;
      isTileGridWithoutBlockingObjectsNavigable(tile: Tile): boolean;
      findPathBetweenTiles(from: Tile, to: Tile): Promise<Tile[] | null>;
    };
    type MapScene = {
      scene: { key: string };
      getSceneGameData(): { services: unknown[] };
    };
    const host = (window as unknown as {
      __fuzzyWaddleAiRuntimeBrowserTestV1?: {
        game: { scene: { getScenes(active: boolean): MapScene[] } };
      };
    }).__fuzzyWaddleAiRuntimeBrowserTestV1;
    const scene = host?.game.scene.getScenes(true).find((candidate) => candidate.scene.key === "MapAiOpenEconomy");
    if (!scene) throw new Error("open_economy_scene_not_active");
    const services = scene.getSceneGameData().services;
    const index = services.find(
      (candidate): candidate is ActorIndex =>
        !!candidate && typeof (candidate as ActorIndex).getResourceSourcesFiltered === "function"
    );
    const navigation = services.find(
      (candidate): candidate is Navigation =>
        !!candidate && typeof (candidate as Navigation).findPathBetweenTiles === "function" &&
        typeof (candidate as Navigation).isTileGridWithoutBlockingObjectsNavigable === "function"
    );
    if (!index || !navigation) throw new Error("open_economy_services_missing");

    const sourceNames = index.getResourceSourcesFiltered().map((source) => source.name);
    const starts: Tile[] = [{ x: 10, y: 20 }, { x: 30, y: 10 }];
    const patches = starts.map((start) => {
      const found: Tile[] = [];
      for (let y = start.y - 7; y <= start.y + 7; y += 1) {
        for (let x = start.x - 7; x <= start.x + 7; x += 1) {
          if (found.length >= 4) break;
          const clear = [0, 1, 2].every((dy) =>
            [0, 1, 2].every((dx) => navigation.isTileNavigable({ x: x + dx, y: y + dy }))
          );
          if (clear && navigation.isTileGridWithoutBlockingObjectsNavigable({ x, y })) found.push({ x, y });
        }
      }
      return found;
    });
    const from = patches[0]?.[0];
    const to = patches[1]?.[0];
    const path = from && to ? await navigation.findPathBetweenTiles(from, to) : null;
    return {
      sceneKey: scene.scene.key,
      resourceCounts: {
        wood: sourceNames.filter((name) => name === "Tree6").length,
        stone: sourceNames.filter((name) => name === "StonePile").length,
        minerals: sourceNames.filter((name) => name === "Minerals").length
      },
      openPatches: patches.map((items) => items.length),
      groundPathLength: path?.length ?? 0
    };
  });

  expect(aiErrors).toEqual([]);
  expect(result.sceneKey).toBe("MapAiOpenEconomy");
  expect(result.resourceCounts).toEqual({ wood: 4, stone: 2, minerals: 2 });
  expect(result.openPatches).toEqual([4, 4]);
  expect(result.groundPathLength).toBeGreaterThan(0);
  console.log(`AI_SKIRMISH_MAP_PREFLIGHT_V1:${JSON.stringify(result)}`);
});
