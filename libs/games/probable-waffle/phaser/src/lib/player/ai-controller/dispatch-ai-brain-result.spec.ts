import Phaser from "phaser";
import { FactionType, ProbableWaffleAiDifficulty } from "@fuzzy-waddle/probable-waffle-protocol";
import type { AiBrainStepResultV1 } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/ai-brain-step-result-v1";
import { createAiBrainStateV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/brain/create-ai-brain-state-v1";
import { createAiProfileConfigV1 } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/profiles/ai-profile-defaults";
import { createAiTestObservation } from "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/testing/ai-test-fixtures";
import { projectAiDebugSnapshot } from
  "@fuzzy-waddle/probable-waffle-gameplay/player/ai-controller/debug/project-ai-debug-snapshot";
import type { ProbableWaffleScene } from "../../core/probable-waffle.scene";
import { AI_DECISION_DISPATCH_EVENT, type AiDecisionDispatchEvent } from "./ai-decision-dispatch-event";
import { dispatchAiBrainResult } from "./dispatch-ai-brain-result";
import { dispatchAiIntents } from "./ai-intent-dispatcher";
import { pendingCommandIntent } from "./testing/ai-runtime-pending-command-fixtures";

jest.mock("./ai-intent-dispatcher", () => ({ dispatchAiIntents: jest.fn() }));

/** Synthetic result shape, deliberately separate from proof that the real planner selected useful runtime work. */
function fixture(empty = false) {
  const state = createAiBrainStateV1({ playerNumber: 2, faction: FactionType.Tivara, tick: 99, archetypeId: "balanced",
    profile: createAiProfileConfigV1(ProbableWaffleAiDifficulty.Medium) });
  const acceptedIntents = empty ? [] : [pendingCommandIntent()];
  const decisions = acceptedIntents.map((intent) => ({ outcome: "accepted" as const, reason: "accepted" as const, intent }));
  const result = { nextState: state, acceptedIntents, decisions, trace: decisions,
    debugSnapshot: projectAiDebugSnapshot({ ...createAiTestObservation(), playerNumber: 2, tick: 99, generation: 7 },
      state, decisions) } satisfies AiBrainStepResultV1;
  const events = new Phaser.Events.EventEmitter();
  const scene = { events } as unknown as ProbableWaffleScene;
  return { scene, events, result, authority: { ...state.authority, authorityEpoch: 3 } };
}

describe("dispatchAiBrainResult", () => {
  beforeEach(() => jest.mocked(dispatchAiIntents).mockReset());

  it("preserves ordinary dispatch without building diagnostic identity when no listener is installed", () => {
    const f = fixture();
    dispatchAiBrainResult(f.scene, 2, f.result, f.authority);
    expect(dispatchAiIntents).toHaveBeenCalledWith(f.scene, 2, f.result.acceptedIntents);
  });

  it("publishes detached native result before dispatch and passes the same identity to every accepted command", () => {
    const f = fixture();
    const records: AiDecisionDispatchEvent[] = [];
    const order: string[] = [];
    f.events.on(AI_DECISION_DISPATCH_EVENT, (event: AiDecisionDispatchEvent) => { records.push(event); order.push("selected"); });
    jest.mocked(dispatchAiIntents).mockImplementation(() => { order.push("dispatch"); });
    dispatchAiBrainResult(f.scene, 2, f.result, f.authority);
    expect(order).toEqual(["selected", "dispatch"]);
    expect(records[0].identity).toEqual({ playerNumber: 2, tick: 99, generation: 7, decisionSequence: 0, authorityEpoch: 3 });
    expect(records[0].acceptedIntents).toEqual(f.result.acceptedIntents);
    expect(records[0].acceptedIntents).not.toBe(f.result.acceptedIntents);
    expect(records[0].reservations).not.toBe(f.result.nextState.reservations);
    expect(dispatchAiIntents).toHaveBeenCalledWith(f.scene, 2, f.result.acceptedIntents, records[0].identity);
  });

  it("retains empty decisions and preserves exceptions from ordinary dispatch", () => {
    const f = fixture(true);
    const records: AiDecisionDispatchEvent[] = [];
    f.events.on(AI_DECISION_DISPATCH_EVENT, (event: AiDecisionDispatchEvent) => records.push(event));
    const failure = new Error("shared_dispatch_failed");
    jest.mocked(dispatchAiIntents).mockImplementation(() => { throw failure; });
    expect(() => dispatchAiBrainResult(f.scene, 2, f.result, f.authority)).toThrow(failure);
    expect(records[0].acceptedIntents).toEqual([]);
    expect(records[0].decisions).toEqual([]);
  });
});
