import { AiDecisionTrace } from "./ai-decision-trace";

describe("AI decision trace", () => {
  it("serializes trace IDs and events deterministically", () => {
    const trace = new AiDecisionTrace(2, 3);
    trace.record("gather", "dispatched", "command_dispatched");
    trace.record("research", "failed", "no_legal_research");

    expect(trace.snapshot()).toEqual({
      playerNumber: 2,
      eventLimit: 3,
      nextSequence: 2,
      events: [
        { traceId: "ai:2:0", sequence: 0, action: "gather", outcome: "dispatched", reason: "command_dispatched" },
        { traceId: "ai:2:1", sequence: 1, action: "research", outcome: "failed", reason: "no_legal_research" }
      ]
    });
    expect(trace.serialize()).toBe(trace.serialize());
  });

  it("retains a bounded history while decision IDs remain monotonic", () => {
    const trace = new AiDecisionTrace(1, 2);
    trace.record("first", "failed", "no_idle_workers");
    trace.record("second", "failed", "no_active_gatherers");
    trace.record("third", "failed", "missing_actor_id");

    expect(trace.snapshot().events.map((event) => event.traceId)).toEqual(["ai:1:1", "ai:1:2"]);
  });
});
