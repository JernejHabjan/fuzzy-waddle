import type { TrumpDefenseHud } from "./trump-defense-ui-state";

/** Campaign picker labels follow the level order used by the unlock store. */
export const levelChoices = [
  { number: 1, label: "Red, White & Boom" },
  { number: 2, label: "Stars After Dark" },
  { number: 3, label: "Liberty's Last Stand" }
] as const;

/** Empty HUD state keeps the overlay safe before the first level finishes loading. */
export const emptyHud: TrumpDefenseHud = {
  money: 0,
  lives: 0,
  wall: 0,
  goal: 0,
  sniperCost: 0,
  cannonCost: 0,
  upgradeCost: 0,
  wallCost: 0,
  canPlaceSniper: false,
  canPlaceCannon: false,
  canUpgrade: false
};
