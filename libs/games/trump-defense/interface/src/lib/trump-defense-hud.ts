import { isTower, tileKey, type GameState } from "@fuzzy-waddle/trump-defense-gameplay";
import type { TrumpDefenseHud } from "./trump-defense-ui-state";

/**
 * Projects simulation resources and component-owned action availability into the HUD.
 * Towers are player-placed entities in this single-player simulation; enemies have no weapon/tower pair.
 */
export function deriveHud(state: GameState): TrumpDefenseHud {
  const { money, lives, wallHeight, selectedTile, level } = state;
  const selectedKey = selectedTile ? tileKey(selectedTile) : null;
  const selectedTower = selectedKey
    ? [...state.entities.values()].find(
        (entity) => isTower(entity) && entity.tower && tileKey(entity.tower.tile) === selectedKey
      )
    : undefined;
  const buildable = !!selectedKey && !state.occupied.has(selectedKey);
  const sniper = level.rules.towers.SniperTower;
  const cannon = level.rules.towers.Cannon;
  const selectedUpgradeCost = selectedTower?.tower
    ? level.rules.towers[selectedTower.tower.kind].upgradeCost
    : level.rules.towers.SniperTower.upgradeCost;

  return {
    money,
    lives,
    wall: wallHeight,
    goal: level.rules.wallGoal,
    sniperCost: sniper.cost,
    cannonCost: cannon.cost,
    upgradeCost: selectedUpgradeCost,
    wallCost: level.rules.wallCost,
    canPlaceSniper: buildable && money >= sniper.cost,
    canPlaceCannon: buildable && money >= cannon.cost,
    canUpgrade:
      !!selectedTower?.weapon &&
      !!selectedTower.tower &&
      selectedTower.weapon.level === 1 &&
      money >= selectedUpgradeCost
  } satisfies TrumpDefenseHud;
}
