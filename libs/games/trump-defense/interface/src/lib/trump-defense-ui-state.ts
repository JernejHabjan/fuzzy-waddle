/** Component phases separate level selection, scene loading, and active play transitions. */
export type TrumpDefensePhase = "selecting" | "loading" | "ready" | "playing" | "paused" | "won" | "lost" | "error";

/** Values shown in the HTML HUD; simulation rules remain owned by gameplay. */
export interface TrumpDefenseHud {
  money: number;
  lives: number;
  wall: number;
  goal: number;
  selected: string;
  sniperCost: number;
  cannonCost: number;
  upgradeCost: number;
  wallCost: number;
}
