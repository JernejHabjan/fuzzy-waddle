import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";

/** Persisted state slice names that require one owner, default, migration and serializer policy. */
export type AiBrainSliceNameV1 = Exclude<
  keyof AiBrainStateV1,
  "schemaVersion" | "playerNumber" | "faction" | "profileVersion" | "lastCommittedTick"
>;

/** Durable ownership policy for one V1 state slice. */
export interface AiBrainSlicePolicyV1 {
  readonly slice: AiBrainSliceNameV1;
  readonly reducerOwner: string;
  readonly defaultOwner: "createAiBrainStateV1";
  readonly migration: "preserve_v1_or_bootstrap_from_current_world";
  readonly serializer: "canonical_ai_v1";
}

const policy = (slice: AiBrainSliceNameV1, reducerOwner: string): AiBrainSlicePolicyV1 => ({
  slice,
  reducerOwner,
  defaultOwner: "createAiBrainStateV1",
  migration: "preserve_v1_or_bootstrap_from_current_world",
  serializer: "canonical_ai_v1"
});

/** Complete V1 slice policy manifest used by migration and coverage tests. */
export const AI_BRAIN_SLICE_POLICIES_V1: readonly AiBrainSlicePolicyV1[] = [
  policy("strategy", "strategy reducer"),
  policy("opening", "opening reducer"),
  policy("knowledge", "knowledge reducer"),
  policy("bases", "base reducer"),
  policy("economyProduction", "economy/production reducer"),
  policy("reservations", "reservation reducer"),
  policy("waitEdges", "dependency reducer"),
  policy("pendingOutcomes", "outcome reconciliation reducer"),
  policy("authority", "authority reducer"),
  policy("squads", "squad reducer"),
  policy("transport", "transport reducer"),
  policy("fortifications", "fortification reducer"),
  policy("support", "support reducer"),
  policy("progress", "progress supervisor reducer"),
  policy("blockers", "progress supervisor reducer"),
  policy("recoveryEpisodes", "recovery reducer"),
  policy("lanes", "service lane reducer"),
  policy("queries", "query reducer"),
  policy("scheduler", "scheduler reducer"),
  policy("identities", "identity reducer")
];
