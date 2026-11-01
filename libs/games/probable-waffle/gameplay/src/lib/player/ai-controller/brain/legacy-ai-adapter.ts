import type { AIBehaviorTreeStateData } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainState } from "../contracts/ai-brain-state";
import { migrateAiBrainState, type AiLegacyMigrationContext } from "./migrate-ai-brain-state";

/**
 * One-way compatibility adapter for current saves. It deliberately returns new brain state;
 * the legacy blackboard remains input-only and cannot become an owner of migrated slices.
 */
export function adaptLegacyAiSaveToBrainState(
  legacyState: AIBehaviorTreeStateData | undefined,
  context: AiLegacyMigrationContext
): AiBrainState {
  return migrateAiBrainState(legacyState, context);
}
