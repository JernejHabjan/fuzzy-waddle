import type { ActorId } from "@fuzzy-waddle/platform-game-sessions";
import type { AiDeadline, AiSupportPlanId } from "../ai-core-types";

/** Persisted support assignment and temporary-effect ownership. */
export interface AiSupportState {
  readonly planId: AiSupportPlanId;
  readonly actorIds: readonly ActorId[];
  readonly targetIds: readonly ActorId[];
  readonly expiresAt: AiDeadline | null;
  readonly kind?: "heal" | "spell" | "temporary_support";
  readonly spellType?: string | null;
  readonly state?: "reserved" | "dispatched" | "active" | "completed" | "released";
  readonly effectId?: string | null;
  readonly usefulCapacity?: number;
  readonly reason?: string;
}
