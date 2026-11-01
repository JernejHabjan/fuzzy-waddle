import type { AiBrainState } from "../contracts/ai-brain-state";
import type { AiPlanStepId } from "../contracts/ai-core-types";
import { assertAiBrainState, isAiBrainState } from "../contracts/validate-ai-contracts";
import { createAiBrainState, type CreateAiBrainStateInput } from "./create-ai-brain-state";

/** Explicit context derived from the current world when upgrading a legacy save. */
export interface AiLegacyMigrationContext extends CreateAiBrainStateInput {
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

function validateCurrentState(value: Record<string, unknown>): AiBrainState {
  const stage9Compatible =
    "skirmish" in value
      ? value
      : {
          ...value,
          skirmish: {
            incidents: [],
            mode: { state: "active", hopelessSinceTick: null, concessionIntentId: null, lastReason: null },
            timeline: []
          }
        };
  const stage12Compatible =
    "recovery" in stage9Compatible ? stage9Compatible : { ...stage9Compatible, recovery: { records: [] } };
  const stage14Compatible =
    isRecord(stage12Compatible.economyProduction) && "adaptation" in stage12Compatible.economyProduction
      ? stage12Compatible
      : {
          ...stage12Compatible,
          economyProduction: {
            ...(stage12Compatible.economyProduction as Record<string, unknown>),
            adaptation: {
              evidence: [],
              activeRoleTargets: [],
              lastTransitionTick: null,
              lastTransitionReason: null,
              selectedResearchType: null,
              selectedResearchScore: null,
              cancellationPolicy: "retain_committed_production"
            }
          }
        };
  if (!isAiBrainState(stage14Compatible)) {
    throw new AiBrainMigrationError("malformed_state", "missing_required_slices");
  }
  try {
    assertAiBrainState(stage14Compatible);
  } catch (error) {
    throw new AiBrainMigrationError("malformed_state", error instanceof Error ? error.message : "invalid_number");
  }
  return stage14Compatible;
}

/**
 * Loads current directly, rejects unknown future schemas, or bootstraps a legacy behavior-tree save
 * from current-world evidence. Completed opening steps are supplied by the adapter so migration
 * never replays an already satisfied construction or production checkpoint.
 */
export function migrateAiBrainState(input: unknown, context: AiLegacyMigrationContext): AiBrainState {
  if (isRecord(input) && "schemaVersion" in input) {
    if (typeof input.schemaVersion !== "number" || !Number.isSafeInteger(input.schemaVersion)) {
      throw new AiBrainMigrationError("malformed_state", "schema_version");
    }
    if (input.schemaVersion > 1) {
      throw new AiBrainMigrationError("unsupported_future_schema", String(input.schemaVersion));
    }
    return validateCurrentState(input);
  }

  if (input !== undefined && input !== null && (!isRecord(input) || !isRecord(input.blackboard))) {
    throw new AiBrainMigrationError("malformed_state", "legacy_shape");
  }

  const migrated = createAiBrainState({
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
