import type { Vector3Simple } from "@fuzzy-waddle/platform-game-sessions";
import type { OrderType } from "../../probable-waffle/order-type";
import type { ActorId, PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { ObjectNames } from "./object-names";
import type { ResearchType } from "./research-type";

export const ProbableWaffleGameCommandTypes = {
  Move: "MOVE",
  ActorAction: "ACTOR_ACTION",
  Stop: "STOP",
  Production: "PRODUCTION",
  CancelProduction: "CANCEL_PRODUCTION",
  Research: "RESEARCH",
  CancelResearch: "CANCEL_RESEARCH",
  Construct: "CONSTRUCT",
  CastSpell: "CAST_SPELL",
  Unload: "UNLOAD",
  SetRallyPoint: "SET_RALLY_POINT",
  Concede: "CONCEDE"
} as const;

export type ProbableWaffleGameCommandType =
  (typeof ProbableWaffleGameCommandTypes)[keyof typeof ProbableWaffleGameCommandTypes];

/** Identifies the producer without changing the rules used to apply the command. */
export type GameCommandSource = "human" | "ai" | "campaign" | "replay";

/**
 * Versioned idempotency and authority metadata carried by the command stream.
 * Legacy version-1 archives omit this field and are upgraded deterministically by
 * the playback/application boundary before they can affect the world.
 */
export interface GameCommandExecution {
  readonly schemaVersion: 1;
  readonly commandId: string;
  readonly commitmentKey: string;
  readonly source: GameCommandSource;
  readonly authorityEpoch: number;
  readonly sequence: number;
  readonly intentId?: string;
  readonly effectId?: string;
}

interface GameCommandBase {
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly actorIds: readonly ActorId[];
  readonly execution?: GameCommandExecution;
}

export interface MoveCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.Move;
  readonly tileVec3: Vector3Simple;
  readonly worldVec3: Vector3Simple;
  readonly queue: boolean;
}

export interface ActorActionCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.ActorAction;
  readonly orderType?: OrderType;
  readonly targetObjectIds?: readonly ActorId[];
  readonly tileVec3?: Vector3Simple;
  readonly queue: boolean;
}

export interface StopCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.Stop;
}

export interface ProductionCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.Production;
  readonly actorName: ObjectNames;
}

export interface CancelProductionCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.CancelProduction;
  readonly queueIndex: number;
}

export interface ResearchCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.Research;
  readonly researchType: ResearchType;
}

export interface CancelResearchCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.CancelResearch;
}

/** Creates one construction site and assigns the addressed builders atomically. */
export interface ConstructCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.Construct;
  readonly actorName: ObjectNames;
  readonly tileVec3: Vector3Simple;
  readonly siteKey: string;
}

/** Casts a runtime-defined spell at an actor and/or logical tile. */
export interface CastSpellCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.CastSpell;
  readonly spellType: string;
  readonly targetObjectId?: ActorId;
  readonly tileVec3: Vector3Simple;
}

/** Unloads all or a selected stable subset of a transport's current cargo. */
export interface UnloadCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.Unload;
  readonly passengerIds?: readonly ActorId[];
  readonly tileVec3?: Vector3Simple;
}

/** Sets a producer's deterministic spawn rally destination. */
export interface SetRallyPointCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.SetRallyPoint;
  readonly tileVec3: Vector3Simple;
  readonly worldVec3: Vector3Simple;
  readonly targetObjectId?: ActorId;
}

/** Requests the normal mode-owned concession flow for a player. */
export interface ConcedeCommand extends GameCommandBase {
  readonly type: typeof ProbableWaffleGameCommandTypes.Concede;
  readonly reason: string;
}

export type GameCommand =
  | MoveCommand
  | ActorActionCommand
  | StopCommand
  | ProductionCommand
  | CancelProductionCommand
  | ResearchCommand
  | CancelResearchCommand
  | ConstructCommand
  | CastSpellCommand
  | UnloadCommand
  | SetRallyPointCommand
  | ConcedeCommand;

export type GameCommandInput =
  | Omit<MoveCommand, "tick">
  | Omit<ActorActionCommand, "tick">
  | Omit<StopCommand, "tick">
  | Omit<ProductionCommand, "tick">
  | Omit<CancelProductionCommand, "tick">
  | Omit<ResearchCommand, "tick">
  | Omit<CancelResearchCommand, "tick">
  | Omit<ConstructCommand, "tick">
  | Omit<CastSpellCommand, "tick">
  | Omit<UnloadCommand, "tick">
  | Omit<SetRallyPointCommand, "tick">
  | Omit<ConcedeCommand, "tick">;

export const GameCommandOutcomeKinds = {
  Dispatched: "dispatched",
  Applied: "applied",
  Active: "active",
  Completed: "completed",
  Rejected: "rejected",
  Cancelled: "cancelled",
  Failed: "failed"
} as const;

export type GameCommandOutcomeKind = (typeof GameCommandOutcomeKinds)[keyof typeof GameCommandOutcomeKinds];

/** Stable machine-readable application reasons shared by AI, replay and debug. */
export type GameCommandOutcomeReason =
  | "accepted_for_dispatch"
  | "applied"
  | "duplicate_command"
  | "stale_authority_epoch"
  | "invalid_command_metadata"
  | "invalid_owner"
  | "missing_actor"
  | "inactive_actor"
  | "invalid_target"
  | "hidden_target"
  | "illegal_site"
  | "insufficient_resources"
  | "capacity_full"
  | "cooldown_active"
  | "unsupported_action"
  | "application_failed"
  | "lost_outcome"
  | "outcome_backlog_overflow"
  | "cancelled";

/** One authoritative lifecycle observation for a command effect. */
export interface GameCommandOutcome {
  readonly schemaVersion: 1;
  readonly kind: GameCommandOutcomeKind;
  readonly reason: GameCommandOutcomeReason;
  readonly tick: number;
  readonly playerNumber: PlayerNumber;
  readonly commandId: string;
  readonly commitmentKey: string;
  readonly authorityEpoch: number;
  readonly sequence: number;
  readonly intentId?: string;
  readonly effectId?: string;
  readonly actorIds: readonly ActorId[];
  readonly worldLinkIds: readonly string[];
  readonly detail?: string;
}

/** Persisted deduplication frontier used by save, reconnect and host migration. */
export interface GameCommandAuthorityState {
  readonly schemaVersion: 1;
  readonly authorityEpoch: number;
  readonly nextSequenceByPlayer: Readonly<Record<number, number>>;
  readonly processedSequenceWatermarkByPlayer?: Readonly<Record<number, number>>;
  readonly processedCommandIds: readonly string[];
  readonly activeCommitments?: Readonly<Record<string, string>>;
  readonly activeCommandProgress?: Readonly<
    Record<string, { readonly expectedActorIds: readonly ActorId[]; readonly terminalActorIds: readonly ActorId[] }>
  >;
  readonly outcomes: readonly GameCommandOutcome[];
}
