import type { PlayerNumber } from "@fuzzy-waddle/platform-game-sessions";
import type { FactionType } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiDiagnosticCompletenessV1 } from "./ai-debug-snapshot-v1";

/** Canonical replay inputs and provenance; presentation labels are deliberately excluded. */
export interface AiReproInputsV1 {
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
export interface AiReproDisplayMetadataV1 {
  readonly label: string;
}

/** Versioned manifest for a pure decision or host-only runtime reproduction capture. */
export interface AiReproBundleV1 {
  readonly schemaVersion: 1;
  readonly kind: "decision" | "runtime";
  readonly replayInputs: AiReproInputsV1;
  readonly completeness: AiDiagnosticCompletenessV1;
  readonly privacy: "permitted_player_data" | "host_confidential";
  readonly display: AiReproDisplayMetadataV1;
}

/** Bounded automatic incident-capture policy; unresolved command records are stored elsewhere. */
export interface AiReproCapturePolicyV1 {
  readonly automaticCapturesPerCausalEpisode: 1;
  readonly maxRetainedIncidentBundles: 5;
  readonly sessionQuotaBytes: number;
}

/** Initial capture policy from the debug workbench specification. */
export const AI_REPRO_CAPTURE_POLICY_V1: AiReproCapturePolicyV1 = {
  automaticCapturesPerCausalEpisode: 1,
  maxRetainedIncidentBundles: 5,
  sessionQuotaBytes: 64 * 1024 * 1024
};
