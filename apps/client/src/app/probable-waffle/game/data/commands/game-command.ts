import type { ActorId, PlayerNumber, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import type { OrderType } from "../../ai/order-type";

/**
 * A player-issued command to move a set of actors to a tile.
 * Used for rally-point moves and any move not routed through the action system.
 * The queue flag carries the shift-key state captured at dispatch time.
 */
export interface MoveCommand {
  readonly type: "MOVE";
  readonly playerNumber: PlayerNumber;
  /** IDs of actors that should execute this move */
  readonly actorIds: readonly ActorId[];
  readonly tileVec3: Vector3Simple;
  readonly worldVec3: Vector3Simple;
  /** true = shift-queue on top of existing orders; false = override */
  readonly queue: boolean;
}

/**
 * A player-issued command targeting one or more actors with an explicit or inferred order.
 * Covers attack, gather, build, heal, repair, enter-container, and right-click-on-tile move orders.
 * The queue flag carries the shift-key state captured at dispatch time.
 */
export interface ActorActionCommand {
  readonly type: "ACTOR_ACTION";
  readonly playerNumber: PlayerNumber;
  /** IDs of actors that should execute this order */
  readonly actorIds: readonly ActorId[];
  /** Explicit order type, or undefined to let ActionSystem infer from context */
  readonly orderType?: OrderType;
  /** IDs of target game objects (e.g. enemy to attack, resource to gather) */
  readonly targetObjectIds?: readonly ActorId[];
  readonly tileVec3?: Vector3Simple;
  /** true = shift-queue on top of existing orders; false = override */
  readonly queue: boolean;
}

/**
 * Immediately cancels all pending and active orders for the listed actors.
 */
export interface StopCommand {
  readonly type: "STOP";
  readonly playerNumber: PlayerNumber;
  readonly actorIds: readonly ActorId[];
}

export type GameCommand = MoveCommand | ActorActionCommand | StopCommand;
