import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  Box3,
  BufferGeometry,
  Float32BufferAttribute,
  Group,
  Mesh,
  PerspectiveCamera,
  SpotLight,
  Vector3
} from "three";
import type { LevelDefinition, TowerKind, VisualAsset } from "@fuzzy-waddle/trump-defense-gameplay";
import levelOne from "../assets/trump-defense/levels/level-1.json";
import levelTwo from "../assets/trump-defense/levels/level-2.json";
import levelThree from "../assets/trump-defense/levels/level-3.json";
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
  it("aims a warm overhead spotlight at each night-briefing object and releases it on exit", () => {
    const bank = new ModelBank();
    jest.mocked(bank.create).mockImplementation(createModel);
    const showcase = new TutorialShowcase(bank, new PerspectiveCamera());
    const level = levelTwo as unknown as LevelDefinition;
    showcase.set(level, ["Cannon", "SniperTower"]);
    const lights = showcase.root.children.filter((child): child is SpotLight => child instanceof SpotLight);
    expect(lights).toHaveLength(2);
    for (const light of lights) {
      expect(light.target.parent).toBe(showcase.root);
      expect(light.position.y).toBeGreaterThan(light.target.position.y);
      expect(light.position.x).toBe(light.target.position.x);
      expect(light.intensity).toBeGreaterThan(0);
    }
    const firstLight = lights[0];
    if (!firstLight) throw new Error("Night showcase spotlight missing");
    const dispose = jest.spyOn(firstLight, "dispose");
    showcase.set(level, "SniperTower2");
    expect(dispose).toHaveBeenCalledTimes(1);
    expect(showcase.root.children.filter((child) => child instanceof SpotLight)).toHaveLength(1);
    const finalLight = showcase.root.children.find((child): child is SpotLight => child instanceof SpotLight);
    if (!finalLight) throw new Error("Night showcase spotlight missing");
    const disposeFinal = jest.spyOn(finalLight, "dispose");
    showcase.set(level, null);
    expect(disposeFinal).toHaveBeenCalledTimes(1);
    expect(showcase.root.children).toHaveLength(0);
    expect(showcase.root.visible).toBe(false);
  });

  it.each([levelOne, levelThree])("leaves daytime level $id showcases without spotlights", (data) => {
    const bank = new ModelBank();
    jest.mocked(bank.create).mockImplementation(createModel);
    const showcase = new TutorialShowcase(bank, new PerspectiveCamera());
    showcase.set(data as unknown as LevelDefinition, "Cannon");
    expect(showcase.root.children.some((child) => child instanceof SpotLight)).toBe(false);
    showcase.dispose();
  });
});
