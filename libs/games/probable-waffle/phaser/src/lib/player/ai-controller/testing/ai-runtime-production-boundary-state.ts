import type { AiBrainState } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeUnspentClaimsSnapshot } from "./ai-runtime-unspent-claims-snapshot";
import type { AiRuntimePendingCommand } from "./ai-runtime-pending-command";
import type { AiRuntimeProductionQueue } from "./ai-runtime-production-queue";

/**
 * State sampled at the enclosing callback, never a nearby settled snapshot. Saved reservations can lag the
 * dispatching result and applied outcomes. Only unspentClaims carries reconciled selected-claim ownership.
 * Null denotes unavailable/invalid authority, including genuine overflow; it must never become a zero vector.
 */
export interface AiRuntimeProductionBoundaryState {
  /** True rejects fresh native lifecycle proof during snapshot application; absent in older diagnostic captures. */
  readonly snapshotRestoreInProgress?: boolean;
  /** Optional only for older captures. Reconciled queue claims; unsupported/pre-capture ownership remains null. */
  readonly unspentClaims?: AiRuntimeUnspentClaimsSnapshot;
  /** Exact exhausted live head at a successful progress callback, excluded from future charges before removal. */
  readonly exhaustedProgressItemId?: string;
  readonly resources: Readonly<Record<ResourceType, number>> | null;
  readonly brain: {
    readonly lastCommittedTick: number;
    readonly decisionSequence: number;
    readonly reservations: AiBrainState["reservations"];
  } | null;
  readonly pendingCommands: readonly AiRuntimePendingCommand[];
  readonly pendingResourceClaims: Readonly<Record<ResourceType, number>> | null;
  readonly queues: readonly AiRuntimeProductionQueue[] | null;
  /** Stored remaining costs at this callback. Payment finish is pre-progress; advanced callbacks exclude the exhausted head. */
  readonly obligations: Readonly<Record<ResourceType, number>> | null;
  readonly gaps: readonly string[];
}
