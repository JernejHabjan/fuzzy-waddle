import { AI_CAPABILITY_COVERAGE_MANIFEST_V1 } from "./ai-capability-coverage-manifest-v1";

describe("AI_CAPABILITY_COVERAGE_MANIFEST_V1", () => {
  it("has unique families and every required seam has an accountable disposition", () => {
    const families = AI_CAPABILITY_COVERAGE_MANIFEST_V1.map((entry) => entry.family);
    expect(new Set(families).size).toBe(families.length);
    expect(families).toEqual(
      expect.arrayContaining([
        "attack_target_domains",
        "water_navigation",
        "flight",
        "container_transport",
        "conversion",
        "scenario_editor_injected_conversion"
      ])
    );
    for (const entry of AI_CAPABILITY_COVERAGE_MANIFEST_V1) {
      for (const seam of ["observation", "proposer", "command", "outcome", "save", "debug", "fixture"] as const) {
        const disposition = entry[seam];
        expect(disposition.status).toMatch(/implemented|planned|unsupported|not_applicable/);
        if (disposition.status === "planned") expect(disposition.stage).toBeGreaterThanOrEqual(3);
        if (disposition.status === "unsupported" || disposition.status === "not_applicable") {
          expect(disposition.reason.length).toBeGreaterThan(0);
        }
      }
    }
  });
});
