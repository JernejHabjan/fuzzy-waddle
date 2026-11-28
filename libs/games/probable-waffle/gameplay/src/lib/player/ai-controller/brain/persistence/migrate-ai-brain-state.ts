import type { AiLegacyMigrationContext } from "./contracts/ai-legacy-migration-context";
export type { AiLegacyMigrationContext } from "./contracts/ai-legacy-migration-context";
import type { AiBrainState } from "../../contracts/state/ai-state-contracts";
import { assertAiBrainState, isAiBrainState } from "../../contracts/validation/validate-ai-contracts";
import { createAiBrainState } from "../state/create-ai-brain-state";

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
  const withSkirmishState =
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
  const withRecoveryState =
    "recovery" in withSkirmishState ? withSkirmishState : { ...withSkirmishState, recovery: { records: [] } };
  const withAdaptationState =
    isRecord(withRecoveryState.economyProduction) && "adaptation" in withRecoveryState.economyProduction
      ? withRecoveryState
      : {
          ...withRecoveryState,
          economyProduction: {
            ...(withRecoveryState.economyProduction as Record<string, unknown>),
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
  if (!isAiBrainState(withAdaptationState)) {
    throw new AiBrainMigrationError("malformed_state", "missing_required_slices");
  }
  try {
    assertAiBrainState(withAdaptationState);
  } catch (error) {
    throw new AiBrainMigrationError("malformed_state", error instanceof Error ? error.message : "invalid_number");
  }
  return withAdaptationState;
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
