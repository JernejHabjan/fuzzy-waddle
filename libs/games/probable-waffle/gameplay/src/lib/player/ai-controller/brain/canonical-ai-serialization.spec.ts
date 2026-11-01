import { FactionType, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  canonicalizeAiBrainState,
  canonicalizeAiObservation,
  digestCanonicalAiValue,
  serializeCanonicalAiValue
} from "./canonical-ai-serialization";
import { createAiProfileConfig } from "../profiles/ai-profile-defaults";
import { migrateAiBrainState, AiBrainMigrationError } from "./migrate-ai-brain-state";
import { createAiTestObservation } from "../testing/ai-test-fixtures";

describe("Stage 2 canonical state and migration", () => {
  const profile = createAiProfileConfig(ProbableWaffleAiDifficulty.Medium);
  const migrationContext = {
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 40,
    archetypeId: "balanced",
    satisfiedOpeningStepIds: ["step:producer", "step:worker"] as const
  };

  it("serializes and digests equivalent permuted observations identically", () => {
    const first = createAiTestObservation();
    const second = {
      ...first,
      resources: [
        {
          resourceType: ResourceType.Food,
          stockpile: 10,
          reservedUnspent: 0,
          obligationsDue: 0,
          deliveredIncomePerMinute: { status: "unknown", reason: "not_observed" } as const
        },
        ...first.resources
      ],
      modeGoals: [
        {
          id: "goal:b",
          kind: "survive" as const,
          owner: 1,
          targetActorIds: ["z", "a"],
          targetAccessNodeIds: ["access:z", "access:a"] as const,
          state: "active" as const
        },
        {
          id: "goal:a",
          kind: "score" as const,
          owner: 1,
          targetActorIds: [],
          targetAccessNodeIds: [],
          state: "active" as const
        }
      ]
    };
    const permuted = {
      ...second,
      resources: [...second.resources].reverse(),
      modeGoals: [...second.modeGoals].reverse().map((goal) => ({
        ...goal,
        targetActorIds: [...goal.targetActorIds].reverse(),
        targetAccessNodeIds: [...goal.targetAccessNodeIds].reverse()
      }))
    };

    const canonicalSecond = canonicalizeAiObservation(second);
    const canonicalPermuted = canonicalizeAiObservation(permuted);
    expect(serializeCanonicalAiValue(canonicalSecond)).toBe(serializeCanonicalAiValue(canonicalPermuted));
    expect(digestCanonicalAiValue(canonicalSecond)).toBe(digestCanonicalAiValue(canonicalPermuted));
  });

  it("rejects invalid numeric values during canonical serialization", () => {
    expect(() => serializeCanonicalAiValue({ score: Number.NaN })).toThrow("invalid_ai_number:$.score");
  });

  it("migrates a legacy save from current-world satisfied steps", () => {
    const migrated = migrateAiBrainState({ blackboard: {}, enabled: true }, migrationContext);
    expect(migrated.schemaVersion).toBe(1);
    expect(migrated.opening.plan.steps.map((step) => step.stepId)).toEqual(["step:producer", "step:worker"]);
    expect(migrated.opening.plan.steps.every((step) => step.state === "completed")).toBe(true);
    expect("blackboard" in migrated).toBe(false);
  });

  it("marks an already-running legacy save past opening so restore cannot replay it", () => {
    const migrated = migrateAiBrainState(
      { blackboard: {}, enabled: true },
      { ...migrationContext, legacyOpeningLifecycle: "completed" }
    );
    expect(migrated.strategy.stance).toBe("stabilize");
    expect(migrated.strategy.goalId).toBeNull();
    expect(migrated.opening.plan.lifecycle).toBe("completed");
  });

  it("canonicalizes equivalent state sets without changing ordered RNG state", () => {
    const state = migrateAiBrainState({ blackboard: {} }, migrationContext);
    const permuted = {
      ...state,
      opening: { ...state.opening, plan: { ...state.opening.plan, steps: [...state.opening.plan.steps].reverse() } },
      lanes: [...state.lanes].reverse()
    };
    expect(digestCanonicalAiValue(canonicalizeAiBrainState(state))).toBe(
      digestCanonicalAiValue(canonicalizeAiBrainState(permuted))
    );
    expect(canonicalizeAiBrainState(permuted).scheduler.rngState).toEqual(state.scheduler.rngState);
  });

  it("includes the committed economy posture and workforce rationale in state digests", () => {
    const state = migrateAiBrainState({ blackboard: {} }, migrationContext);
    const withPolicy = {
      ...state,
      economyProduction: {
        ...state.economyProduction,
        posture: { status: "safe" as const, enteredTick: 40, lastThreatTick: null },
        workforce: {
          workers: 6, queuedWorkers: 1, assignedWorkers: 5, desiredWorkers: 8,
          desiredFoodSources: 4, foodRunwayTicks: 300, blocker: null,
          economyPermille: 650, defensePermille: 350
        }
      }
    };
    const baseline = digestCanonicalAiValue(canonicalizeAiBrainState(withPolicy));
    expect(baseline).not.toBe(digestCanonicalAiValue(canonicalizeAiBrainState(state)));
    expect(baseline).not.toBe(digestCanonicalAiValue(canonicalizeAiBrainState({
      ...withPolicy,
      economyProduction: {
        ...withPolicy.economyProduction,
        posture: { status: "pressured" as const, enteredTick: 40, lastThreatTick: 40 }
      }
    })));
  });

  it("rejects unsupported future state instead of silently resetting", () => {
    expect(() => migrateAiBrainState({ schemaVersion: 2 }, migrationContext)).toThrow(
      new AiBrainMigrationError("unsupported_future_schema", "2")
    );
  });
});
