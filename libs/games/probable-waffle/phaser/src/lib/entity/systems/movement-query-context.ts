import type Phaser from "phaser";
import type { OrderData } from "../../ai/OrderData";
import type { PawnAiBlackboard } from "../../prefabs/ai-agents/pawn-ai-blackboard";

/** Transient native caller identity, explicitly carried across awaits; never saved or consumed by planning. */
export interface MovementQueryContext {
  readonly actor: Phaser.GameObjects.GameObject;
  readonly board: PawnAiBlackboard;
  readonly order: OrderData | null;
  readonly caller: "range_probe" | "reachability_probe" | "actor_movement" | "location_movement" |
    "tending_movement" | "boarding_adjacent" | "boarding_ground_shore" | "boarding_container_shore";
}
