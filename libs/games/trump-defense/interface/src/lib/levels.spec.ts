import Ajv from "ajv";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { LevelDefinition, VisualAsset } from "@fuzzy-waddle/trump-defense-gameplay";

const root = join(__dirname, "../assets/trump-defense");
const schema = JSON.parse(readFileSync(join(__dirname, "level.schema.json"), "utf8"));
const validate = new Ajv({ allErrors: true }).compile(schema);
const readLevel = (id: number): LevelDefinition =>
  JSON.parse(readFileSync(join(root, `levels/level-${id}.json`), "utf8")) as LevelDefinition;

function assets(level: LevelDefinition): string[] {
  const visuals: VisualAsset[] = [
    level.scene.terrain,
    level.scene.pathTile,
    level.scene.buildableTile,
    level.scene.wall,
    ...level.scene.props,
    ...Object.values(level.scene.visuals)
  ];
  return [
    level.music,
    ...level.scene.skybox,
    ...visuals.flatMap(({ model, texture, specular }) => [model, texture, ...(specular ? [specular] : [])])
  ];
}

describe("TD2016 shipped levels", () => {
  test.each([1, 2, 3])("level %i is complete and references real assets", (id) => {
    const level = readLevel(id);
    expect(validate(level)).toBe(true);
    expect(validate.errors).toBeNull();
    expect(level.id).toBe(id);
    expect(level.grid).toEqual({ width: 16, height: 12, tileSize: 8 });
    expect(level.paths.ground).toHaveLength(39);
    expect(level.paths.flying).toHaveLength(16);
    expect(level.paths.ground[0]).toEqual([0, 64]);
    expect(level.paths.ground.at(-1)).toEqual([120, 64]);
    expect(level.scene.points).toHaveLength(id === 2 ? 8 : 0);
    expect(level.scene.spots).toHaveLength(id === 2 ? 2 : 0);
    expect(level.scene.skybox[4]).toMatch(/front\.jpg$/);
    expect(level.scene.skybox[5]).toMatch(/back\.jpg$/);
    expect(level.rules.towers.SniperTower.rotateToTarget).toBe(false);
    expect(level.rules.towers.Cannon.rotateToTarget).toBe(true);
    expect(level.scene.props.some((prop) => prop.model === "models/WhiteHouse.obj")).toBe(true);
    expect(level.scene.visuals.Heart.model).toBe("models/Heart.obj");
    for (const path of [...assets(level), ...level.scene.skybox]) {
      expect(path).not.toContain("..");
      expect(existsSync(join(root, path))).toBe(true);
    }
    for (const route of Object.values(level.paths)) {
      for (const [index, point] of route.entries()) {
        const [x, z] = point;
        expect(x % level.grid.tileSize).toBe(0);
        expect(z % level.grid.tileSize).toBe(0);
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThan(level.grid.width * level.grid.tileSize);
        expect(z).toBeGreaterThanOrEqual(0);
        expect(z).toBeLessThan(level.grid.height * level.grid.tileSize);
        const previous = route[index - 1];
        if (previous) expect(Math.abs(x - previous[0]) + Math.abs(z - previous[1])).toBeLessThanOrEqual(8);
      }
    }
    for (const kind of level.rules.enemyRoster) {
      expect(level.rules.enemies[kind]).toBeDefined();
      expect(level.scene.visuals[kind]).toBeDefined();
    }
  });

  it("keeps historical differences and independently editable scenes", () => {
    const [day, night, final] = [readLevel(1), readLevel(2), readLevel(3)];
    expect(night.scene.skybox).not.toEqual(day.scene.skybox);
    expect(final.scene.skybox).toEqual(day.scene.skybox);
    expect(day.rules.enemyRoster).toEqual(["MexicanBanjo"]);
    expect(day.rules.enemyHp).toBe(90);
    expect(day.rules.enemyHpIncrease).toBe(15);
    expect(night.rules.enemyRoster).toEqual(["MexicanBanjo", "Builder", "MexicanBalooner"]);
    expect(final.rules.enemyRoster).toHaveLength(5);
    expect(final.rules.randomTowerPlacement).toBe(true);
    night.scene.terrain.model = "models/another-map.obj";
    expect(day.scene.terrain.model).toBe("models/Map.obj");
    expect(final.scene.terrain.model).toBe("models/Map.obj");
  });
});
