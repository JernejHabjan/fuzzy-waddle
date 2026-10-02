/** Component phases separate level selection, scene loading, and active play transitions. */
export type TrumpDefensePhase = "selecting" | "loading" | "ready" | "playing" | "paused" | "won" | "lost" | "error";

/** Values shown by the HUD; action availability follows selected and owned entity components. */
export interface TrumpDefenseHud {
  money: number;
  lives: number;
  wall: number;
  goal: number;
  sniperCost: number;
  cannonCost: number;
  upgradeCost: number;
  wallCost: number;
  canPlaceSniper: boolean;
  canPlaceCannon: boolean;
  canUpgrade: boolean;
}
