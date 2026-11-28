import type { AiBrainSlicePolicy } from "./contracts/ai-brain-slice-policy";
export type { AiBrainSlicePolicy } from "./contracts/ai-brain-slice-policy";
import type { AiBrainState } from "../contracts/state/ai-state-contracts";

/** Persisted state slice names that require one owner, default, migration and serializer policy. */
export type AiBrainSliceName = Exclude<
  keyof AiBrainState,
  "schemaVersion" | "playerNumber" | "faction" | "profileVersion" | "lastCommittedTick"
>;

const policy = (slice: AiBrainSliceName, reducerOwner: string): AiBrainSlicePolicy => ({
  slice,
  reducerOwner,
  defaultOwner: "createAiBrainState",
  migration: "preserve_current_or_bootstrap_from_current_world",
  serializer: "canonical_ai"
});

/** Complete current slice policy manifest used by migration and coverage tests. */
export const AI_BRAIN_SLICE_POLICIES: readonly AiBrainSlicePolicy[] = [
  policy("profileDifficulty", "profile reducer"),
  policy("strategy", "strategy reducer"),
  policy("opening", "opening reducer"),
  policy("knowledge", "knowledge reducer"),
  policy("skirmish", "skirmish reducer"),
  policy("bases", "base reducer"),
  policy("economyProduction", "economy/production reducer"),
  policy("recovery", "recovery reducer"),
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
