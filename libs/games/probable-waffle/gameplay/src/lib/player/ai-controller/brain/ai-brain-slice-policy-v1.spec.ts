import { AI_BRAIN_SLICE_POLICIES_V1, type AiBrainSliceNameV1 } from "./ai-brain-slice-policy-v1";

describe("AI_BRAIN_SLICE_POLICIES_V1", () => {
  it("assigns every persisted V1 slice exactly one owner/default/migration/serializer", () => {
    const expected = [
      "strategy",
      "opening",
      "knowledge",
      "bases",
      "economyProduction",
      "reservations",
      "waitEdges",
      "pendingOutcomes",
      "authority",
      "squads",
      "transport",
      "fortifications",
      "support",
      "progress",
      "blockers",
      "recoveryEpisodes",
      "lanes",
      "queries",
      "scheduler",
      "identities"
    ] satisfies readonly AiBrainSliceNameV1[];
    const actual = AI_BRAIN_SLICE_POLICIES_V1.map((entry) => entry.slice);
    expect(new Set(actual).size).toBe(actual.length);
    expect([...actual].sort()).toEqual([...expected].sort());
    for (const entry of AI_BRAIN_SLICE_POLICIES_V1) {
      expect(entry.reducerOwner).not.toHaveLength(0);
      expect(entry.defaultOwner).toBe("createAiBrainStateV1");
      expect(entry.migration).toBe("preserve_v1_or_bootstrap_from_current_world");
      expect(entry.serializer).toBe("canonical_ai_v1");
    }
  });
});
