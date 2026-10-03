import type { LevelDefinition } from "@fuzzy-waddle/trump-defense-gameplay";
import levelOne from "../assets/trump-defense/levels/level-1.json";
import { getLevelGridPaths } from "./level-grid-paths";

describe("getLevelGridPaths", () => {
  it("marks the ground route visually while blocking ground and flying routes from construction", () => {
    const { groundPathTiles, blockedTiles } = getLevelGridPaths(levelOne as unknown as LevelDefinition);

    expect(groundPathTiles.has("0,64")).toBe(true);
    expect(groundPathTiles.has("24,64")).toBe(false);
    expect(blockedTiles.has("0,64")).toBe(true);
    expect(blockedTiles.has("24,64")).toBe(true);
  });
});
