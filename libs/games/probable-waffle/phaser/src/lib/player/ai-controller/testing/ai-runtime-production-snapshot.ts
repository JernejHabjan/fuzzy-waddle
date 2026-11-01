import type { AiBrainState, AiCapabilityCatalog, AiObservation } from "@fuzzy-waddle/probable-waffle-gameplay";
import type { ResearchType, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiRuntimeProductionFact } from "./ai-runtime-production-fact";
import type { AiRuntimeProductionQueue } from "./ai-runtime-production-queue";
import type { AiRuntimePendingCommand } from "./ai-runtime-pending-command";
import type { AiRuntimeProductionWorld } from "./ai-runtime-production-world";
import type { AiRuntimeInitialConstruction } from "./ai-runtime-initial-construction";
import type { AiRuntimeResourceCoverage } from "./ai-runtime-resource-coverage";
import type { AiRuntimeResourceServiceInterval } from "./ai-runtime-resource-service-interval";
import type { AiRuntimeProductionSetup } from "./ai-runtime-production-setup";
import type { AiRuntimeProductionFrontiers } from "./ai-runtime-production-frontiers";

/**
 * Diagnostic raw capture, not RuntimeProductionEvidence. Missing causal attribution and navigation/placement proof
 * remain explicit; an oracle must not accept this record merely because it contains real callbacks.
 */
export interface AiRuntimeProductionSnapshot {
  readonly schemaVersion: 1;
  readonly kind: "production_authority_capture";
  readonly startedTick: number;
  readonly playerNumber: number;
  readonly droppedFactCount: number;
  readonly droppedSnapshotCount: number;
  readonly gaps: readonly string[];
  /** Opt-in complete setup and closed native history. Legacy diagnostics omit these instead of backfilling. */
  readonly setup?: AiRuntimeProductionSetup;
  readonly setupGaps?: readonly string[];
  readonly frontiers?: ReturnType<AiRuntimeProductionFrontiers["read"]>;
  /** Captured once at listener installation; legacy omission cannot be repaired from later actor snapshots. */
  readonly initialConstruction?: AiRuntimeInitialConstruction;
  readonly resourceCoverage?: AiRuntimeResourceCoverage;
  /** Fixed fixture declarations at the actual installation boundary; absent legacy capture has no interval oracle. */
  readonly resourceIntervalDeclaration?: {
    readonly boundary: AiRuntimeResourceCoverage["frontier"];
    readonly overflow: boolean;
    readonly intervals: readonly AiRuntimeResourceServiceInterval[];
  };
  readonly facts: readonly AiRuntimeProductionFact[];
  /** Optional bounded movement-only path query trace; diagnostic raw data, not a route proof. */
  readonly movementQueries?: readonly {
    readonly tick: number;
    readonly playerNumber: number;
    readonly actorId: string | null;
    readonly method: "tile_static" | "tile_dynamic";
    readonly sourceTile: { readonly x: number; readonly y: number } | null;
    readonly targetTile: { readonly x: number; readonly y: number };
    readonly dynamicBlockerCount: number | null;
    readonly result: "path" | "no_path" | "threw";
    readonly pathLength: number | null;
    readonly firstStep: { readonly x: number; readonly y: number } | null;
    readonly lastStep: { readonly x: number; readonly y: number } | null;
    readonly pathTiles?: readonly { readonly x: number; readonly y: number }[] | null;
    readonly sourceNavigable: boolean | null;
    readonly targetNavigable: boolean | null;
    readonly heightGraphReachable: boolean | null;
  }[];
  /** All beneficiaries share the original root budget; retained separately from source-player filtered service facts. */
  readonly recipientResourceFacts?: readonly AiRuntimeProductionFact[];
  readonly snapshots: readonly {
    readonly tick: number;
    /** Last observed fact for this player before sampling. Legacy captures cannot establish same-tick effect order. */
    readonly afterSequence?: number;
    /** Read-time partial coverage and global observer frontier; no end-of-tick seal is implied. */
    readonly resourceCoverage?: AiRuntimeResourceCoverage;
    readonly observation: AiObservation | null;
    readonly capabilityCatalog: AiCapabilityCatalog | null;
    /** Actual owned component readiness/levels and command-priced options; absent in older diagnostic captures. */
    readonly world?: AiRuntimeProductionWorld;
    /** Actual owned identities, also available at tick zero and explicit human queue callbacks without an AI input. */
    readonly ownedActors: readonly { readonly actorId: string; readonly objectName: string }[];
    /** Read-only save-owned state, retaining fulfilled/expired exactly as recorded by the brain. */
    readonly economyProduction: AiBrainState["economyProduction"] | null;
    readonly reservations: AiBrainState["reservations"];
    readonly resources: Readonly<Record<ResourceType, number>>;
    /** Actual admitted AI commands still awaiting application; not a queue, refund credit or resource escrow. */
    readonly pendingCommands: readonly AiRuntimePendingCommand[];
    /** Full claims until all addressed actors settle, separate from queue liabilities. Null signals aggregate overflow. */
    readonly pendingResourceClaims: Readonly<Record<ResourceType, number>> | null;
    readonly obligations: Readonly<Record<ResourceType, number>>;
    readonly queues: readonly AiRuntimeProductionQueue[];
    readonly completedResearch: readonly ResearchType[];
  }[];
}
