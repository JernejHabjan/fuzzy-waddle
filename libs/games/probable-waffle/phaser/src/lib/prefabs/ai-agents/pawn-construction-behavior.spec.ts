import { BehaviourTree, State } from "mistreevous";
import { PawnConstructionBehaviorMdsl } from "./pawn-construction-behavior.mdsl";
import { classifyPlayerPawnOrderTerminalOutcome } from "./player-pawn-order-terminal-outcome";

/** Exercises the real build branch when native completion races a worker's arrival. */
function fixture(finished: boolean, assignable: boolean, alive = true) {
  const agent = {
    PlayerOrderIs: (kind: string) => kind === "build",
    TargetExists: () => true,
    TargetIsAlive: () => alive,
    SelfIsAlive: () => true,
    HasBuilderComponent: () => true,
    ConstructionSiteFinished: () => finished,
    CanAssignBuilder: () => assignable,
    CooldownReady: () => true,
    InRange: () => State.SUCCEEDED,
    Stop: jest.fn(() => State.SUCCEEDED),
    LeaveConstructionSiteOrCurrentContainer: () => State.SUCCEEDED,
    MoveToTarget: () => State.SUCCEEDED,
    ConstructBuilding: jest.fn(() => State.SUCCEEDED),
    AutoAssignTendOrderIfTendable: jest.fn(() => State.SUCCEEDED),
    AssignNextBuildOrder: jest.fn(() => State.SUCCEEDED)
  };
  const tree = new BehaviourTree(`root { branch [Build] }\n${PawnConstructionBehaviorMdsl}`, agent);
  return { agent, tree };
}

describe("native construction completion ordering", () => {
  it("completes a build order whose live target finished before the worker arrived", () => {
    const { agent, tree } = fixture(true, false);
    tree.step();
    expect(agent.Stop).toHaveBeenCalledWith("Build - Construction Finished");
    expect(classifyPlayerPawnOrderTerminalOutcome("Build - Construction Finished")).toEqual({
      kind: "completed",
      reason: "applied"
    });
    expect(agent.ConstructBuilding).not.toHaveBeenCalled();
    expect(agent.AutoAssignTendOrderIfTendable).toHaveBeenCalledTimes(1);
    expect(agent.AssignNextBuildOrder).toHaveBeenCalledTimes(1);
  });

  it("keeps unavailable unfinished sites failed rather than inventing completion", () => {
    const { agent, tree } = fixture(false, false);
    tree.step();
    expect(agent.Stop).toHaveBeenCalledWith("Build - Cannot Assign Builder");
    expect(agent.AssignNextBuildOrder).not.toHaveBeenCalled();
  });

  it("does not treat a dead completed target as live construction success", () => {
    const { agent, tree } = fixture(true, false, false);
    tree.step();
    expect(agent.Stop).toHaveBeenCalledWith("Build - Cannot Assign Builder");
    expect(agent.AutoAssignTendOrderIfTendable).not.toHaveBeenCalled();
  });

  it("continues actual construction when the unfinished target accepts a builder", () => {
    const { agent, tree } = fixture(false, true);
    tree.step();
    expect(agent.Stop).not.toHaveBeenCalled();
    expect(agent.ConstructBuilding).toHaveBeenCalledTimes(1);
  });
});
