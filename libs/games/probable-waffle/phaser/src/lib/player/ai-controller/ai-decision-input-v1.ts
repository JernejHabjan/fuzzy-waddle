import type { AiAccessGraphV1, AiCapabilityCatalogV1, AiObservationV1 } from "@fuzzy-waddle/probable-waffle-gameplay";

/** Test-only inputs actually consumed by a selected pure step, separate from later settled world snapshots. */
export interface AiDecisionInputV1 {
  /** Null marks bounded capture loss; no actor/query subset may masquerade as a complete input. */
  readonly observation: Pick<AiObservationV1,
    "schemaVersion" | "generation" | "tick" | "playerNumber" | "faction" | "actors" | "accessProducts" | "threatSummary"> | null;
  readonly capabilityCatalog: AiCapabilityCatalogV1 | null;
  /** The observation's permitted cached topology, with its own generation/status/age. */
  readonly accessGraph: AiAccessGraphV1 | null;
  readonly cadence: {
    readonly clock: "simulation" | "render_fallback";
    /** Actual fixed-clock boundary; fallback has no deterministic tick authority. */
    readonly tick: number | null;
    readonly configuredIntervalTicks: number;
    /** Completed controller attempts BEFORE this selected step; distinct from the pure decision sequence. */
    readonly completedBefore: number;
  };
  readonly snapshotRestoreInProgress: boolean;
  readonly gaps: readonly string[];
}
