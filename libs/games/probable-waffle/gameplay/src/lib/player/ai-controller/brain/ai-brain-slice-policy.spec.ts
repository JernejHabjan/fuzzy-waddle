import { AI_BRAIN_SLICE_POLICIES, type AiBrainSliceName } from "./ai-brain-slice-policy";

describe("AI_BRAIN_SLICE_POLICIES", () => {
  it("assigns every persisted current slice exactly one owner/default/migration/serializer", () => {
    const expected = [
      "strategy",
      "opening",
      "knowledge",
      "skirmish",
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
    ] satisfies readonly AiBrainSliceName[];
    const actual = AI_BRAIN_SLICE_POLICIES.map((entry) => entry.slice);
    expect(new Set(actual).size).toBe(actual.length);
    expect([...actual].sort()).toEqual([...expected].sort());
    for (const entry of AI_BRAIN_SLICE_POLICIES) {
      expect(entry.reducerOwner).not.toHaveLength(0);
      expect(entry.defaultOwner).toBe("createAiBrainState");
      expect(entry.migration).toBe("preserve_current_or_bootstrap_from_current_world");
      expect(entry.serializer).toBe("canonical_ai");
    }
  });
});
