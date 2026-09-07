import type { AiBrainStateV1 } from "../contracts/ai-brain-state-v1";
import type { AiPlanStepId } from "../contracts/ai-core-types";
import { assertAiBrainStateV1, isAiBrainStateV1 } from "../contracts/validate-ai-contracts-v1";
import { createAiBrainStateV1, type CreateAiBrainStateV1Input } from "./create-ai-brain-state-v1";

/** Explicit context derived from the current world when upgrading a legacy save. */
export interface AiLegacyMigrationContextV1 extends CreateAiBrainStateV1Input {
  readonly satisfiedOpeningStepIds: readonly AiPlanStepId[];
  /** Existing runtime saves have already crossed their legacy opening boundary. */
  readonly legacyOpeningLifecycle?: "active" | "completed";
}

/** Typed migration failure suitable for save/load diagnostics. */
export class AiBrainMigrationError extends Error {
  constructor(
    readonly code: "malformed_state" | "unsupported_future_schema",
    detail: string
  ) {
    super(`${code}:${detail}`);
    this.name = "AiBrainMigrationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validateV1(value: Record<string, unknown>): AiBrainStateV1 {
  const stage9Compatible = "skirmish" in value
    ? value
    : {
        ...value,
        skirmish: {
          incidents: [],
          mode: { state: "active", hopelessSinceTick: null, concessionIntentId: null, lastReason: null },
          timeline: []
        }
      };
  if (!isAiBrainStateV1(stage9Compatible)) {
    throw new AiBrainMigrationError("malformed_state", "missing_v1_slices");
  }
  try {
    assertAiBrainStateV1(stage9Compatible);
  } catch (error) {
    throw new AiBrainMigrationError("malformed_state", error instanceof Error ? error.message : "invalid_number");
  }
  return stage9Compatible;
}

/**
 * Loads V1 directly, rejects unknown future schemas, or bootstraps a legacy behavior-tree save
 * from current-world evidence. Completed opening steps are supplied by the adapter so migration
 * never replays an already satisfied construction or production checkpoint.
 */
export function migrateAiBrainState(input: unknown, context: AiLegacyMigrationContextV1): AiBrainStateV1 {
  if (isRecord(input) && "schemaVersion" in input) {
    if (typeof input.schemaVersion !== "number" || !Number.isSafeInteger(input.schemaVersion)) {
      throw new AiBrainMigrationError("malformed_state", "schema_version");
    }
    if (input.schemaVersion > 1) {
      throw new AiBrainMigrationError("unsupported_future_schema", String(input.schemaVersion));
    }
    return validateV1(input);
  }

  if (input !== undefined && input !== null && (!isRecord(input) || !isRecord(input.blackboard))) {
    throw new AiBrainMigrationError("malformed_state", "legacy_shape");
  }

  const migrated = createAiBrainStateV1({
    ...context,
    completedOpeningStepIds: context.satisfiedOpeningStepIds
  });
  if (context.legacyOpeningLifecycle !== "completed") return migrated;
  return {
    ...migrated,
    strategy: { ...migrated.strategy, stance: "stabilize", goalId: null },
    opening: { ...migrated.opening, plan: { ...migrated.opening.plan, lifecycle: "completed" } }
  };
}
