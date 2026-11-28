import type { AiPlanStepId } from "../../../contracts/ai-core-types";
import type { CreateAiBrainStateInput } from "../../state/create-ai-brain-state";

/** Explicit context derived from the current world when upgrading a legacy save. */
export interface AiLegacyMigrationContext extends CreateAiBrainStateInput {
  readonly satisfiedOpeningStepIds: readonly AiPlanStepId[];
  /** Existing runtime saves have already crossed their legacy opening boundary. */
  readonly legacyOpeningLifecycle?: "active" | "completed";
}
