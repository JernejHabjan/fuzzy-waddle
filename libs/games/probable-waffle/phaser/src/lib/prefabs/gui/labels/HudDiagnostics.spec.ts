import { countRollingActions, formatElapsed } from "./HudDiagnostics";

describe("HudDiagnostics metrics", () => {
  it("counts committed actions in the rolling simulation minute", () => {
    expect(countRollingActions([1, 100, 1_199, 1_200, 1_300], 1_300)).toBe(4);
  });

  it("formats deterministic simulation ticks as elapsed time", () => {
    expect(formatElapsed(1_220)).toBe("01:01");
  });
});
