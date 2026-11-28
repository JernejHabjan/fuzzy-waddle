import { getWaterSeagullFlightDirection } from "./water-seagull.behavior";

describe("water seagull behavior", () => {
  it("flies horizontally away from the triggering actor with a deterministic overlap fallback", () => {
    expect(getWaterSeagullFlightDirection(100, 200)).toBe(-1);
    expect(getWaterSeagullFlightDirection(200, 100)).toBe(1);
    expect(getWaterSeagullFlightDirection(100, 100)).toBe(1);
  });
});
