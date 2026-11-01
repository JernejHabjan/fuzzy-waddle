import type { AiBrainState } from "../contracts/ai-brain-state";

/** Persisted state slice names that require one owner, default, migration and serializer policy. */
export type AiBrainSliceName = Exclude<
  keyof AiBrainState,
  "schemaVersion" | "playerNumber" | "faction" | "profileVersion" | "lastCommittedTick"
>;

/** Durable ownership policy for one current state slice. */
export interface AiBrainSlicePolicy {
  readonly slice: AiBrainSliceName;
  readonly reducerOwner: string;
  readonly defaultOwner: "createAiBrainState";
  readonly migration: "preserve_current_or_bootstrap_from_current_world";
  readonly serializer: "canonical_ai";
}

const policy = (slice: AiBrainSliceName, reducerOwner: string): AiBrainSlicePolicy => ({
  slice,
  reducerOwner,
  defaultOwner: "createAiBrainState",
  migration: "preserve_current_or_bootstrap_from_current_world",
  serializer: "canonical_ai"
});

/** Complete current slice policy manifest used by migration and coverage tests. */
export const AI_BRAIN_SLICE_POLICIES: readonly AiBrainSlicePolicy[] = [
  policy("strategy", "strategy reducer"),
  policy("opening", "opening reducer"),
  policy("knowledge", "knowledge reducer"),
  policy("skirmish", "Stage 9 skirmish reducer"),
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
