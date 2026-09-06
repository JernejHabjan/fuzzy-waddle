import { FactionType, ProbableWaffleAiDifficulty, ResourceType } from "@fuzzy-waddle/probable-waffle-protocol";
import {
  canonicalizeAiBrainStateV1,
  canonicalizeAiObservationV1,
  digestCanonicalAiValue,
  serializeCanonicalAiValue
} from "./canonical-ai-serialization";
import { createAiProfileConfigV1 } from "../profiles/ai-profile-defaults";
import { migrateAiBrainState, AiBrainMigrationError } from "./migrate-ai-brain-state";
import { createStage2Observation } from "../testing/ai-stage-2-test-fixtures";

describe("Stage 2 canonical state and migration", () => {
  const profile = createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium);
  const migrationContext = {
    playerNumber: 1,
    faction: FactionType.Tivara,
    profile,
    tick: 40,
    archetypeId: "balanced",
    satisfiedOpeningStepIds: ["step:producer", "step:worker"] as const
  };

  it("serializes and digests equivalent permuted observations identically", () => {
    const first = createStage2Observation();
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

    const canonicalSecond = canonicalizeAiObservationV1(second);
    const canonicalPermuted = canonicalizeAiObservationV1(permuted);
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

  it("canonicalizes equivalent state sets without changing ordered RNG state", () => {
    const state = migrateAiBrainState({ blackboard: {} }, migrationContext);
    const permuted = {
      ...state,
      opening: { ...state.opening, plan: { ...state.opening.plan, steps: [...state.opening.plan.steps].reverse() } },
      lanes: [...state.lanes].reverse()
    };
    expect(digestCanonicalAiValue(canonicalizeAiBrainStateV1(state))).toBe(
      digestCanonicalAiValue(canonicalizeAiBrainStateV1(permuted))
    );
    expect(canonicalizeAiBrainStateV1(permuted).scheduler.rngState).toEqual(state.scheduler.rngState);
  });

  it("rejects unsupported future state instead of silently resetting", () => {
    expect(() => migrateAiBrainState({ schemaVersion: 2 }, migrationContext)).toThrow(
      new AiBrainMigrationError("unsupported_future_schema", "2")
    );
  });
});
