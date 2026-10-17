import type Phaser from "phaser";
import type { OrderData } from "../../ai/OrderData";
import type { PawnAiBlackboard } from "./pawn-ai-blackboard";

/** Transient use-site identity. Native result amount is not credited income, cargo provenance or task fulfillment. */
export interface PawnResourceServiceEvent {
  readonly execution: object;
  readonly actor: Phaser.GameObjects.GameObject;
  readonly board: PawnAiBlackboard;
  /** The order retained by the action, even when a different order becomes current during its await. */
  readonly order: OrderData;
  readonly target: Phaser.GameObjects.GameObject;
  readonly operation: "gather" | "drop_off";
  readonly phase: "started" | "resolved" | "rejected" | "threw";
  /** Exact native resolved amount, including zero; all other phases carry null. No resource type/owner is inferred. */
  readonly amount: number | null;
}
