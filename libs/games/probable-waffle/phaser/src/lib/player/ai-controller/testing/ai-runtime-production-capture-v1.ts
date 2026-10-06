import type { AiBrainStateV1, AiCapabilityCatalogV1, AiObservationV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import type { AiRuntimeProductionQueueV1 } from "./ai-runtime-production-queue-v1";
import type { AiRuntimePendingCommandV1 } from "./ai-runtime-pending-command-v1";
import type { AiRuntimeProductionWorldV1 } from "./ai-runtime-production-world-v1";
import type { AiRuntimeInitialConstructionV1 } from "./ai-runtime-initial-construction-v1";

/**
 * Diagnostic raw capture, not RuntimeProductionEvidenceV1. Missing causal attribution and navigation/placement proof
 * remain explicit; an oracle must not accept this record merely because it contains real callbacks.
 */
export interface AiRuntimeProductionCaptureV1 {
  readonly schemaVersion: 1;
  readonly kind: "production_authority_capture";
  readonly startedTick: number;
  readonly playerNumber: number;
  readonly droppedFactCount: number;
  readonly droppedSnapshotCount: number;
  readonly gaps: readonly string[];
  /** Captured once at listener installation; legacy omission cannot be repaired from later actor snapshots. */
  readonly initialConstruction?: AiRuntimeInitialConstructionV1;
  readonly facts: readonly AiRuntimeProductionFactV1[];
  readonly snapshots: readonly {
    readonly tick: number;
    /** Last observed fact for this player before sampling. Legacy captures cannot establish same-tick effect order. */
    readonly afterSequence?: number;
    readonly observation: AiObservationV1 | null;
    readonly capabilityCatalog: AiCapabilityCatalogV1 | null;
    /** Actual owned component readiness/levels and command-priced options; absent in older diagnostic captures. */
    readonly world?: AiRuntimeProductionWorldV1;
    /** Actual owned identities, also available at tick zero and explicit human queue callbacks without an AI input. */
    readonly ownedActors: readonly { readonly actorId: string; readonly objectName: string }[];
    /** Read-only save-owned state, retaining fulfilled/expired exactly as recorded by the brain. */
    readonly economyProduction: AiBrainStateV1["economyProduction"] | null;
    readonly reservations: AiBrainStateV1["reservations"];
    readonly resources: Readonly<Record<ResourceType, number>>;
    /** Actual admitted AI commands still awaiting application; not a queue, refund credit or resource escrow. */
    readonly pendingCommands: readonly AiRuntimePendingCommandV1[];
    /** Full claims until all addressed actors settle, separate from queue liabilities. Null signals aggregate overflow. */
    readonly pendingResourceClaims: Readonly<Record<ResourceType, number>> | null;
    readonly obligations: Readonly<Record<ResourceType, number>>;
    readonly queues: readonly AiRuntimeProductionQueueV1[];
    readonly completedResearch: readonly ResearchType[];
  }[];
}
