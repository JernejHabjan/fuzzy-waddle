import { classifyPlayerPawnOrderTerminalOutcome } from "./player-pawn-order-terminal-outcome";

describe("classifyPlayerPawnOrderTerminalOutcome", () => {
  it.each([
    "EnterContainer:AlreadyLoaded",
    "EnterContainer:Boarded",
    "EnterContainer:MovedToShore",
    "Attack - Target Not Alive",
    "Move - Reached Target",
    "Stop - Order Complete",
    "Gather - No Resources Exist",
    "Repair - Target Health Full",
    "Heal - Target Health Full"
  ])("classifies an achieved terminal state as completed: %s", (reason) => {
    expect(classifyPlayerPawnOrderTerminalOutcome(reason)).toEqual({ kind: "completed", reason: "applied" });
  });

  it.each([
    "Attack - No Attack Component",
    "Gather - No Harvest Component",
    "Build - Cannot Assign Builder",
    "Build - Target Unreachable",
    "Repair - Construction Not Finished",
    "Heal - Cannot Heal",
    "MoveToLocation",
    "actor destroyed before order completion",
    "a future unknown stop reason"
  ])("fails closed for an unachieved or unknown terminal state: %s", (reason) => {
    expect(classifyPlayerPawnOrderTerminalOutcome(reason)).toEqual({
      kind: "failed",
      reason: "application_failed"
    });
  });

  it("preserves explicit cancellation", () => {
    expect(classifyPlayerPawnOrderTerminalOutcome("order cancelled by replacement")).toEqual({
      kind: "cancelled",
      reason: "cancelled"
    });
  });
});
