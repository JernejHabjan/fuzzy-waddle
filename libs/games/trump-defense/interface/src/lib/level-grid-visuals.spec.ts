import { Group } from "three";
import type { LevelDefinition, VisualAsset } from "@fuzzy-waddle/trump-defense-gameplay";
import levelOne from "../assets/trump-defense/levels/level-1.json";
import { ModelBank } from "./model-bank";
import { LevelGridVisuals } from "./level-grid-visuals";

describe("LevelGridVisuals", () => {
  it("shows tower sites on the flying path but keeps the ground route clear", () => {
    const root = new Group();
    const models = {
      create: jest.fn((asset: VisualAsset) => {
        const model = new Group();
        model.name = asset.model;
        return model;
      })
    } as unknown as ModelBank;
    const visuals = new LevelGridVisuals(root, models);

    visuals.load(levelOne as unknown as LevelDefinition);

    expect(
      root.children.some(
        (child) => child.name === "models/BuildTile.obj" && child.position.x === 24 && child.position.z === -64
      )
    ).toBe(true);
    expect(
      root.children.some(
        (child) => child.name === "models/BuildTile.obj" && child.position.x === 0 && child.position.z === -64
      )
    ).toBe(false);
    visuals.dispose();
  });
});
