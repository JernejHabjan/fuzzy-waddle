import type { Vector3Simple } from "../../game/vector";
import type { OrderType } from "../../probable-waffle/order-type";
import type { ActorId, PlayerNumber } from "../player/player";
import type { ObjectNames } from "./object-names";
import type { ResearchType } from "./research-type";

export const ProbableWaffleGameCommandTypes = {
  Move: "MOVE",
  ActorAction: "ACTOR_ACTION",
  Stop: "STOP",
  Production: "PRODUCTION",
  CancelProduction: "CANCEL_PRODUCTION",
  Research: "RESEARCH",
  CancelResearch: "CANCEL_RESEARCH"
} as const;

export type ProbableWaffleGameCommandType =
  (typeof ProbableWaffleGameCommandTypes)[keyof typeof ProbableWaffleGameCommandTypes];

export interface MoveCommand {
  readonly type: typeof ProbableWaffleGameCommandTypes.Move;
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly actorIds: readonly ActorId[];
  readonly tileVec3: Vector3Simple;
  readonly worldVec3: Vector3Simple;
  readonly queue: boolean;
}

export interface ActorActionCommand {
  readonly type: typeof ProbableWaffleGameCommandTypes.ActorAction;
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly actorIds: readonly ActorId[];
  readonly orderType?: OrderType;
  readonly targetObjectIds?: readonly ActorId[];
  readonly tileVec3?: Vector3Simple;
  readonly queue: boolean;
}

export interface StopCommand {
  readonly type: typeof ProbableWaffleGameCommandTypes.Stop;
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly actorIds: readonly ActorId[];
}

export interface ProductionCommand {
  readonly type: typeof ProbableWaffleGameCommandTypes.Production;
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly actorIds: readonly ActorId[];
  readonly actorName: ObjectNames;
}

export interface CancelProductionCommand {
  readonly type: typeof ProbableWaffleGameCommandTypes.CancelProduction;
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly actorIds: readonly ActorId[];
  readonly queueIndex: number;
}

export interface ResearchCommand {
  readonly type: typeof ProbableWaffleGameCommandTypes.Research;
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly actorIds: readonly ActorId[];
  readonly researchType: ResearchType;
}

export interface CancelResearchCommand {
  readonly type: typeof ProbableWaffleGameCommandTypes.CancelResearch;
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

export type GameCommandInput =
  | Omit<MoveCommand, "tick">
  | Omit<ActorActionCommand, "tick">
  | Omit<StopCommand, "tick">
  | Omit<ProductionCommand, "tick">
  | Omit<CancelProductionCommand, "tick">
  | Omit<ResearchCommand, "tick">
  | Omit<CancelResearchCommand, "tick">;
