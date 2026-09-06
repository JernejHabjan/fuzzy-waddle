import type {
  AiAuthorityStateV1,
  AiCommandOutcomeV1,
  AiDeadlineV1
} from "@fuzzy-waddle/probable-waffle-gameplay";
import type { GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";
import type { GameInstanceId } from "@fuzzy-waddle/platform-game-sessions";

/** Maps the runtime command envelope into the pure brain's fenced identity. */
export function adaptGameCommandOutcomeToBrain(
  outcome: GameCommandOutcome,
  matchId: GameInstanceId
): AiCommandOutcomeV1 {
  const identity = {
    matchId,
    authorityEpoch: outcome.authorityEpoch,
    playerNumber: outcome.playerNumber,
    sequence: outcome.sequence,
    commandId: `command:${outcome.commandId}`,
    effectId: `effect:${outcome.effectId ?? outcome.commitmentKey}`,
    intentId: `intent:${outcome.intentId ?? outcome.commitmentKey}`
  } as const;

  switch (outcome.kind) {
    case "dispatched":
      return { kind: "dispatched", identity, tick: outcome.tick };
    case "applied":
      return { kind: "applied", identity, tick: outcome.tick, worldLinkIds: [...outcome.worldLinkIds] };
    case "active":
      return { kind: "active", identity, tick: outcome.tick, actorIds: [...outcome.actorIds] };
    case "completed":
      return {
        kind: "completed",
        identity,
        tick: outcome.tick,
        resultingActorIds: [],
        worldLinkIds: [...outcome.worldLinkIds]
      };
    case "rejected":
    case "cancelled":
    case "failed":
      return { kind: outcome.kind, identity, tick: outcome.tick, reason: outcome.reason };
  }
}

/** Canonicalizes a bounded runtime outcome window before a pure decision step. */
export function adaptGameCommandOutcomesToBrain(
  outcomes: readonly GameCommandOutcome[],
  matchId: GameInstanceId
): AiCommandOutcomeV1[] {
  return [...outcomes]
    .sort(
      (left, right) =>
        left.authorityEpoch - right.authorityEpoch ||
        left.sequence - right.sequence ||
        left.tick - right.tick ||
        left.kind.localeCompare(right.kind) ||
        left.commandId.localeCompare(right.commandId)
    )
    .map((outcome) => adaptGameCommandOutcomeToBrain(outcome, matchId));
}

/** Projects the saved runtime reconciliation cursor into the Stage 2 brain contract. */
export function adaptCommandAuthorityToBrain(input: {
  readonly authorityEpoch: number;
  readonly processedSequenceWatermark: number;
  readonly pendingCommandIds: readonly string[];
  readonly pendingLimit: number;
  readonly reconciliationDeadline: AiDeadlineV1 | null;
  readonly health: AiAuthorityStateV1["health"];
}): AiAuthorityStateV1 {
  return {
    authorityEpoch: input.authorityEpoch,
    processedSequenceWatermark: input.processedSequenceWatermark,
    pendingCommandIds: [...input.pendingCommandIds].sort().map((commandId) => `command:${commandId}` as const),
    pendingLimit: input.pendingLimit,
    reconciliationDeadline: input.reconciliationDeadline,
    health: input.health
  };
}
