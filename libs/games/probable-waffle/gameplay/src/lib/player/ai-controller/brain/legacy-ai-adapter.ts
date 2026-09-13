import type { AIBehaviorTreeStateData } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import { migrateAiBrainState, type AiLegacyMigrationContextV1 } from "./migrate-ai-brain-state";

/**
 * One-way compatibility adapter for current saves. It deliberately returns new brain state;
 * the legacy blackboard remains input-only and cannot become an owner of migrated slices.
 */
export function adaptLegacyAiSaveToBrainState(
  legacyState: AIBehaviorTreeStateData | undefined,
  context: AiLegacyMigrationContextV1
): AiBrainStateV1 {
  return migrateAiBrainState(legacyState, context);
}
