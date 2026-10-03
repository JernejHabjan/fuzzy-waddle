import type { AiBrainStateV1, AiCapabilityCatalogV1, AiObservationV1 } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import type { AiRuntimeProductionQueueV1 } from "./ai-runtime-production-queue-v1";

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
  readonly facts: readonly AiRuntimeProductionFactV1[];
  readonly snapshots: readonly {
    readonly tick: number;
    readonly observation: AiObservationV1 | null;
    readonly capabilityCatalog: AiCapabilityCatalogV1 | null;
    /** Actual tick-zero owned identities are available even before the first fair observation commit. */
    readonly ownedActors: readonly { readonly actorId: string; readonly objectName: string }[];
    /** Read-only save-owned state, retaining fulfilled/expired exactly as recorded by the brain. */
    readonly economyProduction: AiBrainStateV1["economyProduction"] | null;
    readonly reservations: AiBrainStateV1["reservations"];
    readonly resources: Readonly<Record<ResourceType, number>>;
    readonly obligations: Readonly<Record<ResourceType, number>>;
    readonly queues: readonly AiRuntimeProductionQueueV1[];
    readonly completedResearch: readonly ResearchType[];
  }[];
}
