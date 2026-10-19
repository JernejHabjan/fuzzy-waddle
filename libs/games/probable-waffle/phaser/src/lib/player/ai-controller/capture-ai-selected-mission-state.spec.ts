import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import { createAiBrainStateV1 } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import { captureAiSelectedMissionState } from "./capture-ai-selected-mission-state";

it("retains causal and transport ownership with the selected mission boundary", () => {
  const state = createAiBrainStateV1({ playerNumber: 2, faction: FactionType.Tivara,
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium), tick: 0, archetypeId: "balanced" });
  const sample = captureAiSelectedMissionState(state);
  expect(sample?.recovery).toEqual(state.recovery);
  expect(sample?.blockers).toEqual(state.blockers);
  expect(sample?.transport).toEqual(state.transport);
});

it("fails the whole selected boundary rather than truncating causal ownership", () => {
  const state = createAiBrainStateV1({ playerNumber: 2, faction: FactionType.Tivara,
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium), tick: 0, archetypeId: "balanced" });
  const record = { recoveryKey: "original", domain: "squad" as const, planId: null, actorId: null,
    cause: "route", enteredTick: 0, lastProgressTick: 0, nextRetryTick: 200,
    phaseDeadline: { clock: "simulation" as const, unit: "tick" as const, dueTick: 1200, persistence: "save" as const },
    attempt: 0, state: "watching" as const, alternate: null, releasedClaimIds: [] };
  expect(captureAiSelectedMissionState({ ...state, recovery: { records: Array(65).fill(record) } })).toBeNull();
});
