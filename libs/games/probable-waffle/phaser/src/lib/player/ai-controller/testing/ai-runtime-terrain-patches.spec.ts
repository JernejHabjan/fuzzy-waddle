import type Phaser from "phaser";
import { applyAiRuntimeTerrainPatches, validAiRuntimeTerrainPatches } from "./ai-runtime-terrain-patches";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";

describe("native preset terrain", () => {
  it("rejects duplicates, invented fields, unbounded coordinates and coerced values", () => {
    const patch = { x: 24, y: 8, terrain: "water", blocked: false };
    expect(validAiRuntimeTerrainPatches([patch])).toBe(true);
    for (const value of [[patch, patch], [{ ...patch, x: -1 }], [{ ...patch, terrain: "imaginary_cliff" }],
      [{ ...patch, blocked: "false" }], [{ ...patch, terrain: ["water"] }],
      [{ ...patch, hiddenEnemyId: "secret" }], Array(4097).fill(patch)])
      expect(validAiRuntimeTerrainPatches(value)).toBe(false);
  });

  it("resolves all actual tiles before mutation and preserves unrelated native properties", () => {
    const first = { index: 11, properties: { color: "grass", terrainType: "grass" } };
    const getTileAt = jest.fn((x: number) => x === 1 ? first : null);
    const tilemap = { getTileAt } as unknown as Phaser.Tilemaps.Tilemap;
    const patches = [{ x: 1, y: 2, terrain: "water" as const, blocked: false },
      { x: 3, y: 2, terrain: "grass" as const, blocked: true }];
    const preset = { terrainPatches: patches } satisfies Pick<AiRuntimePresetWorldV1, "terrainPatches">;
    expect(() => applyAiRuntimeTerrainPatches(tilemap, preset)).toThrow("runtime_preset_terrain_tile_missing");
    expect(first.properties.terrainType).toBe("grass");
    applyAiRuntimeTerrainPatches(tilemap, { ...preset, terrainPatches: patches.slice(0, 1) });
    expect(first.properties).toEqual({ color: "grass", terrainType: "water", navigationRestriction: false });
  });
});
