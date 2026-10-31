import { expect, test } from "@playwright/test";
import { nativeDifficultyProfile } from "./skirmish-ai-native-difficulty-profile";
import { nativeDifficultySelectionFailures } from "./skirmish-ai-native-difficulty-evaluation";
import { productionConsumedDecisionFixture } from "./skirmish-ai-runtime-production-consumed-decision-fixture";
import type { nativeScenarioContext } from "./skirmish-ai-native-scenario-context";
import { pendingCommandIntent } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/testing/ai-runtime-pending-command-fixtures";

/** Predicate-only controls; these are synthetic decision histories, never evidence of a played native world. */
function selections(branch: string): ReturnType<typeof nativeScenarioContext>["frames"] {
  const profile = nativeDifficultyProfile(branch), interval = profile.decisionIntervalTicks;
  return Array.from({ length: 2000 / interval }, (_, index) => {
    const tick = (index + 1) * interval, fixture = productionConsumedDecisionFixture(tick, index + 1, index);
    return { ...fixture.selected, decision: { ...fixture.selected.decision,
      persistedProfile: { profileVersion: profile.profileVersion, profileDifficulty: profile.difficulty }, input: {
      ...fixture.input, profile, cadence: { ...fixture.input.cadence, configuredIntervalTicks: interval }
    } } };
  });
}

for (const branch of ["easy", "normal", "hard"]) {
  test(`D-01 ${branch} requires complete independent profile and actual scheduler evidence`, () => {
    expect(nativeDifficultySelectionFailures(branch, selections(branch))).toEqual([]);
    const missing = selections(branch);
    missing.splice(2, 1);
    expect(nativeDifficultySelectionFailures(branch, missing)).toContain("difficulty_complete_cadence_missing");
    const drifted = selections(branch).map((frame) => ({ ...frame, decision: { ...frame.decision,
      input: frame.decision.input ? { ...frame.decision.input,
        profile: { ...nativeDifficultyProfile(branch), maxDetailedPathQueriesPerStep: 999 } } : undefined } }));
    expect(nativeDifficultySelectionFailures(branch, drifted)).toContain("difficulty_consumed_versioned_profile_mismatch");
  });
}

test("D-01 names cannot hide Normal scheduling, absent policy, duplicated selections or a quota breach", () => {
  expect(nativeDifficultySelectionFailures("easy", selections("normal"))).toContain("difficulty_actual_cadence_mismatch");
  const absent = selections("easy").map((frame) => ({ ...frame, decision: { ...frame.decision,
    input: frame.decision.input ? { ...frame.decision.input, profile: undefined } : undefined } }));
  expect(nativeDifficultySelectionFailures("easy", absent)).toContain("difficulty_consumed_versioned_profile_mismatch");
  const stale = selections("easy").map((frame) => ({ ...frame,
    decision: { ...frame.decision, persistedProfile: { profileVersion: "old-policy", profileDifficulty: "easy" as const } } }));
  expect(nativeDifficultySelectionFailures("easy", stale)).toContain("difficulty_selected_brain_profile_mismatch");
  const duplicate = selections("easy");
  const first = duplicate[0];
  if (!first) throw new Error("synthetic_difficulty_selection_missing");
  duplicate[1] = first;
  expect(nativeDifficultySelectionFailures("easy", duplicate)).toContain("difficulty_actual_cadence_mismatch");
  const breached = selections("easy"), acceptedIntents = Array.from({ length: 5 }, (_, index) => pendingCommandIntent(`${index}`));
  breached[0] = { ...first, decision: { ...first.decision, acceptedIntents,
    decisions: acceptedIntents.map((intent) => ({ intent, outcome: "accepted", reason: "accepted" })) } };
  expect(nativeDifficultySelectionFailures("easy", breached)).toContain("difficulty_selected_command_quota_or_lineage_mismatch");
  breached[0] = { ...first, decision: { ...first.decision, acceptedIntents: [pendingCommandIntent()], decisions: [] } };
  expect(nativeDifficultySelectionFailures("easy", breached)).toContain("difficulty_selected_command_quota_or_lineage_mismatch");
});
