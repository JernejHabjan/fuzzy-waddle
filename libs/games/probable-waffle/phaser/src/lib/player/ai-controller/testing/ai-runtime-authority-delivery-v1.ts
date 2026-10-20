import type { GameCommandOutcome } from "@fuzzy-waddle/probable-waffle-protocol";

export const AI_RUNTIME_AUTHORITY_DELIVERY_EVENT = "ai-runtime-authority-delivery";

/** Test transport boundary only. Original native outcomes are retained; this record never supplies application authority. */
export interface AiRuntimeAuthorityDeliveryV1 {
  readonly faultId: string;
  readonly playerNumber: number;
  readonly tick: number;
  readonly phase: "held" | "released" | "history_unavailable" | "output_destroyed" | "queue_contended";
  readonly outcome: GameCommandOutcome | null;
  readonly actorId: string | null;
  /** Cumulative distinct original command identities selected by this finite fault, not current AI backlog size. */
  readonly pendingCount: number;
}
