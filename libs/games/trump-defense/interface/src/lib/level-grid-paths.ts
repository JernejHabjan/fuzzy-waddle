import { tileKey, type LevelDefinition } from "@fuzzy-waddle/trump-defense-gameplay";

/** Separates visible ground markers from all route cells that gameplay forbids building on. */
export function getLevelGridPaths(level: LevelDefinition): {
  groundPathTiles: ReadonlySet<string>;
  blockedTiles: ReadonlySet<string>;
} {
  const groundPathTiles = new Set(level.paths.ground.map(tileKey));
  return {
    groundPathTiles,
    blockedTiles: new Set([...groundPathTiles, ...level.paths.flying.map(tileKey)])
  };
}
