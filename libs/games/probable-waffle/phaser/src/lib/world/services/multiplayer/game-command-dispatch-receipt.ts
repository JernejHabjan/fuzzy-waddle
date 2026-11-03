import type { GameCommand, GameCommandOutcomeReason } from "@fuzzy-waddle/probable-waffle-protocol";
/** Immediate result of admitting a command to the shared authority. */
export type GameCommandDispatchReceipt =
  | { readonly status: "dispatched"; readonly command: GameCommand }
  | { readonly status: "rejected"; readonly reason: GameCommandOutcomeReason };
