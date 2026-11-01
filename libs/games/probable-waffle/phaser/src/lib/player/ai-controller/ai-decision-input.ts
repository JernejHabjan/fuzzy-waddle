import type {
  AiAccessGraph, AiCapabilityCatalog, AiObservation, AiProfileConfig
} from "@fuzzy-waddle/probable-waffle-gameplay";
import type { AiDecisionProducerExposure } from "./ai-decision-producer-exposure";

/** Test-only inputs actually consumed by a selected pure step, separate from later settled world snapshots. */
export interface AiDecisionInput {
  /** Actual controller/brain policy at selection. Missing legacy evidence cannot certify difficulty or quotas. */
  readonly profile?: AiProfileConfig;
  /** Null marks bounded capture loss; no actor/query subset may masquerade as a complete input. */
  readonly observation: Pick<
    AiObservation,
    "schemaVersion" | "generation" | "tick" | "playerNumber" | "faction" | "actors" | "accessProducts" | "threatSummary"
  > | null;
  readonly capabilityCatalog: AiCapabilityCatalog | null;
  /** Exact consumed four-resource ledger. This is an observation input, not complete native alias/lifetime authority. */
  readonly resources?: AiObservation["resources"];
  /** Exact permitted scouting/effect inputs; null is capture loss, never an empty explored world. */
  readonly map?: Pick<NonNullable<AiObservation["map"]>, "bounds" | "staticRevision" | "frontierAccessNodeIds" |
    "scoutSearchPoints" | "scoutCoverageAccessNodeIds" | "dynamicObstacleActorIds" | "regionGeneration"> | null;
  readonly effects?: AiObservation["effects"] | null;
  readonly modeGoals?: AiObservation["modeGoals"] | null;
  /** The observation's permitted cached topology, with its own generation/status/age. */
  readonly accessGraph: AiAccessGraph | null;
  /** Optional only for older publishers; current capture preserves explicit missing/binding gaps. */
  readonly producerExposure?: AiDecisionProducerExposure | null;
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
