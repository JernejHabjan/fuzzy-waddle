import type { AiRuntimeProductionFactV1 } from "./ai-runtime-production-fact-v1";
import { AI_RUNTIME_MAX_FACTS, appendAiRuntimeProductionFact } from "./append-ai-runtime-production-fact";
import type { AiRuntimeProductionBoundaryState } from "./ai-runtime-production-boundary-state";

describe("runtime production fact budget", () => {
  it("retains a full long-horizon combat capture then records overflow", () => {
    const facts: AiRuntimeProductionFactV1[] = [];
    let losses = 0;
    let dropped = 0;
    const fact: AiRuntimeProductionFactV1 = {
      kind: "resource_need_fence",
      reason: "fixture",
      tick: 0,
      playerNumber: 2,
      sequence: 0
    };

    for (let sequence = 1; sequence <= AI_RUNTIME_MAX_FACTS + 1; sequence += 1) {
      appendAiRuntimeProductionFact(
        facts,
        fact,
        sequence,
        () => ({
          resources: null,
          brain: null,
          pendingCommands: [],
          pendingResourceClaims: null,
          queues: null,
          obligations: null,
          gaps: []
        } satisfies AiRuntimeProductionBoundaryState),
        () => (losses += 1),
        () => (dropped += 1)
      );
    }

    expect(AI_RUNTIME_MAX_FACTS).toBe(36_864);
    expect(facts).toHaveLength(36_864);
    expect(losses).toBe(1);
    expect(dropped).toBe(1);
  });
});
