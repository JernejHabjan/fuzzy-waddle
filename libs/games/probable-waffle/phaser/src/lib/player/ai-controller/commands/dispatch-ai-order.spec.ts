import { getAiOrderDispatchResult } from "./dispatch-ai-order";

describe("AI order dispatch preconditions", () => {
  it.each([
    [{ isHost: false, hasCommandBus: true, actorId: "unit", requiresTargetId: false }, "non_host"],
    [{ isHost: true, hasCommandBus: false, actorId: "unit", requiresTargetId: false }, "missing_command_bus"],
    [{ isHost: true, hasCommandBus: true, requiresTargetId: false }, "missing_actor_id"],
    [{ isHost: true, hasCommandBus: true, actorId: "unit", requiresTargetId: true }, "missing_target_id"]
  ])("reports %s", (preconditions, reason) => {
    expect(getAiOrderDispatchResult(preconditions)).toEqual({ status: "dropped", reason });
  });

  it("accepts a fully addressable command", () => {
    expect(
      getAiOrderDispatchResult({
        isHost: true,
        hasCommandBus: true,
        actorId: "unit",
        requiresTargetId: true,
        targetId: "target"
      })
    ).toEqual({ status: "dispatched", reason: "command_dispatched" });
  });
});
