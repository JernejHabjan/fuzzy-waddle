import { expect, test } from "@playwright/test";
import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainState } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/state/create-ai-brain-state";
import { createAiProfileConfig } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import type { AiRuntimeProductionFact } from
  "@fuzzy-waddle/probable-waffle-phaser/player/ai-controller/test-support/production/lifecycle/ai-runtime-production-fact";
import { nativeRecoveryCommonFailures } from "./skirmish-ai-native-recovery-evidence";

/** Synthetic reader negatives only; a trace can never manufacture delivered income or authorize a technical concession. */
test("reassuring selected recovery state without physical income is not a native recovery outcome", () => {
  const state = createAiBrainState({ playerNumber: 2, faction: FactionType.Tivara,
    profile: createAiProfileConfig(ProbableWaffleAiDifficulty.Medium), tick: 0, archetypeId: "balanced" });
  const frame = { kind: "decision_selected", sequence: 1, tick: 0, playerNumber: 2,
    decision: { identity: { playerNumber: 2, tick: 0, generation: 1, decisionSequence: 1, authorityEpoch: 1 },
      acceptedIntents: [], decisions: [], reservations: [], economyProduction: state.economyProduction, missionState: state }
  } satisfies Extract<AiRuntimeProductionFact, { kind: "decision_selected" }>;
  expect(nativeRecoveryCommonFailures({ frames: [frame], capture: undefined }))
    .toContain("recovery_unrelated_native_income_missing");
  const unavailable = { ...frame, decision: { ...frame.decision, missionState: undefined } };
  expect(nativeRecoveryCommonFailures({ frames: [unavailable], capture: undefined }))
    .toContain("recovery_complete_selected_ownership_missing");
});
