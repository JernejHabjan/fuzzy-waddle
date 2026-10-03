import type { ActionResult, GameEntity, GameState } from "./game-state";
import { isTower, tileKey } from "./game-state";
import type { GridPoint, TowerKind } from "./level-definition";

const accepted = (message: string): ActionResult => ({ ok: true, message });
const rejected = (message: string): ActionResult => ({ ok: false, message });

/** Coordinates name tile origins, matching Grid.cpp rather than tile centers. */
export function selectTile(state: GameState, tile: GridPoint): ActionResult {
  if (state.status !== "playing") return rejected("The level is not active.");
  const { width, height, tileSize } = state.level.grid;
  if (
    tile[0] < 0 ||
    tile[0] >= width * tileSize ||
    tile[1] < 0 ||
    tile[1] >= height * tileSize ||
    tile[0] % tileSize ||
    tile[1] % tileSize ||
    state.blocked.has(tileKey(tile))
  ) {
    state.selectedTile = null;
    return rejected("Select a buildable tile.");
  }
  if (state.level.rules.randomTowerPlacement && !state.occupied.has(tileKey(tile))) {
    state.selectedTile = null;
    return rejected("Defenses are placed randomly on this battlefield.");
  }
  state.selectedTile = tile;
  state.sounds.push({ kind: "select", worldX: tile[0] });
  return accepted(`Tile ${tile[0] / tileSize + 1}, ${tile[1] / tileSize + 1} selected.`);
}

/** Returns whether random placement has any clear site, independently of selection. */
export function hasAvailableBuildSite(state: GameState): boolean {
  const { width, height, tileSize } = state.level.grid;
  for (let z = 0; z < height * tileSize; z += tileSize) {
    for (let x = 0; x < width * tileSize; x += tileSize) {
      const key = tileKey([x, z]);
      if (!state.blocked.has(key) && !state.occupied.has(key)) return true;
    }
  }
  return false;
}

function availableTile(state: GameState, random: () => number): GridPoint | null {
  const { width, height, tileSize } = state.level.grid;
  const candidates: GridPoint[] = [];
  for (let z = 0; z < height * tileSize; z += tileSize) {
    for (let x = 0; x < width * tileSize; x += tileSize) {
      const tile: GridPoint = [x, z];
      if (!state.blocked.has(tileKey(tile)) && !state.occupied.has(tileKey(tile))) candidates.push(tile);
    }
  }
  return candidates[Math.min(candidates.length - 1, Math.floor(random() * candidates.length))] ?? null;
}

export function buyTower(state: GameState, kind: TowerKind, random: () => number): ActionResult {
  if (state.status !== "playing") return rejected("The level is not active.");
  const definition = state.level.rules.towers[kind];
  if (!definition.enabled) return rejected(`${definition.label} is locked on this battlefield.`);
  if (state.money < definition.cost) return rejected(`Need $${definition.cost} for ${definition.label}.`);
  const tile = state.level.rules.randomTowerPlacement ? availableTile(state, random) : state.selectedTile;
  if (!tile)
    return rejected(
      state.level.rules.randomTowerPlacement ? "No free build sites remain." : "Select an available tile first."
    );
  if (state.blocked.has(tileKey(tile)) || state.occupied.has(tileKey(tile))) {
    return rejected("That tile is unavailable.");
  }
  const entity: GameEntity = {
    id: state.nextEntityId++,
    visual: definition.visual,
    position: { x: tile[0], y: 0, z: -tile[1] },
    orientation: { y: 0 },
    tower: { kind, tile },
    weapon: {
      range: definition.range,
      damage: definition.damage,
      canHitFlying: definition.canHitFlying,
      airBonusDamage: definition.airBonusDamage,
      cooldownMs: definition.cooldownMs,
      rotateToTarget: definition.rotateToTarget,
      fireSound: definition.fireSound,
      lastShotMs: -definition.cooldownMs,
      level: 1
    }
  };
  state.entities.set(entity.id, entity);
  state.occupied.add(tileKey(tile));
  state.money -= definition.cost;
  state.sounds.push({ kind: "buy", worldX: tile[0] });
  return accepted(`${definition.label} built.`);
}

export function upgradeTower(state: GameState): ActionResult {
  if (state.status !== "playing") return rejected("The level is not active.");
  const tower = [...state.entities.values()].find(
    (entity) =>
      isTower(entity) &&
      entity.tower &&
      state.selectedTile &&
      tileKey(entity.tower.tile) === tileKey(state.selectedTile)
  );
  if (!tower?.weapon || !tower.tower) return rejected("Select a tower to upgrade.");
  const definition = state.level.rules.towers[tower.tower.kind];
  // InputManager.cpp: "ZAENKAT SM DO LVL2" — only a second tower level exists.
  if (tower.weapon.level === 2) return rejected("This tower is already upgraded.");
  if (state.money < definition.upgradeCost) return rejected("Not enough money to upgrade.");
  tower.weapon.level = 2;
  tower.weapon.range += definition.upgradeRange;
  tower.weapon.damage += definition.upgradeDamage;
  tower.visual = definition.upgradedVisual;
  state.money -= definition.upgradeCost;
  state.sounds.push({ kind: "upgrade", worldX: tower.position.x });
  return accepted("Tower upgraded.");
}

export function buildWall(state: GameState): ActionResult {
  if (state.status !== "playing") return rejected("The level is not active.");
  // InputManager.cpp used absolute SDL ticks here; elapsed run time preserves the intended opening delay.
  if (state.elapsedMs < state.level.rules.wallStartDelayMs) return rejected("Construction has not started yet.");
  if (state.money < state.level.rules.wallCost) return rejected("Not enough money for the wall.");
  state.money -= state.level.rules.wallCost;
  state.wallHeight = Math.min(state.level.rules.wallGoal, state.wallHeight + state.level.rules.wallStep);
  state.sounds.push({ kind: "buildWall" });
  if (state.wallHeight >= state.level.rules.wallGoal) state.status = "won";
  return accepted(state.status === "won" ? "Wall complete!" : "Wall raised.");
}

export function togglePause(state: GameState): void {
  if (state.status === "playing") state.status = "paused";
  else if (state.status === "paused") state.status = "playing";
}
