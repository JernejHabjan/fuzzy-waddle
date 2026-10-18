import { tileKey, type LevelDefinition } from "@fuzzy-waddle/trump-defense-gameplay";

/** Keeps the visible ground route distinct from the elevated flight route. */
export function getLevelGridPaths(level: LevelDefinition): {
  groundPathTiles: ReadonlySet<string>;
  flyingPathTiles: ReadonlySet<string>;
} {
  return {
    groundPathTiles: new Set(level.paths.ground.map(tileKey)),
    flyingPathTiles: new Set(level.paths.flying.map(tileKey))
  };
}
