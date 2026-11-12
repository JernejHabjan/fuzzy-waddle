import type { PlayerAiController } from "../../../../player/ai-controller/player-ai-controller";
import { selectAiDebugSnapshot } from "./select-ai-debug-snapshot";

describe("AI debug snapshot selection", () => {
  it("does not copy the entire retained history for the live panel", () => {
    const live = { decisionSequence: 3 };
    const controller = {
      getBrainDebugSnapshot: jest.fn(() => live),
      getBrainDebugHistory: jest.fn(() => { throw new Error("history should stay cold"); })
    } as unknown as PlayerAiController;

    expect(selectAiDebugSnapshot(controller, 0)).toEqual({ snapshot: live, historyOffset: 0 });
    expect(controller.getBrainDebugHistory).not.toHaveBeenCalled();
  });

  it("clamps a historical selection to the retained decision range", () => {
    const first = { decisionSequence: 1 };
    const latest = { decisionSequence: 2 };
    const controller = {
      getBrainDebugSnapshot: jest.fn(() => latest),
      getBrainDebugHistory: jest.fn(() => [first, latest])
    } as unknown as PlayerAiController;

    expect(selectAiDebugSnapshot(controller, 5)).toEqual({ snapshot: first, historyOffset: 1 });
    expect(controller.getBrainDebugSnapshot).not.toHaveBeenCalled();
  });
});
