import type { LevelDefinition } from "@fuzzy-waddle/trump-defense-gameplay";
import levelOne from "../assets/trump-defense/levels/level-1.json";
import { getLevelGridPaths } from "./level-grid-paths";

describe("getLevelGridPaths", () => {
  it("keeps the ground and aerial routes separate for display and placement", () => {
    const { groundPathTiles, flyingPathTiles } = getLevelGridPaths(levelOne as unknown as LevelDefinition);

    expect(groundPathTiles.has("0,64")).toBe(true);
    expect(groundPathTiles.has("24,64")).toBe(false);
    expect(flyingPathTiles.has("0,64")).toBe(true);
    expect(flyingPathTiles.has("24,64")).toBe(true);
  });
});
