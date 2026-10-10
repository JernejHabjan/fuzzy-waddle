import type { GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";

/** Delivery/loss diagnostics do not settle the admitted world's pending actors, including after restore. */
export function isSettlingCommandOutcome(outcome: GameCommandOutcome): boolean {
  return (
    ["completed", "rejected", "cancelled", "failed"].includes(outcome.kind) &&
    outcome.reason !== "duplicate_command" &&
    outcome.reason !== "lost_outcome" &&
    outcome.reason !== "outcome_backlog_overflow"
  );
}
