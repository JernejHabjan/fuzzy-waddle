import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiDiagnosticCompleteness } from "./ai-debug-snapshot";

/** Canonical replay inputs and provenance; presentation labels are deliberately excluded. */
export interface AiReproInputs {
  readonly sourceRevision: string;
  readonly dirtySourceDigest: string | null;
  readonly mapId: string;
  readonly mapDigest: string;
  readonly contentDigest: string;
  readonly configVersion: string;
  readonly profileVersion: string;
  readonly archetypeVersion: string;
  readonly difficulty: "easy" | "normal" | "hard";
  readonly faction: FactionType;
  readonly playerNumber: PlayerNumber;
  readonly rulesVersion: string;
  readonly tickInterval: number;
  readonly authorityEpoch: number;
  readonly tick: number;
  readonly snapshotReference: string;
  readonly snapshotDigest: string;
  readonly inputReference: string;
  readonly inputDigest: string;
  readonly expectedCheckpoints: readonly { readonly tick: number; readonly digest: string }[];
  readonly scenarioId: string | null;
}

/** Human-facing metadata that is never part of a decision or replay digest. */
export interface AiReproDisplayMetadata {
  readonly label: string;
}

/** Versioned manifest for a pure decision or host-only runtime reproduction capture. */
export interface AiReproBundle {
  readonly schemaVersion: 1;
  readonly kind: "decision" | "runtime";
  readonly replayInputs: AiReproInputs;
  readonly completeness: AiDiagnosticCompleteness;
  readonly privacy: "permitted_player_data" | "host_confidential";
  readonly display: AiReproDisplayMetadata;
}

/** Bounded automatic incident-capture policy; unresolved command records are stored elsewhere. */
export interface AiReproCapturePolicy {
  readonly automaticCapturesPerCausalEpisode: 1;
  readonly maxRetainedIncidentBundles: 5;
  readonly sessionQuotaBytes: number;
}

/** Initial capture policy from the debug workbench specification. */
export const AI_REPRO_CAPTURE_POLICY: AiReproCapturePolicy = {
  automaticCapturesPerCausalEpisode: 1,
  maxRetainedIncidentBundles: 5,
  sessionQuotaBytes: 64 * 1024 * 1024
};
