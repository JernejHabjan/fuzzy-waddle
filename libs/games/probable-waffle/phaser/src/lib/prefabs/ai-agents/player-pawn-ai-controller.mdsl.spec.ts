import { BehaviourTree, State, type Agent } from "mistreevous";
import { PlayerPawnAiControllerMdsl } from "./player-pawn-ai-controller.mdsl";

describe("PlayerPawnAiControllerMdsl move orders", () => {
  it("completes an order after movement reaches a congestion fallback", () => {
    const agent = createMoveAgent({
      inRangeResult: State.FAILED,
      moveResult: State.SUCCEEDED
    });

    stepTree(agent);

    expect(agent.Stop).toHaveBeenCalledTimes(1);
    expect(agent.Stop).toHaveBeenCalledWith("Move - Completed");
    expect(agent.InRange).not.toHaveBeenCalled();
  });

  it("keeps an order retryable when movement cannot complete a route", () => {
    const agent = createMoveAgent({
      inRangeResult: State.FAILED,
      moveResult: State.FAILED
    });

    stepTree(agent);

    expect(agent.Stop).not.toHaveBeenCalled();
    expect(agent.InRange).toHaveBeenCalledWith("move");
  });

  it("still completes an order when the actor is already at the requested destination", () => {
    const agent = createMoveAgent({
      inRangeResult: State.SUCCEEDED,
      moveResult: State.FAILED
    });

    stepTree(agent);

    expect(agent.Stop).toHaveBeenCalledTimes(1);
    expect(agent.Stop).toHaveBeenCalledWith("Move - Reached Target");
  });
});

/**
 * Creates the narrow agent surface needed to exercise the shared move-order branch through its real root tree.
 */
function createMoveAgent({
  inRangeResult,
  moveResult
}: {
  inRangeResult: State;
  moveResult: State;
}) {
  return {
    IsStunned: jest.fn(() => false),
    OrderExistsInQueue: jest.fn(() => false),
    PlayerOrderIs: jest.fn((orderType: string) => orderType === "move"),
    TargetOrLocationExists: jest.fn(() => true),
    LeaveConstructionSiteOrCurrentContainer: jest.fn(() => State.FAILED),
    MoveToTargetOrLocation: jest.fn(() => moveResult),
    InRange: jest.fn(() => inRangeResult),
    Stop: jest.fn(() => State.SUCCEEDED)
  } satisfies Agent;
}

/** Runs the production MDSL once so ordering and decorators are covered by the regression test. */
function stepTree(agent: Agent) {
  new BehaviourTree(PlayerPawnAiControllerMdsl, agent).step();
}
