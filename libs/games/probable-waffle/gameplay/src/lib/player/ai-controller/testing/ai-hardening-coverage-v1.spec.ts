import { AI_HARDENING_COVERAGE_V1 } from "./ai-hardening-coverage-v1";

describe("AI_HARDENING_COVERAGE_V1", () => {
  it("accounts for H1-H9 and every H-01 through H-32 final case exactly once", () => {
    expect(AI_HARDENING_COVERAGE_V1.map((entry) => entry.contractId)).toEqual([
      "H1",
      "H2",
      "H3",
      "H4",
      "H5",
      "H6",
      "H7",
      "H8",
      "H9"
    ]);
    const cases = AI_HARDENING_COVERAGE_V1.flatMap((entry) => entry.finalScenarioIds);
    const expected = Array.from({ length: 32 }, (_, index) => `H-${String(index + 1).padStart(2, "0")}`);
    expect(new Set(cases).size).toBe(32);
    expect([...cases].sort()).toEqual(expected.sort());
    for (const entry of AI_HARDENING_COVERAGE_V1) {
      expect(entry.contractOwner).not.toHaveLength(0);
      expect(entry.implementationStages.length).toBeGreaterThan(0);
      expect(entry.persistencePath).not.toHaveLength(0);
      expect(entry.debugField).not.toHaveLength(0);
      expect(entry.focusedTest).not.toHaveLength(0);
    }
  });
});
