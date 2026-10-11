import type { AiBrainStateV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeUnspentClaimsV1 } from "./ai-runtime-unspent-claims-v1";
import type { AiRuntimePendingCommandV1 } from "./ai-runtime-pending-command-v1";
import type { AiRuntimeProductionQueueV1 } from "./ai-runtime-production-queue-v1";

/**
 * State sampled at the enclosing callback, never a nearby settled snapshot. Saved reservations can lag the
 * dispatching result and applied outcomes. Only unspentClaims carries reconciled selected-claim ownership.
 * Null denotes unavailable/invalid authority, including genuine overflow; it must never become a zero vector.
 */
export interface AiRuntimeProductionBoundaryState {
  /** True rejects fresh native lifecycle proof during snapshot application; absent in older diagnostic captures. */
  readonly snapshotRestoreInProgress?: boolean;
  /** Optional only for older captures. Reconciled queue claims; unsupported/pre-capture ownership remains null. */
  readonly unspentClaims?: AiRuntimeUnspentClaimsV1;
  /** Exact exhausted live head at a successful progress callback, excluded from future charges before removal. */
  readonly exhaustedProgressItemId?: string;
  readonly resources: Readonly<Record<ResourceType, number>> | null;
  readonly brain: {
    readonly lastCommittedTick: number;
    readonly decisionSequence: number;
    readonly reservations: AiBrainStateV1["reservations"];
  } | null;
  readonly pendingCommands: readonly AiRuntimePendingCommandV1[];
  readonly pendingResourceClaims: Readonly<Record<ResourceType, number>> | null;
  readonly queues: readonly AiRuntimeProductionQueueV1[] | null;
  /** Stored remaining costs at this callback. Payment finish is pre-progress; advanced callbacks exclude the exhausted head. */
  readonly obligations: Readonly<Record<ResourceType, number>> | null;
  readonly gaps: readonly string[];
}
