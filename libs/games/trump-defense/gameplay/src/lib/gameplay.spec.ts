import { makeLevel } from "../test/gameplay.fixture";
import { createGame } from "./create-game";
import { buildWall, buyTower, hasAvailableBuildSite, selectTile, togglePause, upgradeTower } from "./game-actions";
import { stepGame } from "./step-game";

const first = makeLevel(1);
const second = makeLevel(2);
const third = makeLevel(3);

describe("Trump Defense gameplay", () => {
  it("starts every level with fresh resources and the authored roster", () => {
    for (const level of [first, second, third]) {
      const state = createGame(level);
      expect(state.money).toBe(200);
      expect(state.lives).toBe(10);
      expect(state.wallHeight).toBe(0);
      expect(state.level.rules.enemyRoster).toHaveLength(level.id === 1 ? 1 : level.id === 2 ? 3 : 5);
    }
  });

  it("builds only on a clear selected tile and upgrades from tower data", () => {
    const state = createGame(second);
    expect(selectTile(state, [0, 64]).ok).toBe(false);
    expect(selectTile(state, [8, 8]).ok).toBe(true);
    expect(buyTower(state, "SniperTower", () => 0).ok).toBe(true);
    expect(state.money).toBe(180);
    expect(buyTower(state, "Cannon", () => 0).ok).toBe(false);
    expect(upgradeTower(state).ok).toBe(true);
    const tower = [...state.entities.values()][0];
    expect(tower?.visual).toBe("SniperTower2");
    expect(tower?.weapon?.range).toBe(40);
    expect(tower?.weapon?.damage).toBe(30);
  });

  it("reads movement and reward from enemy components instead of names", () => {
    const custom = structuredClone(second);
    custom.rules.enemyRoster = ["Builder"];
    custom.rules.enemies.Builder.path = "flying";
    custom.rules.enemies.Builder.altitude = 14;
    custom.rules.enemies.Builder.reward = 37;
    const state = createGame(custom);
    for (let i = 0; i < 50; i++) stepGame(state, 100);
    const enemy = [...state.entities.values()][0];
    expect(enemy?.path?.kind).toBe("flying");
    expect(enemy?.position.y).toBe(14);
    expect(enemy?.health?.reward).toBe(37);
  });

  it("targets a flying enemy only when the weapon component permits it", () => {
    const custom = structuredClone(first);
    custom.rules.enemyRoster = ["Builder"];
    custom.rules.enemies.Builder = { path: "flying", altitude: 14, reward: 37 };
    custom.rules.enemyHp = 15;
    custom.rules.spawnDelayMs = 100;
    custom.rules.spawnIntervalMs = 1000;
    custom.rules.moveIntervalMs = 100;
    const state = createGame(custom);
    selectTile(state, [8, 56]);
    expect(buyTower(state, "Cannon", () => 0).ok).toBe(true);
    stepGame(state, 100);
    const enemy = [...state.entities.values()].find((entity) => entity.health);
    expect(enemy?.health?.current).toBe(15);
    const cannon = [...state.entities.values()].find((entity) => entity.weapon);
    if (!cannon?.weapon) throw new Error("The test cannon is missing its weapon component.");
    cannon.weapon.canHitFlying = true;
    stepGame(state, 100);
    expect(state.entities.has(enemy?.id ?? -1)).toBe(false);
    expect(state.money).toBe(207);
    expect(state.shotEffects).toHaveLength(1);
    expect(state.sounds.map(({ kind }) => kind)).toEqual(["cannon", "die", "cash"]);
  });

  it.each(["ground", "flying"] as const)("sniper towers damage %s enemies from cannon-side build sites", (pathKind) => {
    const custom = structuredClone(second);
    custom.rules.enemyRoster = ["MexicanBalooner"];
    custom.rules.enemies.MexicanBalooner.path = pathKind;
    custom.rules.spawnDelayMs = 100;
    custom.rules.spawnIntervalMs = 1000;
    custom.rules.enemyHp = 70;
    const state = createGame(custom);
    selectTile(state, [8, 56]);
    expect(buyTower(state, "SniperTower", () => 0).ok).toBe(true);

    stepGame(state, 100);

    const enemy = [...state.entities.values()].find((entity) => entity.path);
    expect(enemy?.health?.current).toBe(pathKind === "flying" ? 50 : 60);
    expect(state.shotEffects).toHaveLength(1);
  });

  it("only rotates data-configured towers and retains projectile state for a visible flight", () => {
    const custom = structuredClone(first);
    custom.rules.enemyHp = 1000;
    custom.rules.spawnDelayMs = 100;
    custom.rules.spawnIntervalMs = 100;
    custom.rules.moveIntervalMs = 500;
    const state = createGame(custom);
    selectTile(state, [0, 56]);
    expect(buyTower(state, "Cannon", () => 0).ok).toBe(true);
    stepGame(state, 100);
    const cannon = [...state.entities.values()].find((entity) => entity.weapon);
    expect(cannon?.orientation?.y).toBeCloseTo((3 * Math.PI) / 2);
    expect(state.shotEffects[0]).toMatchObject({ elapsedMs: 0, durationMs: 450 });
    stepGame(state, 100);
    expect(state.shotEffects[0]?.elapsedMs).toBe(100);
  });

  it("keeps a non-tracking tower's orientation unchanged while it fires", () => {
    const custom = structuredClone(second);
    custom.rules.enemyHp = 1000;
    custom.rules.spawnDelayMs = 100;
    custom.rules.spawnIntervalMs = 100;
    custom.rules.moveIntervalMs = 500;
    const state = createGame(custom);
    selectTile(state, [0, 56]);
    expect(buyTower(state, "SniperTower", () => 0).ok).toBe(true);
    stepGame(state, 100);
    const sniper = [...state.entities.values()].find((entity) => entity.weapon);
    expect(sniper?.orientation).toEqual({ y: 0 });
  });

  it("pauses timers and reaches victory after seven wall purchases", () => {
    const state = createGame(first);
    togglePause(state);
    stepGame(state, 5000);
    expect(state.elapsedMs).toBe(0);
    togglePause(state);
    for (let i = 0; i < 30; i++) stepGame(state, 100);
    state.money = 700;
    for (let i = 0; i < 7; i++) expect(buildWall(state).ok).toBe(true);
    expect(state.wallHeight).toBe(35);
    expect(state.status).toBe("won");
    expect(buildWall(state).ok).toBe(false);
  });

  it("enforces the level-authored sniper lock without spending money", () => {
    const state = createGame(first);
    selectTile(state, [8, 8]);
    expect(buyTower(state, "SniperTower", () => 0).ok).toBe(false);
    expect(state.money).toBe(200);
    expect(state.entities.size).toBe(0);
    expect(buyTower(state, "Cannon", () => 0).ok).toBe(true);
  });

  it("uses level three's random placement rule", () => {
    const state = createGame(third);
    expect(selectTile(state, [8, 8]).ok).toBe(false);
    expect(state.selectedTile).toBeNull();
    expect(buyTower(state, "Cannon", () => 0).ok).toBe(true);
    const tile = [...state.entities.values()][0]?.tower?.tile;
    expect(tile).toBeDefined();
    if (!tile) throw new Error("The random tower has no site.");
    expect(selectTile(state, tile).ok).toBe(true);
    expect(upgradeTower(state).ok).toBe(true);
  });

  it("disables random placement when every site is occupied", () => {
    const state = createGame(third);
    for (let x = 0; x < 128; x += 8) {
      for (let z = 0; z < 96; z += 8) state.occupied.add(`${x},${z}`);
    }
    expect(hasAvailableBuildSite(state)).toBe(false);
    expect(buyTower(state, "Cannon", () => 0)).toEqual({ ok: false, message: "No free build sites remain." });
    expect(state.money).toBe(200);
  });

  it("lets unopposed enemies reduce lives and end a run", () => {
    const state = createGame(first);
    for (let i = 0; i < 1200 && state.status === "playing"; i++) stepGame(state, 100);
    expect(state.status).toBe("lost");
    expect(state.lives).toBeLessThanOrEqual(0);
    expect(state.sounds.some(({ kind }) => kind === "lifeLost")).toBe(true);
  });
});
