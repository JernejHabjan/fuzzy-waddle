import type { ActorId, ObjectNames, PlayerNumber, ResearchType, Vector3Simple } from "@fuzzy-waddle/api-interfaces";
import type { OrderType } from "../../ai/order-type";

/**
 * A player-issued command to move a set of actors to a tile.
 * Used for rally-point moves and any move not routed through the action system.
 * The queue flag carries the shift-key state captured at dispatch time.
 */
export interface MoveCommand {
  readonly type: "MOVE";
  /**
   * Simulation tick on which this command should execute.
   * In single-player this equals the dispatch tick.
   * In multiplayer this is set to dispatchTick + INPUT_DELAY_TICKS so every
   * client executes the command in the same deterministic tick.
   */
  readonly tick: number;
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
  /**
   * Simulation tick on which this command should execute.
   * See MoveCommand.tick for details.
   */
  readonly tick: number;
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
  /** See MoveCommand.tick for details. */
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly actorIds: readonly ActorId[];
}

/**
 * Queues a production item in a specific production building.
 * The actorIds array intentionally targets a concrete building so every client
 * consumes the same queue slot instead of re-picking locally.
 */
export interface ProductionCommand {
  readonly type: "PRODUCTION";
  /** See MoveCommand.tick for details. */
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly actorIds: readonly ActorId[];
  readonly actorName: ObjectNames;
}

/**
 * Cancels a queued production item by deterministic queue index.
 */
export interface CancelProductionCommand {
  readonly type: "CANCEL_PRODUCTION";
  /** See MoveCommand.tick for details. */
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly actorIds: readonly ActorId[];
  readonly queueIndex: number;
}

/**
 * Starts a research item in a specific research-capable building.
 */
export interface ResearchCommand {
  readonly type: "RESEARCH";
  /** See MoveCommand.tick for details. */
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly actorIds: readonly ActorId[];
  readonly researchType: ResearchType;
}

/**
 * Cancels the active/queued research item in a specific building.
 */
export interface CancelResearchCommand {
  readonly type: "CANCEL_RESEARCH";
  /** See MoveCommand.tick for details. */
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly actorIds: readonly ActorId[];
}

export type GameCommand =
  | MoveCommand
  | ActorActionCommand
  | StopCommand
  | ProductionCommand
  | CancelProductionCommand
  | ResearchCommand
  | CancelResearchCommand;

/**
 * Command shape accepted by CommandBusService.dispatch().
 * The bus stamps the tick automatically; callers must not provide it.
 */
export type GameCommandInput =
  | Omit<MoveCommand, "tick">
  | Omit<ActorActionCommand, "tick">
  | Omit<StopCommand, "tick">
  | Omit<ProductionCommand, "tick">
  | Omit<CancelProductionCommand, "tick">
  | Omit<ResearchCommand, "tick">
  | Omit<CancelResearchCommand, "tick">;
