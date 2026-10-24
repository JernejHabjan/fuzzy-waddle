import type Phaser from "phaser";
import type { AiRuntimePresetWorldV1 } from "./ai-runtime-preset-world-v1";
import { hasOnlyKeys, isRecord } from "./ai-runtime-fixture-values";
import { getGameObjectCurrentTile } from "../../../data/game-object-helper";
import { getTileCoordsUnderObject } from "../../../library/tile-under-object";

/** Native tile properties, applied before scene initialization/navigation builds; no synthetic planner topology. */
export function validAiRuntimeTerrainPatches(value: unknown): boolean {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 4096) return false;
  const seen = new Set<string>();
  return value.every((entry) => {
    if (!isRecord(entry) || !hasOnlyKeys(entry, ["x", "y", "terrain", "blocked"])) return false;
    const x = entry["x"], y = entry["y"];
    if (typeof x !== "number" || typeof y !== "number" || !Number.isSafeInteger(x) || !Number.isSafeInteger(y) ||
        x < 0 || y < 0 || x > 255 || y > 255 || typeof entry["terrain"] !== "string" ||
        !["grass", "water"].includes(entry["terrain"]) ||
        typeof entry["blocked"] !== "boolean" || seen.has(`${x},${y}`)) return false;
    seen.add(`${x},${y}`);
    return true;
  });
}

/** Validate every addressed real tile before mutation. Texture assets are unchanged; geometry is fixture-declared. */
export function applyAiRuntimeTerrainPatches(
  tilemap: Phaser.Tilemaps.Tilemap,
  preset: Pick<AiRuntimePresetWorldV1, "terrainPatches" | "terrainPreserveFootprints">,
  actors: readonly Phaser.GameObjects.GameObject[] = []
): void {
  if (preset.terrainPreserveFootprints && (!actors.length || actors.length > 256))
    throw new Error("runtime_preset_terrain_actor_inventory_missing_or_overflowed");
  const occupied = new Set(preset.terrainPreserveFootprints ? actors.flatMap((actor) => {
    const body = getGameObjectCurrentTile(actor);
    return [...getTileCoordsUnderObject(tilemap, actor), ...(body ? [body] : [])].map((tile) => `${tile.x},${tile.y}`);
  }) : []);
  const patches = (preset.terrainPatches ?? []).map((patch) => {
    const tile = tilemap.getTileAt(patch.x, patch.y, true, 0);
    if (!tile || tile.index < 0) throw new Error(`runtime_preset_terrain_tile_missing:${patch.x},${patch.y}`);
    return { patch, tile };
  });
  for (const { patch, tile } of patches) {
    if (occupied.has(`${patch.x},${patch.y}`)) continue;
    tile.properties = { ...tile.properties, terrainType: patch.terrain, navigationRestriction: patch.blocked };
  }
}
