import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Box3, BufferGeometry, Float32BufferAttribute, Group, Mesh, PerspectiveCamera, Vector3 } from "three";
import type { LevelDefinition, TowerKind, VisualAsset } from "@fuzzy-waddle/trump-defense-gameplay";
import levelOne from "../assets/trump-defense/levels/level-1.json";
import { ModelBank } from "./model-bank";
import { TutorialShowcase } from "./tutorial-showcase";

jest.mock("./model-bank", () => ({ ModelBank: jest.fn().mockImplementation(() => ({ create: jest.fn() })) }));

/** Uses shipped mesh vertices so this regression covers the actual base/upgrade size difference. */
function createModel(asset: VisualAsset): Group {
  const obj = readFileSync(join(__dirname, "../assets/trump-defense", asset.model), "utf8");
  const vertices = obj
    .split("\n")
    .filter((line) => line.startsWith("v "))
    .flatMap((line) => line.trim().split(/\s+/).slice(1, 4).map(Number));
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new Float32BufferAttribute(vertices, 3));
  const group = new Group();
  group.add(new Mesh(geometry));
  return group;
}

describe("TutorialShowcase", () => {
  it.each<TowerKind>(["Cannon", "SniperTower"])("preserves %s upgrade proportions instead of shrinking it", (kind) => {
    const level = levelOne as unknown as LevelDefinition;
    const bank = new ModelBank();
    jest.mocked(bank.create).mockImplementation(createModel);
    const showcase = new TutorialShowcase(bank, new PerspectiveCamera());
    const defense = level.rules.towers[kind];
    showcase.set(level, defense.visual);
    const basic = new Box3().setFromObject(showcase.root).getSize(new Vector3());
    showcase.set(level, defense.upgradedVisual);
    const upgraded = new Box3().setFromObject(showcase.root).getSize(new Vector3());
    expect(upgraded.x).toBeGreaterThanOrEqual(basic.x);
    expect(upgraded.y).toBeGreaterThan(basic.y);
    showcase.dispose();
  });
});
